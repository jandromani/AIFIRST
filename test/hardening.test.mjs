import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import http from 'node:http';
import {EditionRuntime} from '../src/edition-runtime.mjs';
import {createEncryptedSnapshot,verifyEncryptedSnapshot,restoreEncryptedSnapshot} from '../src/operations-hardening.mjs';
import {makeApi} from '../bin/api.mjs';
const rubric=[{key:'execution',weight:.6},{key:'evidence',weight:.4}];
const root=()=>fs.mkdtempSync(path.join(os.tmpdir(),'aifirst-hardening-'));
test('Online SQLite snapshot encrypted, integrity-checked and restored to new isolated directory',async t=>{
 const dir=root();t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));const e=new EditionRuntime(path.join(dir,'live'));t.after(()=>e.close());
 const tenant=e.bootstrapTenant('Backup demonstration'),ctx=e.auth(tenant.token);
 e.newEdition(ctx,{title:'Synthetic',baseline:'measured',rubric});
 const k=crypto.randomBytes(32),snapshot=await createEncryptedSnapshot(e.db,e.root,k);
 assert.match(snapshot.path,/\.snapshot\.aif1$/);
 assert.equal(fs.existsSync(snapshot.path),true);
 assert.ok(!fs.readFileSync(snapshot.path).includes(Buffer.from('Backup demonstration')));
 const verified=verifyEncryptedSnapshot(snapshot.path,k);assert.equal(verified.manifest.sqlite_sha256,snapshot.manifest.sqlite_sha256);
 assert.throws(()=>verifyEncryptedSnapshot(snapshot.path,crypto.randomBytes(32)),/authenticate|decrypt|Unsupported|bad/i);
 const restored=restoreEncryptedSnapshot(snapshot.path,path.join(dir,'restored'),k);
 assert.equal(restored.restored,true);
 const check=new EditionRuntime(path.join(dir,'restored'));t.after(()=>check.close());
 assert.equal(check.own(ctx,'editions',check.rows('SELECT id FROM editions WHERE tenant=?',ctx.tenant)[0].id).title,'Synthetic');
 assert.throws(()=>restoreEncryptedSnapshot(snapshot.path,path.join(dir,'restored'),k),/empty/);
});
test('Tampered encrypted backup is rejected; restore cannot overwrite live SQLite',async t=>{
 const dir=root();t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));const e=new EditionRuntime(path.join(dir,'live'));t.after(()=>e.close());
 const k=crypto.randomBytes(32),s=await createEncryptedSnapshot(e.db,e.root,k),tamper=path.join(dir,'corrupt.aif1');
 const buf=fs.readFileSync(s.path);buf[buf.length-1]^=1;fs.writeFileSync(tamper,buf);
 assert.throws(()=>verifyEncryptedSnapshot(tamper,k),/authenticate|decrypt|bad/i);
 assert.throws(()=>restoreEncryptedSnapshot(s.path,e.root,k),/empty/);
});
test('HTTP localhost host validation rejects DNS rebinding and foreign origins',async t=>{
 const dir=root();t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));const e=new EditionRuntime(dir);t.after(()=>e.close());
 const tenant=e.bootstrapTenant('localhost test');const server=makeApi(e);
 await new Promise(ok=>server.listen(0,'127.0.0.1',ok));t.after(()=>server.close());
 const base='http://127.0.0.1:'+server.address().port;
 const badHost=await new Promise((resolve,reject)=>{
   const req=http.get(base+'/v1/health',{headers:{authorization:'Bearer '+tenant.token,Host:'evil.example'}},res=>{res.resume();resolve(res.statusCode)});
   req.on('error',reject);
 });
 assert.equal(badHost,403);
 const badOrigin=await fetch(base+'/v1/health',{headers:{authorization:'Bearer '+tenant.token,origin:'https://evil.example'}});
 assert.equal(badOrigin.status,403);
 const valid=await fetch(base+'/v1/health',{headers:{authorization:'Bearer '+tenant.token}});
 assert.equal(valid.status,200);
});
test('Console response CSP uses unpredictable nonces, no unsafe-inline',async t=>{
 const dir=root();t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));const e=new EditionRuntime(dir);t.after(()=>e.close());
 const server=makeApi(e);await new Promise(ok=>server.listen(0,'127.0.0.1',ok));t.after(()=>server.close());
 const base='http://127.0.0.1:'+server.address().port;
 const x=await fetch(base),html=await x.text(),csp=x.headers.get('content-security-policy');
 assert.equal(x.status,200);assert.ok(csp.includes("script-src 'nonce-"));assert.ok(!csp.includes('unsafe-inline'));
 const nonce=csp.match(/script-src 'nonce-([^']+)'/)[1];assert.ok(html.includes('<script nonce="'+nonce+'">'));
 assert.ok(html.includes('<style nonce="'+nonce+'">'));
});
