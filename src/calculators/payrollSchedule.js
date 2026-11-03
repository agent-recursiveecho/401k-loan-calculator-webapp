import {addDays} from '../utils/dates.js';
export function paydays(firstDate, count=26) { return Array.from({length:count},(_,i)=>addDays(firstDate,14*i)); }
export function contributionEffective(date, disbursement, firstPayday, delayPaychecks) {
  return date>=disbursement && date>=addDays(firstPayday,14*delayPaychecks);
}
