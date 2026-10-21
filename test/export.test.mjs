import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {createHash} from "node:crypto";
import {renderExecutive,renderExecutiveHTML,renderRoadmapCSV,renderTrace,prepareExport,writeSyntheticArtifacts} from "../src/export.mjs";
const demo=()=>({
 ok:true,kind:"SYNTHETIC_REHEARSAL",run_id:"run:"+"a".repeat(20),production_ready:false,report_publishable:false,
 gate_states:Object.fromEntries(Array.from({length:8},(_,i)=>["G"+i,"UNVERIFIED"])),
 evidence:{artifact_count:2,provisional_project_score:3.65},
 graph:{node_count:3,edge_count:2},
 scenarios:[{scenario_id:"scenario:pilot",objective:"Piloto ficticio",cost_range_eur:[0,25000]}],
 activation:{milestones:[{item_id:"roadmap:d30",milestone:"D30",status:"candidate",dependencies:[]},
 {item_id:"roadmap:d60",milestone:"D60",status:"candidate",dependencies:["roadmap:d30"]}]},
 economics:{hypothetical_price_eur:25000,estimated_direct_cost_eur:12897.5,margin_ratio:0.4841},
 assurance:{design_components:230,unverified_components:230}
});
test("executive report labels ALL gates as unverified and no person appears",()=>{
 const report=renderExecutive(demo());
 assert.match(report,/SIMULATION ONLY/);
 assert.match(report,/G7: UNVERIFIED/);
 assert.match(report,/NO MEDIDO/);
 assert.doesNotMatch(report,/participant-001|juror-001/);
});
test("roadmap CSV safe for Excel formula injection and transparent about G7",()=>{
 const example=demo();example.activation.milestones[0].item_id="=HYPERLINK(1)";
 const csv=renderRoadmapCSV(example);
 assert.match(csv,/'=HYPERLINK\(1\)/);
 assert.match(csv,/G7:UNVERIFIED/);
});
test("trace is a redacted, explicit non-release audit entry",()=>{
 const payload=JSON.parse(renderTrace(demo()));
 assert.equal(payload.release_allowed,false);
 assert.equal(payload.private_capabilities_exported,false);
 assert.equal(payload.journal,undefined);
});
test("optional artifact exporter is deterministic and detects any tampering",t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),"aifirst-test-"));
 t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
 const run=demo(),first=writeSyntheticArtifacts(dir,run),second=writeSyntheticArtifacts(dir,run);
 assert.deepEqual(first,second);
 assert.equal(first.files.length,4);
 const directory=path.join(dir,first.relative_path);
 const manifest=JSON.parse(fs.readFileSync(path.join(directory,"Artifact_Manifest.json"),"utf8"));
 for(const item of manifest.files){
   const data=fs.readFileSync(path.join(directory,item.name),"utf8");
   assert.equal(item.sha256,createHash("sha256").update(data).digest("hex"));
 }
 fs.appendFileSync(path.join(directory,"Executive_Draft.md"),"CHANGED");
 assert.throws(()=>writeSyntheticArtifacts(dir,run),/overwrite/);
});
test("export denies any fake authorized or non-synthetic result",()=>{
 const altered=demo();altered.gate_states.G3="approved";
 const root=fs.mkdtempSync(path.join(os.tmpdir(),"aifirst-test-"));
 try{
  assert.throws(()=>writeSyntheticArtifacts(root,altered),/Refusing/);
  assert.throws(()=>renderExecutive({...demo(),kind:"PRODUCTION"}),/synthetic/);
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});

test("HTML CEO preview is self-contained and escapes untrusted descriptions",()=>{
 const input=demo();input.scenarios[0].objective="<script>alert(1)</script>";
 const html=renderExecutiveHTML(input);
 assert.match(html,/<!doctype html>/i);
 assert.match(html,/G7/);
 assert.match(html,/SIMULACIÓN EXCLUSIVAMENTE/);
 assert.match(html,/&lt;script&gt;/);
 assert.doesNotMatch(html,/<script\b/i);
 assert.doesNotMatch(html,/<link[^>]+href=|@import\s+url|fetch\s*\(/i);
 assert.doesNotMatch(html,/participant-001|juror-001/);
});
test("HTML report refuses a fake verified gate",()=>{
 const x=demo();x.gate_states.G6="approved";
 assert.throws(()=>renderExecutiveHTML(x),/Refusing/);
});
