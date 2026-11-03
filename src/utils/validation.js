export function validateInputs(v) {
  const issues=[];
  for (const key of ['gross','takehome','rent','expenses','loan','fee','apr','proceeds','loanRent']) if (!Number.isFinite(v[key])||v[key]<0) issues.push(`${key} must be a nonnegative number.`);
  for (const key of ['oldPre','oldRoth','newPre','newRoth','matchCap','matchRatio','taxRate']) if (!Number.isFinite(v[key])||v[key]<0||v[key]>100) issues.push(`${key} must be between 0 and 100.`);
  if(v.newPre+v.newRoth>100||v.oldPre+v.oldRoth>100) issues.push('Combined contribution percentages cannot exceed 100%.');
  if(!Number.isInteger(v.count)||v.count<1||v.count>260) issues.push('Number of repayments must be 1–260.');
  if(!Number.isInteger(v.delay)||v.delay<0||v.delay>26) issues.push('Payroll delay must be 0–26.');
  if(!Number.isInteger(v.rentDay)||v.rentDay<1||v.rentDay>28) issues.push('Rent day must be 1–28.');
  for(const key of ['payday','disbursement','repayment']) if(!/^\d{4}-\d{2}-\d{2}$/.test(v[key])||Number.isNaN(new Date(`${v[key]}T12:00:00`).getTime())) issues.push(`${key} must be a valid date.`);
  if(v.loan+v.fee<=0) issues.push('Financed principal must be positive.');
  return issues;
}
