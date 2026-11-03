
/**
 * ============================================================
 * 401(k) LOAN & CASH-FLOW PLANNER
 * File: src/app.js
 * Author: Joshua R. Gallegos
 * Date: 2026-11-02
 * ============================================================
 *
 * PURPOSE:
 * Coordinate user input, financial calculations, cash-flow
 * events, and browser rendering.
 *
 * ARCHITECTURE:
 * Financial formulas remain in src/calculators/.
 * This file coordinates those modules and prepares results
 * for display.
 *
 * IMPORTANT FINANCIAL ASSUMPTIONS:
 * 1. Gross eligible earnings are constant per paycheck.
 * 2. Existing take-home pay reflects current deductions.
 * 3. Loan repayments are deducted separately from take-home.
 * 4. Employer matching does not increase spendable cash.
 * 5. Loan proceeds are received once, not every paycheck.
 * 6. Rent continues monthly after the loan-funded payment.
 * 7. Payroll processing delays are estimates.
 *
 * This application provides financial planning estimates,
 * not actual bank settlement or payroll guarantees.
 */

// ============================================================
// 1. MODULE IMPORTS
// ============================================================

// Default scenario and expected input field IDs.
import {
  inputIds,
  defaultScenario,
  isDefaultScenario
} from './data/defaultScenario.js';

// Monetary formatting and cent-level rounding.
import { roundCents, money } from './utils/currency.js';

// Date creation and calendar operations.
import { parseDate, addDays } from './utils/dates.js';

// User input validation.
import { validateInputs } from './utils/validation.js';

// Employee 401(k) contributions and take-home estimates.
import {
  employeeContribution,
  estimatedTakeHome
} from './calculators/contributions.js';

// Employer matching calculations.
import { employerMatch } from './calculators/employerMatch.js';

// Loan amortization calculations.
import { amortizeLoan } from './calculators/loanAmortization.js';

// Biweekly payroll scheduling.
import {
  paydays,
  contributionEffective
} from './calculators/payrollSchedule.js';

// Chronological running cash-balance calculation.
import { runningCashFlow } from './calculators/cashFlow.js';

// Browser results rendering.
import { renderResults } from './components/renderResults.js';

// CSV export functionality.
import {
  calendarCsv,
  downloadCsv
} from './services/csvExport.js';

// Local scenario persistence.
import {
  loadScenario,
  saveScenario
} from './services/storage.js';


// ============================================================
// 2. APPLICATION STATE AND DOM HELPERS
// ============================================================

/**
 * Most recently calculated cash-flow transactions.
 *
 * These events are used when exporting the financial calendar.
 *
 * @type {Array<object>}
 */
let currentEvents = [];

/**
 * Locate an HTML element using its ID.
 *
 * @param {string} id - HTML element ID.
 * @returns {HTMLElement|null} Matching element.
 */
const $ = (id) => document.getElementById(id);

/**
 * Read all application inputs from the HTML form.
 *
 * Date values remain strings for later parsing.
 * Numeric fields are converted into JavaScript numbers.
 *
 * @returns {object} Current form values.
 */
function readValues() {
  return Object.fromEntries(
    inputIds.map((id) => {
      const element = $(id);

      const value = element.type === 'date'
        ? element.value
        : Number(element.value);

      return [id, value];
    })
  );
}


/**
 * ============================================================
 * SCENARIO MANAGEMENT
 * ============================================================
 *
 * Responsible for:
 * - Applying financial values to the input form.
 * - Identifying default and customized scenarios.
 * - Restoring the original demonstration scenario.
 */

/**
 * Apply a complete scenario to the input form.
 *
 * Unknown properties are ignored.
 * Missing properties retain their default values.
 *
 * @param {object} values - Financial scenario values.
 * @returns {void}
 */
function applyScenario(values) {
  for (const id of inputIds) {
    const element = $(id);

    element.value = Object.hasOwn(values, id)
      ? values[id]
      : defaultScenario[id];
  }
}

