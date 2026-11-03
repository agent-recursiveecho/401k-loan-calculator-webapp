import {roundCents} from '../utils/currency.js';
/** Simplified match: matchRatioPercent of combined employee deferrals, capped at matchCapPercent of eligible pay. */
export function employerMatch(gross, employeeRatePercent, matchCapPercent=6, matchRatioPercent=100) {
  return roundCents(gross*Math.min(matchCapPercent,employeeRatePercent)/100*matchRatioPercent/100);
}
