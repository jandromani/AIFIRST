import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {EditionRuntime} from '../src/edition-runtime.mjs';
import {makeApi} from '../bin/api.mjs';
import {IndependentArena} from '../src/independent-arena.mjs';
const repo=path.resolve(import.meta.dirname,'..');

test('local HTTP serves private arena and refuses unauthenticated reads and remote writes',async t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'aifirst-arena-http-'));
 const engine=new EditionRuntime(dir), a=engine.bootstrapTenant('Shadow');const other=engine.bootstrapTenant('Other');
 const s=makeApi(engine);await new Promise(resolve=>s.listen(0,'127.0.0.1',resolve));
 t.after(async()=>{await new Promise(resolve=>s.close(resolve));engine.close();fs.rmSync(dir,{recursive:true,force:true});});
 const base=`http://127.0.0.1:${s.address().port}`;
 let r=await fetch(base+'/arena');assert.equal(r.status,200);assert.match(await r.text(),/Independent Arena/);
 r=await fetch(base+'/v1/arena/runs');assert.equal(r.status,401);
 for(const token of [a.token,other.token]){
  r=await fetch(base+'/v1/arena/runs',{headers:{Authorization:'Bearer '+token}});assert.equal(r.status,200);assert.deepEqual((await r.json()).runs,[]);
  r=await fetch(base+'/v1/arena/runs',{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:'{}'});assert.equal(r.status,405);
 }
 r=await fetch(base+'/v1/arena/audit',{headers:{Authorization:'Bearer '+a.token}});assert.equal((await r.json()).valid,true);
});
test('public static build replaces private arena with a placeholder, without exporting outcomes',t=>{
 const dest=fs.mkdtempSync(path.join(repo,'dist-arena-test-'));t.after(()=>fs.rmSync(dest,{recursive:true,force:true}));
 execFileSync(process.execPath,[path.join(repo,'bin/build-public-preview.mjs'),dest],{cwd:repo});
 const html=fs.readFileSync(path.join(dest,'arena.html'),'utf8');assert.match(html,/private shadow/i);
 assert.doesNotMatch(html,/Bearer/);assert.doesNotMatch(html,/Independent Arena v1/);
});
