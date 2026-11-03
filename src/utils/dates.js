export const parseDate = value => new Date(`${value}T12:00:00`);
export function addDays(date, n) { const x = new Date(date); x.setDate(x.getDate() + n); return x; }
export const dateKey = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
export const formatDate = d => d.toLocaleDateString('en-US', {month:'short',day:'numeric',year:'numeric'});
