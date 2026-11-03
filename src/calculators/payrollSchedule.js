
import { addDays } from '../utils/dates.js';

/**
 * Generate biweekly paycheck dates.
 *
 * @param {Date} firstDate - First scheduled payday.
 * @param {number} count - Number of paychecks.
 * @returns {Date[]} Chronological paycheck dates.
 */
export function paydays(firstDate, count = 26) {
  validateDate(firstDate, 'First payday');

  if (!Number.isInteger(count) || count < 0) {
    throw new RangeError(
      'Paycheck count must be a non-negative integer.'
    );
  }

  return Array.from(
    { length: count },
    (_, index) => addDays(firstDate, 14 * index)
  );
}

/**
 * Determine whether new contribution rates apply
 * to a particular paycheck.
 *
 * Delay is measured in payroll cycles after the first
 * scheduled payday on or after loan disbursement.
 *
 * A delay of zero means the first eligible payday.
 * A delay of one means the following payday.
 *
 * This models payroll timing but does not guarantee
 * when an employer will process an election change.
 */
export function contributionEffective(
  date,
  disbursement,
  firstPayday,
  delayPaychecks = 0
) {
  validateDate(date, 'Paycheck date');
  validateDate(disbursement, 'Loan disbursement date');
  validateDate(firstPayday, 'First scheduled payday');

  if (
    !Number.isInteger(delayPaychecks) ||
    delayPaychecks < 0
  ) {
    throw new RangeError(
      'Payroll delay must be a non-negative integer.'
    );
  }

  // Locate the first scheduled payday on or after
  // the loan disbursement.
  let eligiblePayday = new Date(firstPayday.getTime());

  while (eligiblePayday < disbursement) {
    eligiblePayday = addDays(eligiblePayday, 14);
  }

  // Apply the payroll processing delay.
  const effectiveDate = addDays(
    eligiblePayday,
    14 * delayPaychecks
  );

  return date >= effectiveDate;
}

/**
 * Validate that a value is a valid JavaScript Date.
 */
function validateDate(value, label) {
  if (
    !(value instanceof Date) ||
    !Number.isFinite(value.getTime())
  ) {
    throw new TypeError(`${label} must be a valid Date.`);
  }
}