/**
 * Identify the scenario currently displayed.
 *
 * The button remains available even when the default
 * scenario is selected.
 *
 * @param {object} values - Current financial inputs.
 * @returns {void}
 */
function updateScenarioStatus(values) {
  const status = $('scenarioStatus');
  const isDefault = isDefaultScenario(values);

  status.textContent = isDefault
    ? 'Default scenario'
    : 'Customized scenario';

  status.dataset.scenario = isDefault
    ? 'default'
    : 'custom';
}

/**
 * Restore the original demonstration scenario.
 *
 * IMPORTANT:
 * Resetting replaces the current browser-saved scenario.
 * It does not delete the default scenario definition.
 *
 * @returns {void}
 */
function resetScenario() {
  applyScenario(defaultScenario);

  // Update persistent storage so the restored inputs
  // remain available after a page refresh.
  saveScenario(defaultScenario);

  // Recalculate and redraw all financial results.
  render();
}



/**
 * ============================================================
 * APPLICATION INITIALIZATION
 * ============================================================
 *
 * Initialize the calculator using saved data when available.
 * Otherwise use the official default financial scenario.
 *
 * @returns {void}
 */
export function startApp() {
  // ----------------------------------------------------------
  // A. Restore the previous scenario or load defaults.
  // ----------------------------------------------------------

  const previous = loadScenario();

  applyScenario(previous ?? defaultScenario);

  // ----------------------------------------------------------
  // B. Register financial input listeners.
  // ----------------------------------------------------------

  inputIds.forEach((id) => {
    $(id).addEventListener('input', render);
  });

  // ----------------------------------------------------------
  // C. Register the reset action.
  // ----------------------------------------------------------

  $('resetScenario').addEventListener('click', resetScenario);

  // ----------------------------------------------------------
  // D. Register the calendar CSV export.
  // ----------------------------------------------------------

  $('download').addEventListener('click', () => {
    downloadCsv(calendarCsv(currentEvents));
  });

  // ----------------------------------------------------------
  // E. Render the initial scenario.
  // ----------------------------------------------------------

  render();
}



// ============================================================
// 4. INPUT VALIDATION AND ERROR DISPLAY
// ============================================================

/**
 * Clear outdated results when user inputs are invalid.
 *
 * CSV export is disabled to prevent exporting stale data.
 *
 * @param {string[]} problems - Validation messages.
 * @returns {void}
 */
function showValidationErrors(problems) {
  $('metrics').innerHTML = '';
  $('compare').innerHTML = '';
  $('amort').innerHTML = '';
  $('calendar').innerHTML = '';

  $('messages').textContent = problems.join(' ');
  $('messages').className = 'note error';

  $('download').disabled = true;

  currentEvents = [];
}


// ============================================================
// 5. FINANCIAL EVENT CREATION
// ============================================================

/**
 * Add a dated financial event to a transaction collection.
 *
 * POSITIVE delta:
 * Money entering the checking account.
 *
 * NEGATIVE delta:
 * Money leaving the checking account.
 *
 * PRIORITIES:
 * 0 = Loan disbursement
 * 1 = Paycheck
 * 2 = Loan repayment
 * 3 = Rent
 * 4 = Other expenses
 *
 * Priorities are planning assumptions for events
 * occurring on the same calendar date.
 *
 * @param {Array<object>} events - Target event collection.
 * @param {Date} date - Transaction date.
 * @param {string} type - Transaction category.
 * @param {number} delta - Signed cash movement.
 * @param {number} priority - Same-day ordering priority.
 * @param {string} detail - Human-readable description.
 * @returns {void}
 */
function addEvent(
  events,
  date,
  type,
  delta,
  priority,
  detail = ''
) {
  events.push({
    date,
    type,
    delta: roundCents(delta),
    priority,
    detail
  });
}


// ============================================================
// 6. LOAN REPAYMENT EVENTS
// ============================================================

/**
 * Convert loan amortization payments into cash-flow events.
 *
 * Every loan repayment is a negative cash movement.
 *
 * Loan repayments are not new employee 401(k)
 * contributions and do not generate employer matching.
 *
 * @param {Array<object>} events - Target event collection.
 * @param {object} loan - Calculated amortization result.
 * @returns {void}
 */
