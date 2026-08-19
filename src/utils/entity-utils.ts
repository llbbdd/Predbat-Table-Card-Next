import { HassEntity } from '../schemas/home-assistant';

export function getArrayForEntityForceStates(entity: HassEntity): string[] {
  // Remove leading +
  const entityState = entity.state.replace(/^\+/, '').split(',');

  return entityState;
}

export function change(change: number): 'rising' | 'same' | 'falling' {
  if (change > 0) {
    return 'rising';
  }
  else if (change < 0) {
    return 'falling';
  }

  return 'same';

}