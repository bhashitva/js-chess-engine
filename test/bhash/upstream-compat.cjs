// Execute the unchanged upstream API/FEN Jest specifications with a small matcher
// shim, avoiding a dependency installation in the deliverable. Not shipped.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const ts=require(process.env.BHASH_TYPESCRIPT || 'typescript');
const api=require('../../bhash/index.cjs');
let failed=0,total=0;
global.describe=(_,fn)=>fn();
global.it=(name,fn)=>{total++;try{fn();}catch(e){failed++;console.log('FAIL',name,e.message);}};
global.test=global.it;
function expect(actual,negate=false) {
 function check(fn) {let caught=false;try{fn();}catch(e){caught=true;if(!negate)throw e;} if(negate&&!caught)throw new Error('Negated expectation failed');}
 const match={
  toBe:x=>check(()=>assert.equal(actual,x)),toEqual:x=>check(()=>assert.deepEqual(actual,x)),
  toBeDefined:()=>check(()=>assert.notEqual(actual,undefined)),toBeUndefined:()=>check(()=>assert.equal(actual,undefined)),
  toBeNull:()=>check(()=>assert.equal(actual,null)),toContain:x=>check(()=>assert.ok(actual.includes(x))),
  toBeGreaterThan:x=>check(()=>assert.ok(actual>x)),toBeGreaterThanOrEqual:x=>check(()=>assert.ok(actual>=x)),
  toBeLessThanOrEqual:x=>check(()=>assert.ok(actual<=x)),toHaveLength:x=>check(()=>assert.equal(actual.length,x)),
  toHaveProperty:x=>check(()=>assert.ok(Object.hasOwn(actual,x))),toBeTruthy:()=>check(()=>assert.ok(actual)),toBeFalsy:()=>check(()=>assert.ok(!actual)),
  toThrow:()=>check(()=>assert.throws(actual)),
 };
 Object.defineProperty(match,'not',{get:()=>expect(actual,!negate)});return match;
}
global.expect=expect;
for(const filename of ['api.test.ts','fen.test.ts']) {
 const source=fs.readFileSync(path.join(__dirname, '../integration', filename),'utf8');
 const js=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;
 const exports={};new Function('require','exports',js)(name=>name==='../../src'?api:require(name),exports);
}
console.log(JSON.stringify({total,passed:total-failed,failed}));process.exitCode=failed?1:0;
