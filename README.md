# 401(k) Loan & Cash-Flow Planner

A browser-based, editable planning calculator. No backend, bank access, or sign-in is needed. Inputs are saved **only in this browser's localStorage**. This is a planning model, not a financial recommendation.

## Start in Visual Studio Code

1. Open this folder in VS Code.
2. Open a terminal (**Terminal → New Terminal**).
3. Install Node.js (LTS) if not already installed; confirm using `node --version`.
4. Run `npm install`.
5. Run `npm run dev`.
6. Open the local URL shown in the terminal, normally `http://127.0.0.1:5173/`.

Other commands: `npm test` (calculation tests), `npm run build` (production `dist/`), `npm run preview` (local production preview).

## Where to edit

- `index.html`: labels, input controls, result layout.
- `src/styles/main.css`: appearance.
- `src/app.js`: connects input fields with calculations and results.
- `src/calculators/`: independent financial calculation functions.
- `src/components/renderResults.js`: HTML table and metric rendering.
- `src/data/defaultScenario.js`: input field identifiers; default values currently reside in `index.html`.
- `tests/calculations.test.js`: automated regression checks.

## Important limitations

The example assumes $1,323 in eligible biweekly gross pay, $1,000 take-home under existing deferrals, rent $1,540 due on the 22nd, and an illustrative $2,205 cash loan with $50 financed fee. The disbursement date in the demo is **hypothetical** and must be updated after funds arrive. A 26-payment amortization uses a simple nominal 8% APR divided by 26; an administrator's actual schedule can differ. The 26-paycheck calendar and loan schedule are separate. Cashflow excludes expenses not entered. Employer matching is modeled as 100% of combined employee deferrals up to 6% of eligible gross pay; plan rules can differ. Increasing to 3% pretax/6% Roth preserves the 1:2 ratio, but overshoots the one-time $1,540 goal if applied for 26 full paychecks. Payroll processing delay is a user-entered assumption. No investment returns or tax determination is modeled.

**Data privacy:** localStorage is not encrypted; do not enter bank details, Social Security numbers, or other sensitive personal information. There is no server or network data transmission by the calculator itself.
