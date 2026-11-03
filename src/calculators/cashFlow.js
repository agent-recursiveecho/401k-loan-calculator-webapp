
import { roundCents } from '../utils/currency.js';

/**
 * Calculates a running cash balance from dated transactions.
 *
 * Positive delta: money entering the account.
 * Negative delta: money leaving the account.
 *
 * Events on the same date are ordered by priority.
 * Lower priority numbers execute first.
 *
 * This is a planning model, not a prediction
 * of actual bank transaction settlement order.
 */
export function runningCashFlow(events, openingBalance = 0) {
  if (!Array.isArray(events)) {
    throw new TypeError('Events must be an array.');
  }

  if (
    typeof openingBalance !== 'number' ||
    !Number.isFinite(openingBalance)
  ) {
    throw new TypeError('Opening balance must be a finite number.');
  }

  let balance = roundCents(openingBalance);
  let minimum = balance;

  // Validate transactions before calculating balances.
  const validatedEvents = events.map((event, index) => {
    if (event === null || typeof event !== 'object') {
      throw new TypeError(
        `Transaction ${index + 1} must be an object.`
      );
    }

    if (
      !(event.date instanceof Date) ||
      !Number.isFinite(event.date.getTime())
    ) {
      throw new TypeError(
        `Transaction ${index + 1} has an invalid date.`
      );
    }

    if (
      typeof event.delta !== 'number' ||
      !Number.isFinite(event.delta)
    ) {
      throw new TypeError(
        `Transaction ${index + 1} has an invalid amount.`
      );
    }

    const priority = event.priority ?? 0;

    if (
      typeof priority !== 'number' ||
      !Number.isFinite(priority)
    ) {
      throw new TypeError(
        `Transaction ${index + 1} has an invalid priority.`
      );
    }

    return {
      event,
      index,
      priority
    };
  });

  // Sort transactions without changing the original input array.
  validatedEvents.sort((a, b) => {
    const dateDifference =
      a.event.date.getTime() - b.event.date.getTime();

    if (dateDifference !== 0) {
      return dateDifference;
    }

    const priorityDifference = a.priority - b.priority;

    if (priorityDifference !== 0) {
      return priorityDifference;
    }

    // Preserve original order when dates and priorities match.
    return a.index - b.index;
  });

  // Process transactions in chronological order.
  const sortedEvents = validatedEvents.map(({ event }) => {
    balance = roundCents(balance + event.delta);

    minimum = Math.min(minimum, balance);

    return {
      ...event,
      balance
    };
  });

  return {
    events: sortedEvents,
    minimum,
    endingBalance: balance,
    hasShortfall: minimum < 0
  };
}
