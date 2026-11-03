
/**
 * ============================================================
 * DEFAULT FINANCIAL SCENARIO
 * File: src/data/defaultScenario.js
 * ============================================================
 *
 * Defines the original demonstration scenario used by
 * the 401(k) Loan & Cash-Flow Planner.
 *
 * These values are educational planning assumptions.
 * Dates, loan terms, and payroll elections are editable.
 *
 * IMPORTANT:
 * This object is the single source of truth for resetting
 * the application's financial inputs.
 */

// ============================================================
// 1. DEFAULT FINANCIAL VALUES
// ============================================================

export const defaultScenario = Object.freeze({
  // Income, expenses, and calendar
  gross: 1323,
  takehome: 1000,
  rent: 1540,
  rentDay: 22,
  payday: '2026-11-19',
  disbursement: '2026-11-18',
  delay: 1,
  expenses: 0,
  opening: 0,

  // Current employee contribution elections
  oldPre: 1,
  oldRoth: 2,

  // Proposed employee contribution elections
  newPre: 3,
  newRoth: 6,

  // Employer matching and tax assumptions
  matchCap: 6,
  matchRatio: 100,
  taxRate: 0,

  // Loan assumptions
  loan: 2205,
  fee: 50,
  apr: 8,
  count: 26,
  repayment: '2026-11-18',
  loanRent: 1540,
  proceeds: 2205
});

// ============================================================
// 2. INPUT FIELD IDENTIFIERS
// ============================================================

/**
 * IDs that must correspond to the input elements in
 * index.html.
 *
 * Reusing the defaultScenario keys prevents the application
 * from maintaining two independent lists of input fields.
 */
export const inputIds = Object.keys(defaultScenario);

// ============================================================
// 3. DEFAULT SCENARIO COMPARISON
// ============================================================

/**
 * Determine whether a scenario matches every default value.
 *
 * @param {object} values - Current financial scenario.
 * @returns {boolean} True when all inputs match the defaults.
 */
export function isDefaultScenario(values) {
  if (
    values === null ||
    typeof values !== 'object' ||
    Array.isArray(values)
  ) {
    return false;
  }

  return inputIds.every((id) => {
    return Object.hasOwn(values, id) &&
      values[id] === defaultScenario[id];
  });
}
