
/**
 * ============================================================
 * LOCAL SCENARIO STORAGE
 * File: src/services/storage.js
 * ============================================================
 *
 * Saves and restores calculator inputs using browser
 * localStorage.
 *
 * SECURITY:
 * Financial planning assumptions are stored locally.
 * Do not store account numbers, credentials, or other
 * sensitive personal information.
 *
 * localStorage is not encrypted, and other scripts running
 * under the same website origin may access its contents.
 */

// ============================================================
// 1. STORAGE CONFIGURATION
// ============================================================

// Keep the original key to preserve previously saved data.
const KEY = 'retirement-planner-scenario-v1';

// ============================================================
// 2. SAVE A SCENARIO
// ============================================================

/**
 * Persist the current scenario in browser storage.
 *
 * @param {object} values - Validated financial inputs.
 * @returns {void}
 */
export function saveScenario(values) {
  localStorage.setItem(KEY, JSON.stringify(values));
}

// ============================================================
// 3. LOAD A SAVED SCENARIO
// ============================================================

/**
 * Retrieve the most recently saved scenario.
 *
 * Returns null when no saved scenario exists or when
 * stored JSON is malformed or not a plain object.
 *
 * @returns {object|null} Saved scenario or null.
 */
export function loadScenario() {
  try {
    const saved = localStorage.getItem(KEY);

    if (saved === null) {
      return null;
    }

    const parsed = JSON.parse(saved);

    if (
      parsed === null ||
      typeof parsed !== 'object' ||
      Array.isArray(parsed)
    ) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

// ============================================================
// 4. CLEAR A SAVED SCENARIO
// ============================================================

/**
 * Remove the saved scenario from browser storage.
 *
 * The application's defaults will be restored on the
 * next initialization if no saved scenario exists.
 *
 * @returns {void}
 */
export function clearScenario() {
  localStorage.removeItem(KEY);
}
