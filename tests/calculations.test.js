import test from 'node:test';
import assert from 'node:assert/strict';
import {employeeContribution,estimatedTakeHome} from '../src/calculators/contributions.js';
import {employerMatch} from '../src/calculators/employerMatch.js';
import {amortizeLoan} from '../src/calculators/loanAmortization.js';
import {runningCashFlow} from '../src/calculators/cashFlow.js';
import {paydays,contributionEffective} from '../src/calculators/payrollSchedule.js';
import {parseDate} from '../src/utils/dates.js';

test('1:2 allocation at 3% and 6%',()=>assert.deepEqual(employeeContribution(1323,3,6),{preTax:39.69,roth:79.38,total:119.07}));
test('match capped at 6%',()=>{assert.equal(employerMatch(1323,9,6,100),79.38);assert.equal(employerMatch(1323,3,6,100),39.69);});
test('take-home difference accounts for pre-tax savings only',()=>assert.equal(estimatedTakeHome(1000,1323,1,2,3,6,20),925.91));
test('26 loan payments end with zero balance',()=>{const a=amortizeLoan({principal:2255,aprPercent:8,payments:26,firstDate:parseDate('2026-11-18')});assert.equal(a.rows.length,26);assert.equal(a.rows.at(-1).balance,0);assert.equal(a.rows[0].date.getDate(),18);assert.equal(a.totalPaid,Math.round((2255+a.totalInterest)*100)/100);});
test('zero interest loan',()=>{const a=amortizeLoan({principal:100,aprPercent:0,payments:4,firstDate:parseDate('2026-11-18')});assert.equal(a.totalInterest,0);assert.equal(a.totalPaid,100);});
test('biweekly paydays and delayed activation',()=>{const first=parseDate('2026-11-19'),dates=paydays(first);assert.equal(dates.length,26);assert.equal(dates[1].getDate(),3);assert.equal(contributionEffective(dates[0],parseDate('2026-11-18'),first,1),false);assert.equal(contributionEffective(dates[1],parseDate('2026-11-18'),first,1),true);});
test('cash flow sorted with negative balance warning threshold',()=>{const d=parseDate('2026-11-19');const s=runningCashFlow([{date:d,delta:-1540,priority:2},{date:d,delta:1000,priority:1}],0);assert.equal(s.endingBalance,-540);assert.equal(s.minimum,-540);});

test('cash flow rejects invalid transaction amounts', () => {
  const date = parseDate('2026-11-19');

  assert.throws(
    () => runningCashFlow([
      { date, delta: Number.NaN, priority: 1 }
    ], 0),
    TypeError
  );
});

test('cash flow rejects invalid transaction dates', () => {
  assert.throws(
    () => runningCashFlow([
      { date: new Date('invalid'), delta: 100, priority: 1 }
    ], 0),
    TypeError
  );
});

test('cash flow preserves same-day transaction order', () => {
  const date = parseDate('2026-11-19');

  const result = runningCashFlow([
    { date, delta: 100, priority: 1, label: 'First' },
    { date, delta: 200, priority: 1, label: 'Second' }
  ], 0);

  assert.equal(result.events[0].label, 'First');
  assert.equal(result.events[1].label, 'Second');
  assert.equal(result.endingBalance, 300);
});

test('cash flow identifies negative balances', () => {
  const date = parseDate('2026-11-19');

  const result = runningCashFlow([
    { date, delta: 1000, priority: 1 },
    { date, delta: -1540, priority: 2 }
  ], 0);

  assert.equal(result.endingBalance, -540);
  assert.equal(result.minimum, -540);
  assert.equal(result.hasShortfall, true);
});

test('contribution delay follows a later disbursement', () => {
  const firstPayday = parseDate('2026-11-19');
  const disbursement = parseDate('2026-11-20');

  assert.equal(
    contributionEffective(
      parseDate('2026-12-03'),
      disbursement,
      firstPayday,
      1
    ),
    false
  );

  assert.equal(
    contributionEffective(
      parseDate('2026-12-17'),
      disbursement,
      firstPayday,
      1
    ),
    true
  );
});

test('contribution changes can begin without delay', () => {
  const firstPayday = parseDate('2026-11-19');
  const disbursement = parseDate('2026-11-18');

  assert.equal(
    contributionEffective(
      firstPayday,
      disbursement,
      firstPayday,
      0
    ),
    true
  );
});

test('paydays rejects invalid paycheck counts', () => {
  assert.throws(
    () => paydays(parseDate('2026-11-19'), -1),
    RangeError
  );
});

test('contribution timing rejects negative delays', () => {
  assert.throws(
    () => contributionEffective(
      parseDate('2026-11-19'),
      parseDate('2026-11-18'),
      parseDate('2026-11-19'),
      -1
    ),
    RangeError
  );
});
