const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),ts=require('typescript');
const root=path.resolve(__dirname,'../..');
function read(p){return fs.readFileSync(path.join(root,p),'utf8');}
const modal=read('components/sikka/use-modal-focus.ts');
const plan=read('components/sikka/live-plan.tsx');
const map=read('components/sikka/park-map.tsx');
const preview=read('components/sikka/visit-summary-poster.tsx');
const css=read('app/globals.css');
for(const p of ['components/sikka/use-modal-focus.ts','components/sikka/live-plan.tsx','components/sikka/park-map.tsx','components/sikka/visit-summary-poster.tsx']){
 const text=read(p);const jsx=p.endsWith('.tsx');
 const parsed=ts.transpileModule(text,{fileName:p,reportDiagnostics:true,compilerOptions:{jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}});
 const errors=(parsed.diagnostics||[]).filter(d=>d.category===ts.DiagnosticCategory.Error);
 assert.equal(errors.length,0,p+': '+errors.map(e=>ts.flattenDiagnosticMessageText(e.messageText,' ')).join(' | '));
}
assert.match(modal,/addEventListener\('keydown',onKey,true\)/);
assert.match(modal,/addEventListener\('focusin',onFocus\)/);
assert.match(modal,/event\.key==='Escape'/);
assert.match(modal,/event\.shiftKey/);
assert.match(modal,/previous\?\.isConnected&&previous\.focus\(\)/);
for(const id of ['skipDialogRef','replanDialogRef','completionDialogRef']){
 assert.match(plan,new RegExp('ref=\\{'+id+'\\} tabIndex=\\{-1\\}'));
}
assert.match(plan,/useModalFocus\(!!skipConfirmation/);
assert.match(plan,/useModalFocus\(replanOpen/);
assert.match(plan,/useModalFocus\(!!completion/);
assert.match(preview,/className="sikka-poster-preview"/);
assert.match(preview,/tabIndex=\{0\}/);
assert.match(css,/\.sikka-poster-preview>svg\{width:900px!important/);
assert.match(css,/\.map-selection-actions button\[data-slot=button\]\{min-height:44px/);
assert.match(css,/\.map-controls button\{min-width:44px;min-height:44px/);
assert.match(css,/\[role="dialog"\]\.readiness-panel,\[role="alertdialog"\]\.readiness-panel\{max-height:calc\(100dvh - 32px\)/);
assert.match(map,/aria-label="تحديد موقعي"/);
assert.match(map,/وجهني لها/);
assert.match(preview,/viewBox="0 0 1600 900"/);
assert.match(preview,/const positions=\[237,547,857,1167\]/);
assert.match(preview,/direction="right"/);
assert.match(preview,/direction="left"/);
console.log('Point 12: TypeScript TSX parsing, modal focus, Escape, scroll preview, map touch targets, unchanged poster geometry PASS');
