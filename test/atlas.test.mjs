import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {validateCatalog,validateContract} from "../src/core.mjs";
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const get=p=>JSON.parse(fs.readFileSync(path.join(root,p),"utf8"));
test("12 operating domains / 135 atomic components / 68 linked relationships",()=>{
 const g=get("catalog/operating-model.json");
 assert.equal(g.domainCount,12);
 assert.equal(g.componentCount,135);
 assert.equal(g.edges.length,68);
 assert.deepEqual(validateCatalog(g),[]);
 const ids=g.domains.flatMap(d=>d.components.map(c=>c.id));
 assert.equal(new Set(ids).size,ids.length);
});
test("14 new contracts of 06–12 have dedicated draft 2020-12 schema",()=>{
 const index=get("contracts/index.json").contracts;
 assert.equal(Object.keys(index).length,23);
 for(const name of ["EventEnvelope","DeliveryMessage","ParticipantRegistration","TeamRoster","SubmissionManifest","IntakeReceipt","EvidenceClaim","NormalizedPackage","JobSpec","AgentTrace","EvaluationResult","JuryReview","CapabilityEvidence","CapabilityAggregate"]){
  const s=get("contracts/"+name+".schema.json");
  assert.deepEqual(index[name],s);
  assert.equal(s.additionalProperties,false);
  assert.ok(s.required.length>0);
 }
});
test("every domain 06–12 exposes external input, internal process, output, owner and acceptance",()=>{
 const wf=get("catalog/phase2-workflows.json").workflows;
 assert.equal(wf.length,7);
 const ids=["comms","people","submission","normalize","orchestrate","evaluate","capability"];
 assert.deepEqual(wf.map(x=>x.id),ids);
 for(const item of wf){
  for(const key of ["inputs","outputs","owner","customer_journey","internal_workflow","stop_conditions","acceptance","cost_drivers"]) assert.ok(item[key],item.id+" missing "+key);
  assert.ok(item.contracts.length>=1);
 }
});
test("Atlas embedded graph is exactly canonical source; no remote requests",()=>{
 const html=fs.readFileSync(path.join(root,"web/atlas.html"),"utf8");
 const match=html.match(/<script id="graph-data" type="application\/json">([\s\S]*?)<\/script>/);
 assert.ok(match);
 assert.deepEqual(JSON.parse(match[1]),get("catalog/operating-model.json"));
 assert.doesNotMatch(html,/<script[^>]*src=/i);
 assert.doesNotMatch(html,/\bfetch\s*\(|\bXMLHttpRequest\s*\(|\bWebSocket\s*\(/);
 const tmpl=fs.readFileSync(path.join(root,"web/atlas.template.html"),"utf8");
 assert.match(tmpl,/__GRAPH_JSON__/);
});
test("gate catalog 0-4 has owners and nonempty stop conditions",()=>{
 const gates=get("catalog/gates.json").gates;
 assert.deepEqual(gates.map(x=>x.id),["G0","G1","G2","G3","G4"]);
 for(const gate of gates){
  assert.ok(gate.roles.length);
  assert.ok(gate.required.length);
  assert.ok(gate.on_failure);
 }
});
test("capability aggregates require no sensitive small-cell numerical disclosure",()=>{
 const s=get("contracts/CapabilityAggregate.schema.json");
 for(const key of ["sample_size","evidence_count","eligible_population"]){
  assert.ok(!s.required.includes(key));
 }
});
