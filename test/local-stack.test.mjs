import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import net from 'node:net';
import {EditionRuntime} from '../src/edition-runtime.mjs';
import {encryptArtifact} from '../src/enterprise-security.mjs';
import {s3Client,baoTransit,scanClamd,POSTGRES_MIGRATIONS,pgAuditClient} from '../src/local-stack-adapters.mjs';
import {sandboxArgs,runSandbox} from '../src/contained-sandbox.mjs';
import {LocalStackBridge} from '../src/local-stack-bridge.mjs';

const sandbox=t=>{const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'aifirst-stack-'));t.after(()=>fs.rmSync(tmp,{recursive:true,force:true}));return tmp;};
test('Local Compose only exposes 127.0.0.1, requires secrets and includes 5 services',()=>{
 const text=fs.readFileSync(new URL('../infra/compose.local.yaml',import.meta.url),'utf8');
 for(const s of ['postgres:','keycloak:','objectstore:','openbao:','clamav:'])assert.match(text,new RegExp('  '+s));
 for(const secret of ['AIFIRST_PG_PASSWORD','AIFIRST_KC_ADMIN_PASSWORD','AIFIRST_S3_USER','AIFIRST_S3_PASSWORD','AIFIRST_BAO_DEV_TOKEN'])assert.match(text,new RegExp(`\\$\\{${secret}:\\?`));
 for(const port of ['55432','58080','59000','59001','58200','53310'])assert.match(text,new RegExp(`127\\.0\\.0\\.1:${port}:`));
 assert.doesNotMatch(text,/privileged:\s*true|\/var\/run\/docker\.sock/);
});
test('S3 adapter signs ciphertext, is tenant-prefixed and refuses plaintext / remote HTTP',async()=>{
 const requests=[];
 const client=s3Client({url:'http://127.0.0.1:59000',accessKey:'test_access_key',secretKey:'test_secret_with_32_characters_long',clock:()=>new Date('2026-10-22T12:00:00Z'),
   fetchImpl:async(u,opts)=>{requests.push({url:String(u),opts});return new Response('',{status:200});}});
 const bytes=Buffer.alloc(32,123);
 const item=await client.putEncrypted({bucket:'aifirst-demo',tenant:'tenant_abc',key:'edition1/art.sealed',body:bytes});
 assert.equal(requests.length,1);assert.match(requests[0].url,/aifirst-demo\/tenant_abc\/edition1\/art.sealed/);
 assert.match(requests[0].opts.headers.authorization,/AWS4-HMAC-SHA256 Credential=/);
 assert.equal(requests[0].opts.headers['x-amz-content-sha256'],crypto.createHash('sha256').update(bytes).digest('hex'));
 assert.equal(item.sha256,crypto.createHash('sha256').update(bytes).digest('hex'));
 await assert.rejects(client.putEncrypted({bucket:'aifirst-demo',tenant:'tenant_abc',key:'../../escape',body:bytes}),/Unsafe/);
 await assert.rejects(client.putEncrypted({bucket:'aifirst-demo',tenant:'tenant_abc',key:'normal',body:Buffer.from('plain')}),/Encrypted bytes/);
 assert.throws(()=>s3Client({url:'http://example.com:9000',accessKey:'xxx',secretKey:'1234567890123456'}),/Remote services/);
});
test('OpenBao transit restricts plaintext to Bearer-only outbound request, validates response',async()=>{
 const sent=[];const bao=baoTransit({url:'http://127.0.0.1:58200',token:'dev_token_not_in_git_12345',key:'aifirst',fetchImpl:async(u,opts)=>{
   sent.push({url:String(u),opts});return Response.json({data:String(u).includes('decrypt')?{plaintext:Buffer.from('secret').toString('base64')}:{ciphertext:'vault:v1:abc'}});}});
 assert.equal(await bao.encrypt(Buffer.from('secret'),'tenant_abc'),'vault:v1:abc');
 assert.equal((await bao.decrypt('vault:v1:abc','tenant_abc')).toString(),'secret');
 assert.equal(sent[0].opts.headers['x-vault-token'],'dev_token_not_in_git_12345');
 assert.ok(!sent[0].opts.body.includes('secret'));
 assert.throws(()=>baoTransit({url:'http://evil.test:8200',token:'dev_token_not_in_git_12345'}),/Remote/);
});
test('ClamAV streams to local TCP daemon; fails closed on infected and unavailable',async t=>{
 const server=net.createServer(socket=>{let data=Buffer.alloc(0);socket.on('data',bytes=>{
  data=Buffer.concat([data,bytes]);if(data.length>18&&data.subarray(-4).equals(Buffer.alloc(4)))socket.end(data.includes(Buffer.from('MALWARE'))?'stream: Test.MALWARE FOUND\0':'stream: OK\0');
 });});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));t.after(()=>server.close());
 const port=server.address().port;
 const clean=await scanClamd(Buffer.from('TEST_FILE'),{port});assert.equal(clean.status,'CLEAN');assert.equal(clean.external_attested,false);
 const infected=await scanClamd(Buffer.from('MALWARE'),{port});assert.equal(infected.status,'INFECTED');
 await assert.rejects(scanClamd(Buffer.from('SAFE'),{port:port===65535?1:65535,timeoutMs:200}),/unavailable|timeout/);
 await assert.rejects(scanClamd(Buffer.from('SAFE'),{host:'evil.test'}),/Nonlocal/);
});
test('Postgres audit migrations are tenant-scoped and use transactional bound statements',async()=>{
 const sql=POSTGRES_MIGRATIONS.join(';');assert.match(sql,/ENABLE ROW LEVEL SECURITY/);assert.match(sql,/FORCE ROW LEVEL SECURITY/);assert.match(sql,/current_setting\('aifirst.tenant_id'/);
 const calls=[];class FakePool {async connect(){return {query:async(q,args)=>{calls.push({q,args})},release:()=>{}};}async end(){}};
 const client=await pgAuditClient({connectionString:'postgresql://aifirst:longpasswd@127.0.0.1:55432/aifirst',poolClass:FakePool});
 const migrated=await client.migrate();assert.equal(migrated.migrations,POSTGRES_MIGRATIONS.length);
 await client.append({tenant:'tenant_abc',id:crypto.randomUUID(),kind:'audit_created',entity:'task_01',sha256:'b'.repeat(64)});
 assert.ok(calls.some(x=>x.q.includes('set_config')&&x.args[1]==='tenant_abc'));
 assert.ok(calls.some(x=>x.q.startsWith('INSERT')&&x.args[4]==='b'.repeat(64)));
 await assert.rejects(pgAuditClient({connectionString:'http://evil.test/db',poolClass:FakePool}),/local URL/);
 await assert.rejects(pgAuditClient({connectionString:'postgresql://aifirst:pass@evil.test/aifirst',poolClass:FakePool}),/local URL/);
});
test('Container sandbox has no network/caps/root/writable mounts and is disabled by default',async t=>{
 const dir=sandbox(t);fs.writeFileSync(path.join(dir,'main.mjs'),'console.log("synthetic")');
 const image='node@sha256:'+'a'.repeat(64);const spec=sandboxArgs({image,sourceDir:dir});
 for(const s of ['--network','none','--read-only','--cap-drop','ALL','--pids-limit','--memory','--cpus','--user','65534:65534','no-new-privileges'])assert.ok(spec.args.includes(s));
 assert.ok(spec.args.some(a=>a.includes('readonly')));assert.equal(spec.production_attested,false);
 assert.throws(()=>sandboxArgs({image:'node:latest',sourceDir:dir}),/Pinned digest/);
 delete process.env.AIFIRST_ENABLE_UNTRUSTED_SANDBOX;
 await assert.rejects(runSandbox({image,sourceDir:dir}),/disabled/);
});
test('Encrypted S3 replica never reads foreign tenant files and records idempotent receipt',async t=>{
 const dir=sandbox(t),engine=new EditionRuntime(dir);t.after(()=>engine.close());
 const one=engine.auth(engine.bootstrapTenant('One').token),other=engine.auth(engine.bootstrapTenant('Other').token);
 const edition=engine.newEdition(one,{title:'Synthetic',baseline:'one',rubric:[{key:'quality',weight:.5},{key:'safety',weight:.5}]});
 const part=engine.register(one,edition.id,'alias_01'),sub=engine.submit(one,edition.id,part.id,'Synthetic');
 const art='art_'+crypto.randomUUID();const dest=path.join(dir,art+'.sealed');const master=crypto.randomBytes(32);
 const bytes=encryptArtifact(Buffer.from('private fixture'),{masterKey:master,tenant:one.tenant,artifactId:art});fs.writeFileSync(dest,bytes,{mode:0o600});
 engine.run('INSERT INTO artifacts VALUES(?,?,?,?,?,?,?,?,?,?)',art,one.tenant,edition.id,sub.id,'synthetic.txt','a'.repeat(64),15,'CLEAN','CLAMD_LOCAL_TEST',dest);
 let recorded;const bridge=new LocalStackBridge(engine,{s3:{bucket:'aifirst-demo',client:{putEncrypted:async v=>{recorded=v;return {key:v.tenant+'/'+v.key,sha256:crypto.createHash('sha256').update(v.body).digest('hex'),bytes:v.body.length}}}}});
 const r=await bridge.replicateEncrypted(one,art);assert.equal(r.secondary_copy,true);assert.ok(recorded.body.equals(bytes));
 assert.equal((await bridge.replicateEncrypted(one,art)).idempotent,true);
 await assert.rejects(bridge.replicateEncrypted(other,art),/Not found/);
 assert.equal(bridge.status(one).encrypted_objects_replicated,1);
});
