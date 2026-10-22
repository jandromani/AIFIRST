import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const html=read('web/demo.html');

test('Decision Theater ships three independent, accessible demos with no external API',()=>{
 assert.match(html,/id="panel-discovery"/);
 assert.match(html,/id="panel-arena"/);
 assert.match(html,/id="panel-dios"/);
 assert.match(html,/data-nav="discovery"/);
 assert.match(html,/data-nav="arena"/);
 assert.match(html,/data-nav="dios"/);
 assert.match(html,/aria-live="polite"/);
 assert.match(html,/prefers-reduced-motion/);
 assert.match(html,/id="arena-rollback" disabled/);
 assert.match(html,/id="god-adopt" disabled/);
 assert.doesNotMatch(html,/<script[^>]+src=/i);
 assert.doesNotMatch(html,/\bfetch\s*\(|\bWebSocket\s*\(|\bXMLHttpRequest\s*\(/);
 assert.doesNotMatch(html,/localStorage|sessionStorage|document\.cookie/);
});

test('All public scenario inputs, evidence and outcomes are explicitly synthetic',()=>{
 assert.match(html,/SIMULACIÓN EXPLÍCITA/);
 assert.match(html,/simulaci[oó]n/i);
 assert.match(html,/HKT-2026 \/ SYNTHETIC/);
 assert.match(html,/no firmas Ed25519/i);
 assert.match(html,/no.*benchmark externo/i);
 assert.match(html,/G5 · PENDING HUMAN/);
 assert.match(html,/production_release:false/);
 const projectDefinitions=[...html.matchAll(/\{id:'D\d\d',name:/g)];
 assert.equal(projectDefinitions.length,10);
 const rosterDefinitions=[...html.matchAll(/\{id:'AG-\d\d',name:/g)];
 assert.equal(rosterDefinitions.length,5);
 assert.match(html,/yes===roster\.length/);
 assert.match(html,/arenaState\.unsafe===0/);
});

test('Decision Theater inline JavaScript parses in Node and links from both product pages',()=>{
 const script=html.match(/<script>([\s\S]*?)<\/script>/);
 assert.ok(script);
 assert.doesNotThrow(()=>new Function(script[1]));
 assert.match(read('web/index.html'),/href="\/demo#discovery"/);
 assert.match(read('web/index.html'),/href="\/demo#dios"/);
 assert.match(read('web/evolution.html'),/href="\/demo#arena"/);
 assert.match(read('README.md'),/Decision Theater/);
});

test('Static public build contains all 3 offline demos and never exposes private APIs',t=>{
 const folder=fs.mkdtempSync(path.join(root,'dist-theater-'));
 t.after(()=>fs.rmSync(folder,{recursive:true,force:true}));
 const stdout=execFileSync(process.execPath,[path.join(root,'bin/build-public-preview.mjs'),folder],{cwd:root,encoding:'utf8'});
 const report=JSON.parse(stdout);
 assert.equal(report.read_only,true);
 const manifest=JSON.parse(fs.readFileSync(path.join(folder,'PREVIEW_STATUS.json'),'utf8'));
 assert.equal(manifest.decision_theater_included,true);
 assert.equal(manifest.interactive_demo_count,3);
 assert.equal(manifest.backend_included,false);
 assert.equal(manifest.production_ready,false);
 const demo=fs.readFileSync(path.join(folder,'demo.html'),'utf8');
 assert.match(demo,/href="index.html"/);
 assert.match(demo,/href="evolution.html"/);
 assert.match(demo,/content="noindex,nofollow"/);
 assert.match(fs.readFileSync(path.join(folder,'index.html'),'utf8'),/href="demo.html#discovery"/);
 assert.match(fs.readFileSync(path.join(folder,'index.html'),'utf8'),/href="demo.html#dios"/);
 assert.match(fs.readFileSync(path.join(folder,'evolution.html'),'utf8'),/href="demo.html#arena"/);
 assert.doesNotMatch(demo,/href="\/console"/);
});

test('Node API serves demo as a static page without token on loopback',()=>{
 const api=read('bin/api.mjs');
 assert.match(api,/\['\/',\s*'\/console'[^\]]*'\/demo'/);
 assert.match(api,/'\/demo':'demo\.html'/);
});

test('Private Node server serves the theater without authentication and enforces CSP',async t=>{
 const os=await import('node:os');
 const {EditionRuntime}=await import('../src/edition-runtime.mjs');
 const {makeApi}=await import('../bin/api.mjs');
 const storage=fs.mkdtempSync(path.join(os.tmpdir(),'aifirst-public-theater-'));
 const engine=new EditionRuntime(storage);
 const server=makeApi(engine);
 t.after(()=>{server.close();engine.close();fs.rmSync(storage,{recursive:true,force:true});});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const port=server.address().port;
 const res=await fetch(`http://127.0.0.1:${port}/demo`);
 assert.equal(res.status,200);
 assert.match(res.headers.get('content-security-policy'),/nonce-/);
 const markup=await res.text();
 assert.match(markup,/id="panel-dios"/);
 assert.match(markup,/<script nonce="[A-Za-z0-9+/=]+">/);
 const {request}=await import('node:http');
 const denied=await new Promise((resolve,reject)=>{const req=request({host:'127.0.0.1',port,path:'/demo',headers:{host:'outside.test'}},res=>{res.resume();resolve(res.statusCode)});req.on('error',reject);req.end();});
 assert.equal(denied,403);
});
