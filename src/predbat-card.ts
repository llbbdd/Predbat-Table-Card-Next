import { cardHeight, restApiPort } from './constants';
import { configForm } from './schemas/configForm';
import { HomeAssistantService } from './services/home-assistant-service';
import { WeatherService } from './services/weather-service';
import type { HomeAssistant, PredbatTableCardConfig, StubConfig } from './types/home-assistant';
import { ConfigManager } from './utils/config-manager';
import { TableRenderer } from './utils/TableRenderer';
import { tableStyles } from './styles/table-styles';
import { modalStyles } from './styles/modal-styles';
import { divElement, getVersionRowElement, haCardElement, styleElement, toggleCarCharging, toggleGeneratingPlan } from './utils/html-utils';
import { PredbatRestApiService } from './services/predbat-service';
import { PredbatData } from './PredbatData';

type PlanStatus = 'waiting' | 'failed' | 'available';

class PredbatTableCard extends HTMLElement {
  private _haService = new HomeAssistantService();
  private _predbatRestApiService: PredbatRestApiService | null = null;
  private _configManager: ConfigManager = new ConfigManager();
  private _tableRenderer: TableRenderer = new TableRenderer(this._configManager);
  private _weatherService = new WeatherService();
  private _planData: PredbatData | null = null;
  private _planStatus: PlanStatus = 'waiting';
  private _restApiAvailable = false;
  private _lastPlanUpdated: string | null = null;

  // reactive data
  private _reactiveDataState: { overrides: string | null, generatingPlan: boolean, carCharging: 'on' | 'off' | undefined } = {
    overrides: null,
    generatingPlan: false,
    carCharging: undefined
  };

  //  * New card config data received from home assistant
  public setConfig(config: PredbatTableCardConfig): void {
    this._configManager.config = config;
    this._haService.dayLimit = this._configManager.dayLimit;

    if (!this._weatherService.subscribed) {
      this._weatherService.subscribe(this._configManager.weatherEntity)
        .catch((error) => {
          this._tableRenderer.renderError(error);
        });
    }

    if (this._configManager.carChargeSwitch !== this._reactiveDataState.carCharging) {
      this._reactiveDataState.carCharging = this._configManager.carChargeSwitch;

      toggleCarCharging(this, this._reactiveDataState.carCharging);
    }

    this._reactiveDataState.carCharging = this._configManager.carChargeSwitch;

    this._initialiseRestApi();
  }

  // * New state received from Home Assistant
  public set hass(hass: HomeAssistant) {
    this._haService.hass = hass;
    this._weatherService.connection = hass.connection;

    if (this._configManager.weatherEntity !== undefined) this._weatherService.temperatureUnit = this._haService.getState(this._configManager.weatherEntity).attributes;

    this._weatherService.sun = this._haService.sun;

    this._tableRenderer.callSelectOptionService = this._haService.callSelectOptionService;
    this._tableRenderer.callInputNumberSetService = this._haService.callInputNumberSetService;
    this._tableRenderer.state = this._haService.getAllState();

    // Render on reactive state changes
    const currentOverrideState = this._getOverrideStateString();

    if (currentOverrideState !== this._reactiveDataState.overrides || this._haService.generatingPlan !== this._reactiveDataState.generatingPlan) {
      this._reactiveDataState.overrides = currentOverrideState;
      this._reactiveDataState.generatingPlan = this._haService.generatingPlan;

      toggleGeneratingPlan(this, this._haService.generatingPlan);

      this._render();
    }

    // Get data from state if no REST API is available
    if (!this._restApiAvailable) {
      const planEntityState = hass.states[this._configManager.planEntity];

      if (planEntityState === undefined) {
        // Config entity ID is valid, but HA has no state for it — Predbat hasn't produced a plan
        if (this._planStatus !== 'failed') {
          this._planStatus = 'failed';
          this._render();
        }
      }
      else {
        try {
          const predbatData = this._haService.getPredbatData(planEntityState.entity_id);

          if (predbatData !== null) {
            this._planStatus = 'available';
            this.setPlanData(predbatData);
            this._lastPlanUpdated = planEntityState.last_updated;
            this._render();
          }
        }
        catch {
          if (this._planStatus !== 'failed') {
            this._planStatus = 'failed';
            this._render();
          }
        }
      }
    }
  }

  // * Pass card config form back to Home Assistant
  public static getConfigForm(): object {
    return configForm;
  }

