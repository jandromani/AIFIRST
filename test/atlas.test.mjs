import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {validateCatalog,validateContract} from "../src/core.mjs";
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const get=p=>JSON.parse(fs.readFileSync(path.join(root,p),"utf8"));
test("20 operating domains / 230 atomic components / 171 linked relationships",()=>{
 const g=get("catalog/operating-model.json");
 assert.equal(g.domainCount,20);
 assert.equal(g.componentCount,230);
 assert.equal(g.edges.length,171);
 assert.deepEqual(validateCatalog(g),[]);
 const ids=g.domains.flatMap(d=>d.components.map(c=>c.id));
 assert.equal(new Set(ids).size,ids.length);
});
test("Contract index contains canonical schemas for all 20 domains",()=>{
 const index=get("contracts/index.json").contracts;
 assert.equal(Object.keys(index).length,41);
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
test("gate catalog 0-7 has owners and nonempty stop conditions",()=>{
 const gates=get("catalog/gates.json").gates;
 assert.deepEqual(gates.map(x=>x.id),["G0","G1","G2","G3","G4","G5","G6","G7"]);
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

test("13–20 workflow catalog aligns with exact 95-node original inventory",()=>{
 const graph=get("catalog/operating-model.json");
 const w=get("catalog/phase3-workflows.json").workflows;
 assert.equal(w.length,8);
 assert.equal(w.reduce((n,x)=>n+x.nodes.length,0),95);
 for(const x of w){
  const d=graph.domains.find(d=>d.id===x.id);
  assert.ok(d);
  assert.deepEqual(x.nodes.map(n=>n.id),d.components.map(c=>c.id));
  for(const key of ["external_process","internal_process","state_machine","stop_conditions","cost_drivers","pending"])assert.ok(x[key],key);
 }
});
test("all 20 domains have implementation state (no implicit production)",()=>{
 const st=get("catalog/implementation-status.json");
 assert.equal(st.domains.length,20);
 assert.ok(st.domains.every(d=>d.production_readiness==="NOT_READY"));
});
