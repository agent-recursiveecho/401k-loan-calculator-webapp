export const roundCents = n => Math.round((n + Number.EPSILON) * 100) / 100;
export const money = n => new Intl.NumberFormat('en-US', {style:'currency',currency:'USD'}).format(n);
