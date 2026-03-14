import { buildLogger } from '@netflix-clone/logger';

const logger = buildLogger('movie-service');

export const AnomalyType = {
  NONE: 'none',
  SLOW_QUERY: 'slow-query',
  FLAKY: 'flaky',
  NO_INDEX: 'no-index',
  LARGE_PAYLOAD: 'large-payload',
  MEMORY_LEAK: 'memory-leak',
};

let currentType = process.env.ANOMALY_TYPE || AnomalyType.NONE;
let isEnabled = process.env.ANOMALY_ENABLED === 'true';

export const getAnomalyType = () => (isEnabled ? currentType : AnomalyType.NONE);

export const setAnomalyType = (type) => {
  if (Object.values(AnomalyType).includes(type)) {
    currentType = type;
    isEnabled = type !== AnomalyType.NONE;
    logger.warn('ANOMALY: state changed', { type, isEnabled });
    return true;
  }
  return false;
};

/**
 * Fault 1: slow-query helper
 */
export async function injectDelay() {
  if (getAnomalyType() === AnomalyType.SLOW_QUERY) {
    const delayMs = 2000;
    logger.warn('ANOMALY: artificial delay injected', { delayMs });
    await new Promise((r) => setTimeout(r, delayMs));
  }
}

/**
 * Fault 2: flaky helper
 */
export function injectFlakyError() {
  if (getAnomalyType() === AnomalyType.FLAKY) {
    if (Math.random() < 0.4) {
      logger.error('ANOMALY: random fault triggered', {});
      throw new Error('Random fault injected');
    }
  }
}

/**
 * Fault 4 & 5 helpers are handled in resolvers/routes
 */
