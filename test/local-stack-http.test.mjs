import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import {EditionRuntime} from '../src/edition-runtime.mjs';
import {makeApi} from '../bin/api.mjs';

test('Lab readiness endpoint is authenticated and tenant scoped, not an attestation',async t=>{
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'aifirst-http-lab-'));const engine=new EditionRuntime(tmp);
 const a=engine.bootstrapTenant('One'),b=engine.bootstrapTenant('Two'),admin=engine.auth(a.token);const guest=engine.auth(engine.addPrincipal(admin,'sales').token);
 const server=makeApi(engine);await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));t.after(async()=>{await new Promise(resolve=>server.close(resolve));engine.close();fs.rmSync(tmp,{recursive:true,force:true});});
 const host=`http://127.0.0.1:${server.address().port}`;
 const get=async token=>fetch(host+'/v1/stack/readiness',{headers:token?{authorization:'Bearer '+token}:{}});
 assert.equal((await get()).status,401);
 assert.equal((await get(engine.addPrincipal(admin,'sales').token)).status,403);
 const response=await get(a.token);assert.equal(response.status,200);const j=await response.json();
 assert.equal(j.production_ready,false);assert.equal(j.postgres_primary,false);assert.equal(j.encrypted_objects_replicated,0);
 assert.equal((await (await get(b.token)).json()).encrypted_objects_replicated,0);
 const malformed=await new Promise((resolve,reject)=>{const r=http.get({hostname:'127.0.0.1',port:server.address().port,path:'/v1/stack/readiness',headers:{host:'untrusted.tld',authorization:'Bearer '+a.token}},res=>{res.resume();res.on('end',()=>resolve(res.statusCode));});r.on('error',reject);});assert.equal(malformed,403);
});
