import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const run=(args=[])=>execFileSync(process.execPath,[path.join(root,'bin/build-public-preview.mjs'),...args],{cwd:root,encoding:'utf8'});
const files=['index.html','evolution.html','console.html','lab.html','atlas.html','PREVIEW_STATUS.json','robots.txt'];
test('Public preview builds a complete navigable read-only package without Docker',t=>{
 const dir=fs.mkdtempSync(path.join(root,'dist-test-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
 const result=JSON.parse(run([dir]));assert.equal(result.read_only,true);
 for(const f of files)assert.ok(fs.existsSync(path.join(dir,f)),f);
 const index=fs.readFileSync(path.join(dir,'index.html'),'utf8');
 assert.match(index,/href="evolution.html"/);assert.match(index,/name="robots" content="noindex,nofollow"/);assert.match(index,/href="console.html"/);
 assert.doesNotMatch(index,/href="\/console"/);
 const evolution=fs.readFileSync(path.join(dir,'evolution.html'),'utf8');
 assert.match(evolution,/id="token" disabled hidden/);assert.match(evolution,/id="connect"[^>]+disabled/);
 assert.match(evolution,/read.only|solo lectura/i);
 assert.match(evolution,/href="index.html"/);
 assert.doesNotMatch(evolution,/href="\/"/);
 assert.match(fs.readFileSync(path.join(dir,'console.html'),'utf8'),/No introduzcas tokens/);
 const status=JSON.parse(fs.readFileSync(path.join(dir,'PREVIEW_STATUS.json')));
 assert.equal(status.production_ready,false);assert.equal(status.backend_included,false);
 assert.equal(status.client_data_included,false);
});
test('Public preview refuses unsafe output directories and symlinks',t=>{
 assert.throws(()=>run([root]));
 const link=path.join(root,'dist-test-link');
 try{fs.symlinkSync(os.tmpdir(),link,'dir'); t.after(()=>fs.rmSync(link,{force:true}));assert.throws(()=>run([link]));}
 catch(e){if(e.code!=='EPERM'&&e.code!=='EACCES')throw e;}
});
test('HTML source has no hard-coded private credentials or externally hosted JS',()=>{
 for(const file of ['index.html','evolution.html']){
  const s=fs.readFileSync(path.join(root,'web',file),'utf8');
  assert.doesNotMatch(s,/<script[^>]+src="https?:\/\//i);
  assert.doesNotMatch(s,/(?:OPENROUTER_API_KEY|AIFIRST_MASTER_KEY_B64)\s*[:=]\s*["'][^"']+/i);
 }
});
