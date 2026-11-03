import {roundCents} from '../utils/currency.js';
import {addDays} from '../utils/dates.js';
/** Fixed-rate, equal biweekly amortization; nominal APR / 26 and final-payment adjustment. */
export function amortizeLoan({principal, aprPercent, payments, firstDate}) {
  if (!(principal > 0) || !Number.isInteger(payments) || payments < 1 || aprPercent < 0) throw Error('Invalid loan terms');
  const rate=aprPercent/100/26;
  const regularPayment=roundCents(rate===0?principal/payments:principal*rate/(1-(1+rate)**(-payments)));
  let balance=roundCents(principal),totalInterest=0;
  const rows=[];
  for(let i=0;i<payments;i++) {
    const interest=roundCents(balance*rate);
    const principalPaid=i===payments-1?balance:Math.min(balance,roundCents(regularPayment-interest));
    const payment=roundCents(principalPaid+interest);
    balance=roundCents(balance-principalPaid);
    totalInterest=roundCents(totalInterest+interest);
    rows.push({number:i+1,date:addDays(firstDate,14*i),payment,interest,principalPaid,balance});
  }
  return {rows,regularPayment,totalInterest,totalPaid:roundCents(principal+totalInterest)};
}