function addLoanRepaymentEvents(events, loan) {
  for (const row of loan.rows) {
    addEvent(
      events,
      row.date,
      'Loan repayment',
      -row.payment,
      2,
      `Payment ${row.number}`
    );
  }
}


// ============================================================
// 7. PAYROLL AND RETIREMENT CONTRIBUTIONS
// ============================================================

/**
 * Generate paychecks and calculate retirement contributions.
 *
 * New contribution rates become active according to
 * the payroll scheduling module.
 *
 * Employer matching is included in paycheck descriptions,
 * but never added to the checking-account balance.
 *
 * @param {Array<object>} events - Target event collection.
 * @param {object} v - Validated scenario values.
 * @param {Date} payday - First projected payday.
 * @param {Date} disbursement - Loan disbursement date.
 * @param {number} newTakeHome - Updated paycheck estimate.
 * @returns {object} Payroll summary.
 */
function addPayrollEvents(
  events,
  v,
  payday,
  disbursement,
  newTakeHome
) {
  const {
    gross,
    takehome,
    oldPre,
    oldRoth,
    newPre,
    newRoth,
    matchCap,
    matchRatio
  } = v;

  // The current projection covers 26 biweekly paychecks.
  const payrollDates = paydays(payday, 26);

  let affected = 0;
  let additional = 0;

  for (const day of payrollDates) {
    // The higher contribution rates only apply once
    // the modeled payroll activation date is reached.
    const active = contributionEffective(
      day,
      disbursement,
      payday,
      v.delay
    );

    const preTax = active ? newPre : oldPre;
    const roth = active ? newRoth : oldRoth;

    const contribution = employeeContribution(
      gross,
      preTax,
      roth
    );

    const match = employerMatch(
      gross,
      preTax + roth,
      matchCap,
      matchRatio
    );

    if (active) {
      affected++;

      // Count only the employee contribution increase.
      // Employer contributions are excluded.
      const increase = gross * (
        (newPre + newRoth) -
        (oldPre + oldRoth)
      ) / 100;

      additional = roundCents(additional + increase);
    }

    // Estimated take-home already reflects the increase
    // in employee contributions when active.
    //
    // Loan repayments are separate cash-flow events.
    const paycheckAmount = active
      ? newTakeHome
      : takehome;

    addEvent(
      events,
      day,
      'Paycheck',
      paycheckAmount,
      1,
      `${active ? 'New' : 'Current'} rates; ` +
      `employee 401(k) ${money(contribution.total)}, ` +
      `match ${money(match)}`
    );
  }

  return {
    payrollDates,
    affected,
    additional
  };
}


// ============================================================
// 8. MONTHLY RENT AND OTHER EXPENSES
// ============================================================

/**
 * Generate recurring monthly expense events.
 *
 * Rent is charged once per month during the
 * projected calendar window.
 *
 * IMPORTANT:
 * The loan-funded rent allocation does not produce a
 * second rent expense. Loan proceeds enter the account
 * once, and rent leaves the account on its scheduled date.
 *
 * @param {Array<object>} events - Target event collection.
 * @param {object} v - Validated scenario values.
 * @param {Date} start - Projection start.
 * @param {Date} end - Projection end.
 * @returns {void}
 */
function addMonthlyExpenseEvents(events, v, start, end) {
  const from = new Date(
    start.getFullYear(),
    start.getMonth(),
    1
  );

  const to = new Date(
    end.getFullYear(),
    end.getMonth() + 1,
    0
  );

  for (
    let month = new Date(from);
    month <= to;
    month.setMonth(month.getMonth() + 1)
  ) {
    const due = new Date(
      month.getFullYear(),
      month.getMonth(),
      v.rentDay,
      12
    );

    // Include monthly expenses only within the
    // projected transaction window.
    if (due >= start && due <= end) {
      addEvent(
        events,
        due,
        'Rent',
        -v.rent,
        3,
        'Monthly rent'
      );

      if (v.expenses > 0) {
        addEvent(
          events,
          due,
          'Other expenses',
          -v.expenses,
          4,
          'Monthly estimated expenses'
        );
      }
    }
  }
}


