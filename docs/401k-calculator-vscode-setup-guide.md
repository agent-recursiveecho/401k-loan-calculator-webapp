# 401(k) Loan & Cash-Flow Calculator — Visual Studio Code Setup Guide

Version 1.0 · HTML, CSS, JavaScript, Vite

## 1. Download the project

Download `401k-loan-calculator-webapp.zip` from the ChatGPT conversation and extract it to a folder on your computer. The extracted folder is named `401k-loan-calculator-webapp`.

## 2. What is included

The project includes:

- Employee pre-tax and Roth 401(k) contribution calculations.
- Employer matching calculations, using an editable match limit.
- Loan amortization, including a financed processing fee.
- A biweekly paycheck and monthly rent calendar.
- Cash-flow projections and editable assumptions.
- Browser-local scenario storage and CSV export.
- Automated calculation tests.
- A `README.md` and documentation under `docs/`.

### Default planning inputs

| Setting | Initial value |
| --- | ---: |
| Eligible gross pay per paycheck | $1,323 |
| Estimated biweekly take-home pay | $1,000 |
| Monthly rent | $1,540 |
| Requested loan proceeds | $2,205 |
| Financed processing fee | $50 |
| Nominal annual loan interest rate | 8% |
| Loan repayment count | 26 biweekly payments |
| Employer match | 100% up to 6% of eligible earnings |
| Current pre-tax and Roth rates | 1% and 2% |
| Proposed pre-tax and Roth rates | 3% and 6% |
| Next modeled paycheck | November 19, 2026 |
| First modeled loan repayment | November 18, 2026 |

**Important:** The disbursement date is an illustrative input, not a confirmation that money arrived. The payroll effective date and actual loan schedule must be checked against the plan administrator's documents. The proposed 9% employee rate is a scenario, not a recommendation.

## 3. Prerequisites

Install [Visual Studio Code](https://code.visualstudio.com/) and an active Long Term Support (LTS) version of [Node.js](https://nodejs.org/), which includes npm.

In VS Code, open **Terminal → New Terminal** and verify the installations:

```powershell
node --version
npm --version
```

If `node` or `npm` is not recognized, install Node.js and restart VS Code before retrying.

## 4. Open the project in VS Code

1. Launch VS Code.
2. Select **File → Open Folder**.
3. Browse to the extracted `401k-loan-calculator-webapp` folder.
4. Select **Open** or **Select Folder**.
5. Open **Terminal → New Terminal**. Confirm the terminal is located in the project folder, where `package.json` exists.

## 5. Install project dependencies

From the VS Code terminal, run:

```powershell
npm install
```

This installs the Vite development dependency and generates `node_modules/` and (if not already present) `package-lock.json`. The installed `node_modules/` folder is intentionally not included in the ZIP.

## 6. Start the web application

Run:

```powershell
npm run dev
```

Open the local address shown in the terminal, normally:

```text
http://127.0.0.1:5173/
```

Keep the terminal running while using the development server. To stop it, focus the terminal and press **Ctrl+C**.

## 7. Run automated tests

Open another terminal in the project folder, or stop the development server, and run:

```powershell
npm test
```

The project uses Node.js's built-in test runner. Review the output for test pass/fail status. If a calculation test fails after a code change, investigate that change before relying on the financial projections.

## 8. Build and preview a production version

Create a production build:

```powershell
npm run build
```

The generated static website is placed in the `dist/` directory. To preview it locally:

```powershell
npm run preview
```

Open the URL printed by Vite. The optional `server/` folder is a future placeholder; a backend server is not needed for this version.

## 9. Where to edit the code

| File or folder | Responsibility |
| --- | --- |
| `index.html` | Input controls, labels, and layout structure |
| `src/styles/main.css` | Visual appearance and responsive styling |
| `src/main.js` | Application entry point |
| `src/app.js` | Connects user inputs, calculators, storage, and result rendering |
| `src/components/renderResults.js` | Displays calculated metrics and tables |
| `src/calculators/contributions.js` | Employee contribution formulas |
| `src/calculators/employerMatch.js` | Employer match formula |
| `src/calculators/loanAmortization.js` | Repayment and interest schedule |
| `src/calculators/payrollSchedule.js` | Paycheck dates and timing |
| `src/calculators/cashFlow.js` | Cash-flow events and balances |
| `src/services/storage.js` | Saves scenario inputs locally in the browser |
| `src/services/csvExport.js` | Exports calendar/results as CSV |
| `src/data/defaultScenario.js` | Scenario field identifiers; many default field values are currently in `index.html` |
| `src/utils/` | Date, money, and input validation utilities |
| `tests/calculations.test.js` | Automated calculation checks |
| `docs/` | Requirements, assumptions, methodology, and user guide |

## 10. First development milestone

1. Run the site using `npm run dev`.
2. Confirm that the input panel and calculated results appear in the browser.
3. Change the employee pre-tax and Roth percentage inputs and verify the projections refresh.
4. Compare the 2% pre-tax / 4% Roth scenario (6% total) with the 3% pre-tax / 6% Roth scenario (9% total).
5. Check the loan amortization table and modeled calendar dates.
6. Run `npm test` after changes.

The initial goal is to verify that the financial functions are separate from the interface and that modifying percentages changes the correct results.

## 11. Important financial and privacy caveats

- This is a **planning calculator**, not a tax determination or individualized financial recommendation.
- Example gross pay, take-home pay, payroll cutoffs, and loan dates are estimates or stated assumptions, not guaranteed future amounts.
- A loan repayment is not a new employee 401(k) contribution and should not be counted toward the employer match.
- The modeled amortization uses 8% / 26 as the periodic interest rate. The administrator may use daily accrual or different rounding.
- Changing contribution rates may take one or more payroll periods to take effect.
- Roth contributions and pre-tax contributions affect take-home cash differently; an exact post-tax paycheck requires payroll tax and withholding details.
- A $1,540 loan-funded rent payment creates only temporary liquidity, while repayment deductions continue afterward.
- This version saves scenario inputs using browser `localStorage`, which is **not encrypted**. Do not enter bank account numbers, Social Security numbers, passwords, or other sensitive information.

## 12. Troubleshooting

**`npm` is not recognized:** Install Node.js LTS, restart VS Code, and verify `npm --version`.

**PowerShell blocks npm scripts:** Use the Command Prompt terminal profile in VS Code, then retry `npm install` or `npm run dev`.

**The usual local port is in use:** Open the alternative local URL printed by Vite.

**The browser shows old inputs:** Scenario values may be retained in browser local storage. Review the application's save/reset controls, or clear the site's local data if appropriate.

**Financial outputs appear incorrect:** Confirm the input values and units, check whether a financed fee is included, and run `npm test`.

---

### Quick command reference

```powershell
node --version
npm --version
npm install
npm run dev
npm test
npm run build
npm run preview
```

The next step after successful startup is to review `src/app.js` and test changes to the 401(k) contribution percentages against the projected paycheck and loan schedule.
