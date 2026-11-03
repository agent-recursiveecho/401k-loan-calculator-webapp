import {dateKey} from '../utils/dates.js';
const quote = value => `"${String(value).replace(/"/g,'""')}"`;
export function calendarCsv(events) {
  const rows=[['Date','Event','Cash Change','Running Balance','Details'],...events.map(x=>[dateKey(x.date),x.type,x.delta.toFixed(2),x.balance.toFixed(2),x.detail])];
  return rows.map(row=>row.map(quote).join(',')).join('\r\n');
}
export function downloadCsv(csv,filename='401k-loan-calendar.csv') {
  const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));
  const link=document.createElement('a');link.href=url;link.download=filename;link.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}