// ============================================================
// 9. FINANCIAL WARNINGS
// ============================================================

/**
 * Identify assumptions or projected financial conditions
 * requiring additional attention.
 *
 * @param {object} v - Validated scenario values.
 * @param {object} cash - Calculated cash-flow result.
 * @returns {string[]} Warning messages.
 */
function buildWarnings(v, cash) {
  const warnings = [];

  if (v.takehome >= v.gross) {
    warnings.push(
      'Take-home equals or exceeds eligible gross pay; ' +
      'check whether eligible earnings differ from total gross pay.'
    );
  }

  if (v.loanRent > v.proceeds) {
    warnings.push(
      'Loan-funded rent allocation exceeds assumed cash proceeds.'
    );
  }

  if (v.loanRent !== v.rent) {
    warnings.push(
      'Loan-funded rent allocation differs from monthly rent.'
    );
  }

  if (v.newPre + v.newRoth > v.matchCap) {
    warnings.push(
      'Employee deferrals above the match cap do not earn ' +
      'extra match under this formula.'
    );
  }

  if (v.delay > 0) {
    warnings.push(
      'Payroll delay is an assumption; ' +
      'confirm your plan’s effective date.'
    );
  }

  if (cash.hasShortfall) {
    warnings.push(
      'Projected cash balance becomes negative; ' +
      'the model may omit savings, income, expenses, ' +
      'or actual bank transaction timing.'
    );
  }

  return warnings;
}


// ============================================================
// 10. MAIN FINANCIAL CALCULATION
// ============================================================

/**
 * Calculate the entire financial scenario.
 *
 * RESPONSIBILITIES:
 * 1. Calculate the financed loan.
 * 2. Estimate take-home pay at new contribution rates.
 * 3. Calculate current and proposed employer matching.
 * 4. Generate loan and payroll transactions.
 * 5. Generate recurring monthly expenses.
 * 6. Add the one-time loan disbursement.
 * 7. Calculate chronological running cash balances.
 * 8. Prepare dashboard results.
 *
 * @param {object} v - Validated scenario inputs.
 * @returns {object} Dashboard data and cash-flow events.
 */
