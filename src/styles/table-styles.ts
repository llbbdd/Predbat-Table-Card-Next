export const tableStyles = `
  /* Most outer element - created by system in register() */
  .type-custom-predbat-card-next {
    display: inline-flex;
    flex-direction: column;
    height: calc(100dvh - var(--header-height) - var(--row-gap) - 40px); /* should pull height in to keep footer visible */
    width: auto;
    max-width: 100%;
  }

  /* Outer-most element created by us */
  .outer-card-container {
    display: flex;
    flex-direction: column;
    flex: 0 1 auto;
    overflow: hidden;
  }

  /* Element that render function renders into */
  .table-outer-container {
    display: flex;
    flex: 0 1 auto;
    overflow: auto;
    position: relative;
    overscroll-behavior-x: none;
    max-height: 100%;
  }

  .version-row-container {
    flex-shrink: 0;
    height: auto;
    font-weight: normal;
    text-align: center;
    padding: 4px 10px;
    display: flex;
    justify-content: space-between;
    border-top: 2px solid var(--primary-color);
  }

  .datetime {
    flex: 1;
    display: flex;
    align-items: flex-end;
    justify-content: flex-end;
  }

  .predbat-table {
    border-spacing: 0px;
    font-size: 14px;
    table-layout: auto;
    width: auto;
  }

  .table-left-column {
    flex: 0 0 auto;
    display: flex;
    flex-direction: column;
    position: sticky;
    left: 0;
    z-index: 3;
  }

  .table-right-column {
    flex: 0 1 auto;
    display: flex;
    flex-direction: column;
    overflow: visible;
    position: relative;
  }

  .table-left-column table,
  .table-right-column table {
    table-layout: auto;
    width: auto;
  }

  .table-left-column thead,
  .table-right-column thead {
    position: sticky;
    top: 0;
    background: var(--primary-color);
    z-index: 2;
  }

  .tableRow {
  }

  tbody .tableRow:nth-child(even) {
    background-color: var(--secondary-background-color);
  }

  tbody .tableRow:nth-child(odd) {
    background-color: var(--card-background-color);
  }

  .tableCell {
    vertical-align: middle;
    align-items: center;
    border: 0;
    text-align: center;
    height: 30px;
    padding: 0 4px;
  }

  .predbat-table td:not(:first-child),
  .predbat-table th:not(:first-child) {
    border-left: 1px solid var(--divider-color, rgba(0, 0, 0, 0.06));
  }

  .cellInner {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .table-left-column .tableCell {
    white-space: normal;
  }

  .table-right-column .tableCell {
    white-space: nowrap;
  }

  .topHeader {
    background-color: var(--primary-color);
    color: var(--text-primary-color);
    height: 50px;
    max-height: 50px;
    text-align: center;
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
  }

  .headerCell {
    padding: 8px 12px;
    position: relative;
  }

  .timeHeaderCell {
    padding-right: 8px;
    text-align: right;
  }

  /* Mobile (767px and below) */
  @media (max-width: 767px) {
    .header-icon {
      display: inline-block;
      --mdc-icon-size: 20px;
      position: relative;
      bottom: 1px;
    }

    .header-text {
      display: none;
    }

    .table-left-column .header-text {
      display: inline-block !important;
    }

    .overrides-column,
    th[data-column="overrides-column"],
    td[data-column="overrides-column"] {
      display: none !important;
    }

    .overrides-popup-column,
    th[data-column="overrides-popup-column"],
    td[data-column="overrides-popup-column"] {
      display: table-cell !important;
    }
  }

  /* Tablet (768px - 1023px) */
  @media (min-width: 768px) {
    .header-icon {
      display: none !important;
    }

    .header-text {
      display: inline-block !important;
    }

    .overrides-column,
    th[data-column="overrides-column"],
    td[data-column="overrides-column"] {
      display: none !important;
    }

    .overrides-popup-column,
    th[data-column="overrides-popup-column"],
    td[data-column="overrides-popup-column"] {
      display: table-cell !important;
    }
  }

  /* Desktop (1024px and up) */
  @media (min-width: 1024px) {
    .header-icon {
      display: none;
    }

    .header-text {
      display: inline-block !important;
    }

    .overrides-column,
    th[data-column="overrides-column"],
    td[data-column="overrides-column"] {
      display: table-cell !important;
    }

    .overrides-popup-column,
    th[data-column="overrides-popup-column"],
    td[data-column="overrides-popup-column"] {
      display: none !important;
    }
  }

  .tempUnit {
    font-size: 11px;
  }

  .overrideButtons {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 8px;
    flex-wrap: wrap;
    padding-right: 4px;
    padding-left: 4px;
  }

  .editOverideIcon {
    color: var(--text-primary-color);
    opacity: 0.8;
  }

  .overrideButtonIconWrapper {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
  }

  /* Current column cells - top, bottom border */
  .current-time td {
    background-color: rgba(3, 169, 244, 0.15) !important;
    color: var(--primary-text-color) !important;
    border-top: 3px solid var(--primary-color);
    border-bottom: 3px solid var(--primary-color);
  }

  /* Left column - first cell (only cell in left table) gets left border */
  .table-left-column .current-time td {
    border-left: 3px solid var(--primary-color);
  }

  /* Right column - last cell gets right border */
  .table-right-column .current-time td[data-column="overrides-popup-column"],
  .table-right-column .current-time td[data-column="overrides-column"] {
    border-right: 3px solid var(--primary-color);
  }

  .freezeIcon {
    position: absolute;
    bottom: 4px;
    right: 1px;
    color: var(--text-primary-color);
    cursor: pointer;
    pointer-events: none;
    --mdc-icon-size: 8px;
    opacity: 0.9;
  }

  .batteryIconOuter {
    gap: 4px;
    align-items: center;
    display: flex;
    justify-content: center;
    margin: 0 auto;
  }

  .batterySoC {
    margin-left: 5px;
    margin-top: 2px;
    display: flex;
    align-items: center;
  }

  .versionSpan {

  }

  .iconContainer {
    display: flex;
    flex: 1;
    align-items: center;
    justify-content: center;
    --font-weight: bold;
  }

  .iconContainerSOC {
    display: flex;
    align-items: center;
  }

  /* Loading state */
  .loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 20px;
    gap: 16px;
    border-radius: 8px;
  }

  .loading-spinner {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  .loading-text {
    font-size: 14px;
    font-family: Arial, sans-serif;
  }

  /* Info message card */
  .info-card {
    display: flex;
    width: 100%;
    height: 300px;
    justify-content: center;
    align-items: center;
    color: var(--text-primary-color);
    border-radius: 8px;
    padding: 16px;
  }

  .info-card .error {
    color: var(--text-primary-color);
  }

  /* Error message card */
  .error-card {
    background: var(--error-color);
    color: var(--text-primary-color);
    border-radius: 8px;
    padding: 16px;
  }

  .error-card .error {
    color: var(--text-primary-color);
  }

  .total-cell {
    font-weight: bold;
    border-top: 3px solid var(--primary-color);
  }

  .status {
    display: flex;
    justify-content: flex-end;
    flex: 1;
    align-items: center;
  }

  .reload-icon {
    display: flex;
    opacity: 0.25;
    transform-origin: 7px 8px;
    align-items: center;
    justify-content: center;
    padding-right: 4px;
  }

  .car-charging-on {
    display: flex;
    opacity: 1;
    padding-right: 4px;
    color: rgb(58, 238, 133);
  }

  .car-charging-off {
    display: flex;
    opacity: 0.25;
    padding-right: 4px;
  }

  .car-charging-disabled {
    display: none;
  }

  .bar-element-container {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    gap: 4px;
  }

  .bar-element-fill {
    position: absolute;
    left: 0;
    top: 0;
    height: 100%;
    z-index: 0;
    opacity: 0.3;
    border-radius: 2px;
    transition: width 0.3s ease;
    min-height: 4px;
  }

  .bar-element-content-wrapper {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
  }

  .bar-element-value {
    position: relative;
    z-index: 1;
    font-size: inherit;
    font-weight: 500;
    padding: 0 4px;
  }

  .spin {
    animation: spin 1s linear infinite;
    opacity: 1;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;