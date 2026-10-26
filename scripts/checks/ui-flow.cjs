const fs=require('node:fs'),assert=require('node:assert/strict'),ts=require('typescript');
const out={};new Function('exports',ts.transpileModule(fs.readFileSync('lib/ui-flow.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText)(out);
for(const page of ['visits','profile','family','preferences','notifications'])assert.equal(out.isAccountPage(page),true);
for(const page of ['home','map','rides','detail/iron-rattler','login','create'])assert.equal(out.isAccountPage(page),false);
assert.equal(out.saudiToday(new Date('2026-10-25T20:59:00Z')),'2026-10-25');
assert.equal(out.saudiToday(new Date('2026-10-25T21:01:00Z')),'2026-10-26');
console.log('Passed account route gates, public exploration routes, and Saudi date boundary.');
