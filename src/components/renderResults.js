import {money} from '../utils/currency.js';
import {formatDate} from '../utils/dates.js';
const td = x => `<td>${x}</td>`;
const escape = x => String(x).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
export function renderResults({metrics, warnings, comparison, amortization, events}) {
  document.getElementById('metrics').innerHTML=metrics.map(([name,value])=>`<div class="metric"><span>${escape(name)}</span><b>${escape(value)}</b></div>`).join('');
  document.getElementById('messages').innerHTML='<b>Planning checks:</b> '+(warnings.length?warnings.map(escape).join(' '):'No structural warnings for the current inputs.');
  document.getElementById('compare').innerHTML='<tr><th>Metric</th><th>Current</th><th>New</th></tr>'+comparison.map(row=>`<tr>${row.map(x=>td(escape(x))).join('')}</tr>`).join('');
  document.getElementById('amort').innerHTML='<tr><th># / date</th><th>Payment</th><th>Interest</th><th>Principal</th><th>Balance</th></tr>'+amortization.map(x=>`<tr>${td(x.number+' · '+formatDate(x.date))}${td(money(x.payment))}${td(money(x.interest))}${td(money(x.principalPaid))}${td(money(x.balance))}</tr>`).join('');
  document.getElementById('calendar').innerHTML='<tr><th>Date</th><th>Event</th><th>Cash change</th><th>Running balance</th><th>Details</th></tr>'+events.map(x=>`<tr>${td(formatDate(x.date))}${td(escape(x.type))}${td(money(x.delta))}${td(money(x.balance))}${td(escape(x.detail))}</tr>`).join('');
}
