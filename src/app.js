import {inputIds} from './data/defaultScenario.js';
import {roundCents,money} from './utils/currency.js';
import {parseDate,addDays} from './utils/dates.js';
import {validateInputs} from './utils/validation.js';
import {employeeContribution,estimatedTakeHome} from './calculators/contributions.js';
import {employerMatch} from './calculators/employerMatch.js';
import {amortizeLoan} from './calculators/loanAmortization.js';
import {paydays,contributionEffective} from './calculators/payrollSchedule.js';
import {runningCashFlow} from './calculators/cashFlow.js';
import {renderResults} from './components/renderResults.js';
import {calendarCsv,downloadCsv} from './services/csvExport.js';
import {loadScenario,saveScenario} from './services/storage.js';

const $=id=>document.getElementById(id);
const readValues=()=>Object.fromEntries(inputIds.map(id=>[id, $(id).type==='date'?$(id).value:Number($(id).value)]));
let currentEvents=[];
export function startApp() {
  const previous=loadScenario();
  if(previous) for(const id of inputIds) if(Object.hasOwn(previous,id)) $(id).value=previous[id];
  inputIds.forEach(id=>$(id).addEventListener('input',render));
  $('download').addEventListener('click',()=>downloadCsv(calendarCsv(currentEvents)));
  render();
}
function render() {
  const v=readValues(),problems=validateInputs(v);
  if(problems.length){ $('metrics').innerHTML=''; $('compare').innerHTML=''; $('amort').innerHTML=''; $('calendar').innerHTML=''; $('messages').textContent=problems.join(' '); $('messages').className='note error'; $('download').disabled=true; return; }
  $('messages').className='note'; $('download').disabled=false;
  saveScenario(v);
  const {gross:g,takehome:th,rent,oldPre,oldRoth,newPre,newRoth,matchCap,matchRatio,taxRate}=v;
  const loan=amortizeLoan({principal:roundCents(v.loan+v.fee),aprPercent:v.apr,payments:v.count,firstDate:parseDate(v.repayment)});
  const payday=parseDate(v.payday),disbursement=parseDate(v.disbursement);
  const events=[];
  function event(date,type,delta,priority,detail=''){events.push({date,type,delta:roundCents(delta),priority,detail});}
  for(const row of loan.rows) event(row.date,'Loan repayment',-row.payment,2,`Payment ${row.number}`);
  const newTakeHome=estimatedTakeHome(th,g,oldPre,oldRoth,newPre,newRoth,taxRate);
  const oldMatch=employerMatch(g,oldPre+oldRoth,matchCap,matchRatio);
  const newMatch=employerMatch(g,newPre+newRoth,matchCap,matchRatio);
  let affected=0,additional=0;
  const payrollDates=paydays(payday,26);
  for(const day of payrollDates) {
    const active=contributionEffective(day,disbursement,payday,v.delay);
    const preTax=active?newPre:oldPre,roth=active?newRoth:oldRoth;
    const contribution=employeeContribution(g,preTax,roth);
    const match=employerMatch(g,preTax+roth,matchCap,matchRatio);
    if(active){affected++;additional=roundCents(additional+g*((newPre+newRoth)-(oldPre+oldRoth))/100);}
    event(day,'Paycheck',active?newTakeHome:th,1,`${active?'New':'Current'} rates; employee 401(k) ${money(contribution.total)}, match ${money(match)}`);
  }
  const lastPay=payrollDates.at(-1),lastRep=loan.rows.at(-1).date;
  const end=lastRep>lastPay?lastRep:lastPay,start=disbursement<payday?disbursement:payday;
  const from=new Date(start.getFullYear(),start.getMonth(),1);
  const to=new Date(end.getFullYear(),end.getMonth()+1,0);
  for(let month=new Date(from);month<=to;month.setMonth(month.getMonth()+1)) {
    const due=new Date(month.getFullYear(),month.getMonth(),v.rentDay,12);
    if(due>=start&&due<=end) {
      event(due,'Rent',-rent,3,'Monthly rent');
      if(v.expenses>0) event(due,'Other expenses',-v.expenses,4,'Monthly estimated expenses');
    }
  }
  event(disbursement,'Loan disbursement',v.proceeds,0,'Cash proceeds (financed fee excluded)');
  const cash=runningCashFlow(events,v.opening);currentEvents=cash.events;
  const warnings=[];
  if(th>=g) warnings.push('Take-home equals or exceeds eligible gross pay; check whether the eligible earnings figure differs from total gross pay.');
  if(v.loanRent>v.proceeds) warnings.push('Loan-funded rent allocation exceeds the assumed cash proceeds.');
  if(v.loanRent!==rent) warnings.push('Loan-funded rent allocation differs from monthly rent.');
  if(newPre+newRoth>matchCap) warnings.push('Employee deferrals above the match cap do not earn extra match under this formula.');
  if(v.delay>0) warnings.push('Payroll delay is an assumption; confirm your plan’s effective date.');
  if(cash.minimum<0) warnings.push('Projected cash balance becomes negative; the model may omit savings, income, expenses, or bank timing.');
  renderResults({
    metrics:[['Loan payment / 2 weeks',money(loan.regularPayment)],['Loan interest (estimated)',money(loan.totalInterest)],['Total loan repayment',money(loan.totalPaid)],['New total contribution rate',`${newPre+newRoth}%`],['Additional 401(k) over 26 paydays',money(additional)],['Paychecks at new rates',affected],['Estimated new take-home',money(newTakeHome)],['Lowest projected cash balance',money(cash.minimum)]],
    warnings,
    comparison:[['Pre-tax rate',`${oldPre}%`,`${newPre}%`],['Roth rate',`${oldRoth}%`,`${newRoth}%`],['Employee deferral',money(employeeContribution(g,oldPre,oldRoth).total),money(employeeContribution(g,newPre,newRoth).total)],['Estimated employer match',money(oldMatch),money(newMatch)],['Net paycheck (before loan payment)',money(th),money(newTakeHome)]],
    amortization:loan.rows,events:cash.events
  });
}
