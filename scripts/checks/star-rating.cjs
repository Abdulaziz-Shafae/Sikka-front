const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),ts=require('typescript'),React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
const code=ts.transpileModule(fs.readFileSync(path.resolve(__dirname,'../../components/sikka/star-rating.tsx'),'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText;
const out={};new Function('exports','require',code)(out,require);
const render=value=>renderToStaticMarkup(React.createElement(out.StarRating,{name:'rating',label:'كيف اللعبة معاك؟',defaultValue:value}));
const empty=render(0),three=render(3);
assert.equal((empty.match(/<button /g)||[]).length,5);assert.equal((empty.match(/fill="#facc15"/g)||[]).length,0);assert.equal((three.match(/fill="#facc15"/g)||[]).length,3);assert.equal((three.match(/aria-pressed="true"/g)||[]).length,1);assert.match(three,/name="rating"[^>]*value="3"/);assert.equal(three.includes('<select'),false);
console.log('Passed five-star rendering: initially gray, three selected stars gold, accessible score and no dropdown.');