  // * Pass card height back to Home Assistant
  public getCardSize(): number {
    return cardHeight;
  }

  // * Provides default configuration template for Home Assistant visual card picker
  public static getStubConfig(): StubConfig {
    return {
      'columns': [
        'import-column',
        'export-column',
        'limit-column',
        'pv-column',
        'load-column',
        'soc-column',
        'cost-column',
        'weather-column',
        'overrides-column',
        'temp-column',
        'rain-column'
      ]
    };
  }

  // * Declare reactive properties
  public static get properties(): Record<string, unknown> {
    return {
      _config: {},
      _hass: {}
    };
  }

  // * Lifecycle - Card component added to DOM
  public connectedCallback(): void {
    const cardOuterContainer = haCardElement();

    const tableOuterContainer = divElement('table-outer-container');
    cardOuterContainer.appendChild(tableOuterContainer);

    const homeAssistantVersion = this._haService.getHomeAssistantVersions();
    const cardVersion = this._haService.getCardVersions();
    const versionRow = getVersionRowElement(homeAssistantVersion, cardVersion);
    cardOuterContainer.appendChild(versionRow);
    this.replaceChildren(cardOuterContainer);

    // Add styles
    const cardStyleTag = styleElement('predbat-table-styles', tableStyles);
    this.prepend(cardStyleTag);
    const modalStyleTag = styleElement('predbat-modal-styles', modalStyles);
    document.head.appendChild(modalStyleTag);

    this._tableRenderer.container = tableOuterContainer;
    this._tableRenderer.onUpdate = (): void => {
      if (this._predbatRestApiService) this._render();
    };
    this._weatherService.onUpdate = (): void => {
      if (this._predbatRestApiService) this._render();
    };

    this._initialiseRestApi();
    this._render();
  }

  // * Lifecycle - Card component removed from DOM
  public async disconnectedCallback(): Promise<void> {
    if (this._weatherService.subscribed) {
      await this._weatherService.unsubscribe();
    }

    if (this._predbatRestApiService) {
      this._predbatRestApiService.disconnect();
      this._predbatRestApiService = null;
    }

    this._lastPlanUpdated = null;
    this._planData = null;
  }

  // * Register card with Home Assistant
  public static register(): void {
    customElements.define('predbat-card-next', PredbatTableCard);

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition, @typescript-eslint/strict-boolean-expressions
    window.customCards = window.customCards || [];
    window.customCards.push({
      type: 'predbat-card-next',
      name: 'PredBat Card',
      preview: true,
      description: 'Predbat Card showing the plan table in a nicer format',
      documentationURL: 'https://github.com/pacemaker82/PredBat-Table-Card/blob/main/README.md'
    });
  }

  public setPlanData = (planData: PredbatData): void => {
    this._planData = planData;

    this._render();
  };

  private _initialiseRestApi(): void {
    if (this._predbatRestApiService) {
      this._predbatRestApiService.disconnect();
      this._predbatRestApiService = null;
    }

    this._restApiAvailable = false;

    PredbatRestApiService.restApiAvailable(restApiPort)
      .then((restApiAvailable) => {
        this._restApiAvailable = restApiAvailable;

        if (restApiAvailable) this._predbatRestApiService = new PredbatRestApiService(restApiPort, this.setPlanData);

        this._render();
      })
      .catch(() => {
        this._restApiAvailable = false;

        this._render();
      });
  }

  private _render(): void {
    if (this._planStatus === 'failed') {
      this._tableRenderer.renderError('Predbat plan not available');

      return;
    }

    if (this._planStatus === 'waiting') {
      this._tableRenderer.renderInfo('Waiting for Predbat plan');

      return;
    }

    if (this._planData === null) {
      this._tableRenderer.renderInfo('Loading Predbat plan data...');

      return;
    }

    this._tableRenderer.render(
      this._planData,
      this._weatherService.temperatureUnit,
      this._configManager.dayLimit,
      this._reactiveDataState.generatingPlan,
      this._reactiveDataState.carCharging,
      this._haService.getOverrideEntities(),
      this._weatherService.getWeatherData(this._configManager.dayLimit)
    );
  }
  // TODO - change cost column to pounds
  private _getOverrideStateString(): string {
    const overrideEntities = this._haService.getOverrideEntities();

    return overrideEntities.map(entity => {
      const state = this._haService.getState(entity.entityName);
      return `${entity.entityName}:${state.state || 'null'}`;
    }).join('|');
  }
}

PredbatTableCard.register();