import {roundCents} from '../utils/currency.js';
export function employeeContribution(gross, preTaxPercent, rothPercent) {
  return {preTax:roundCents(gross*preTaxPercent/100), roth:roundCents(gross*rothPercent/100), total:roundCents(gross*(preTaxPercent+rothPercent)/100)};
}
export function estimatedTakeHome(currentTakeHome, gross, oldPreTax, oldRoth, newPreTax, newRoth, marginalTaxRatePercent=0) {
  const increasedPreTax = gross*(newPreTax-oldPreTax)/100;
  const increasedRoth = gross*(newRoth-oldRoth)/100;
  return roundCents(currentTakeHome - increasedPreTax - increasedRoth + increasedPreTax*marginalTaxRatePercent/100);
}
