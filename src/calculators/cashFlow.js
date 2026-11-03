import {roundCents} from '../utils/currency.js';
/** Same-day event priorities are approximations, not a bank settlement forecast. */
export function runningCashFlow(events,openingBalance=0) {
  let balance=roundCents(openingBalance),minimum=balance;
  const sorted=[...events].sort((a,b)=>a.date-b.date||a.priority-b.priority).map(event=>{
    balance=roundCents(balance+event.delta);
    minimum=Math.min(minimum,balance);
    return {...event,balance};
  });
  return {events:sorted,minimum,endingBalance:balance};
}
