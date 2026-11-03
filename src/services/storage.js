const KEY='retirement-planner-scenario-v1';
export function saveScenario(values) { localStorage.setItem(KEY,JSON.stringify(values)); }
export function loadScenario() { try { return JSON.parse(localStorage.getItem(KEY)||'null'); } catch { return null; } }
export function clearScenario() { localStorage.removeItem(KEY); }