function calculateScenario(v) {
  const {
    gross: g,
    takehome: th,
    rent,
    oldPre,
    oldRoth,
    newPre,
    newRoth,
    matchCap,
    matchRatio,
    taxRate
  } = v;

  // ----------------------------------------------------------
  // A. Calculate the loan amortization schedule.
  // ----------------------------------------------------------

  // The financed fee increases the loan principal.
  // Cash proceeds are tracked separately.
  const loan = amortizeLoan({
    principal: roundCents(v.loan + v.fee),
    aprPercent: v.apr,
    payments: v.count,
    firstDate: parseDate(v.repayment)
  });

  // ----------------------------------------------------------
  // B. Establish payroll and disbursement dates.
  // ----------------------------------------------------------

  const payday = parseDate(v.payday);
  const disbursement = parseDate(v.disbursement);

  // ----------------------------------------------------------
  // C. Calculate retirement contribution effects.
  // ----------------------------------------------------------

  const newTakeHome = estimatedTakeHome(
    th,
    g,
    oldPre,
    oldRoth,
    newPre,
    newRoth,
    taxRate
  );

  const oldMatch = employerMatch(
    g,
    oldPre + oldRoth,
    matchCap,
    matchRatio
  );

  const newMatch = employerMatch(
    g,
    newPre + newRoth,
    matchCap,
    matchRatio
  );

  // ----------------------------------------------------------
  // D. Generate financial events.
  // ----------------------------------------------------------

  const events = [];

  // Loan repayments are negative cash movements.
  addLoanRepaymentEvents(events, loan);

  // Paychecks provide positive checking-account cash.
  const payroll = addPayrollEvents(
    events,
    v,
    payday,
    disbursement,
    newTakeHome
  );

  // ----------------------------------------------------------
  // E. Establish the calendar projection boundaries.
  // ----------------------------------------------------------

  const lastPay = payroll.payrollDates.at(-1);
  const lastRepayment = loan.rows.at(-1).date;

  const end = lastRepayment > lastPay
    ? lastRepayment
    : lastPay;

  const start = disbursement < payday
    ? disbursement
    : payday;

  // Monthly expenses continue through the end of
  // the projected payroll and repayment schedule.
  addMonthlyExpenseEvents(events, v, start, end);

  // ----------------------------------------------------------
  // F. Add the one-time loan proceeds.
  // ----------------------------------------------------------

  // The fee is financed, but is not included in
  // the actual cash proceeds deposited into checking.
  addEvent(
    events,
    disbursement,
    'Loan disbursement',
    v.proceeds,
    0,
    'Cash proceeds (financed fee excluded)'
  );

  // ----------------------------------------------------------
  // G. Calculate chronological running balances.
  // ----------------------------------------------------------

  const cash = runningCashFlow(events, v.opening);

  // ----------------------------------------------------------
  // H. Build financial warnings.
  // ----------------------------------------------------------

  const warnings = buildWarnings(v, cash);

  // ----------------------------------------------------------
  // I. Prepare dashboard metrics.
  // ----------------------------------------------------------

  const metrics = [
    ['Loan payment / 2 weeks', money(loan.regularPayment)],
    ['Loan interest (estimated)', money(loan.totalInterest)],
    ['Total loan repayment', money(loan.totalPaid)],
    ['New total contribution rate', `${newPre + newRoth}%`],
    ['Additional 401(k) over 26 paydays', money(payroll.additional)],
    ['Paychecks at new rates', payroll.affected],
    ['Estimated new take-home', money(newTakeHome)],
    ['Lowest projected cash balance', money(cash.minimum)]
  ];

  // ----------------------------------------------------------
  // J. Prepare current-versus-proposed comparisons.
  // ----------------------------------------------------------

  const comparison = [
    [
      'Pre-tax rate',
      `${oldPre}%`,
      `${newPre}%`
    ],
    [
      'Roth rate',
      `${oldRoth}%`,
      `${newRoth}%`
    ],
    [
      'Employee deferral',
      money(employeeContribution(g, oldPre, oldRoth).total),
      money(employeeContribution(g, newPre, newRoth).total)
    ],
    [
      'Estimated employer match',
      money(oldMatch),
      money(newMatch)
    ],
    [
      'Net paycheck (before loan payment)',
      money(th),
      money(newTakeHome)
    ]
  ];

  return {
    dashboard: {
      metrics,
      warnings,
      comparison,
      amortization: loan.rows,
      events: cash.events
    },
    events: cash.events
  };
}


// ============================================================
// 11. APPLICATION RENDERING
// ============================================================

/**
 * Recalculate and display the application whenever
 * a user modifies an input.
 *
 * Validation occurs before any financial calculations.
 *
 * Invalid inputs clear outdated results and disable
 * CSV export.
 *
 * @returns {void}
 */
function render() {
  const values = readValues();

  // Update the scenario label whenever an input changes.
  // This also works when an input is temporarily invalid.
  updateScenarioStatus(values);

  const problems = validateInputs(values);

  if (problems.length > 0) {
    showValidationErrors(problems);
    return;
  }

  // ----------------------------------------------------------
  // B. Reset validation state.
  // ----------------------------------------------------------

  $('messages').className = 'note';
  $('messages').textContent = '';

  $('download').disabled = false;

  // ----------------------------------------------------------
  // C. Save the validated user scenario.
  // ----------------------------------------------------------

  saveScenario(values);

  // ----------------------------------------------------------
  // D. Calculate loan, payroll, and cash-flow results.
  // ----------------------------------------------------------

  const result = calculateScenario(values);

  // Keep the latest events available for CSV export.
  currentEvents = result.events;

  // ----------------------------------------------------------
  // E. Update the browser interface.
  // ----------------------------------------------------------

  renderResults(result.dashboard);
}
