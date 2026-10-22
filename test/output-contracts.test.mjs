import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {ORIGINAL_OUTPUTS} from '../src/edition-runtime.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
test('EX01–EX11 source semantics stable across original, canonical catalog and runtime',()=>{
 const a=read('catalog/original-deliverables.json').deliverables;
 const b=read('catalog/outputs.json').outputs;
 assert.equal(a.length,11);assert.equal(b.length,11);assert.equal(ORIGINAL_OUTPUTS.length,11);
 for(let i=0;i<11;i++)for(const field of ['id','name','audience','format']){
  assert.equal(a[i][field],b[i][field],`catalog ${a[i].id}.${field}`);
  assert.equal(a[i][field],ORIGINAL_OUTPUTS[i][field],`runtime ${a[i].id}.${field}`);
 }
 assert.equal(b.find(x=>x.id==='EX09').audience,'Participante autorizado');
 assert.ok(b.every(x=>x.status!=='VERIFIED_PRODUCTION'));
});
