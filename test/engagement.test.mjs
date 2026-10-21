import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {simulateSyntheticEngagement} from "../src/engagement.mjs";
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const get=p=>JSON.parse(fs.readFileSync(path.join(root,p),"utf8"));
function fixture(){
 const a="examples/phase2/", b="examples/vertical/";
 return {
  synthetic:true,artifactDirectory:path.join(root,a,"artifacts"),
  manifest:get(a+"SubmissionManifest.json"),registrations:get(a+"ParticipantRegistration.json"),
  roster:get(a+"TeamRoster.json"),challenge:get(a+"ChallengeBrief.json"),
  rubric:get(a+"Rubric.json"),claims:get(a+"EvidenceClaim.json"),jury:get(a+"JuryReview.json"),
  priceModel:get(b+"PriceModel.json"),catalog:get("catalog/operating-model.json"),
  gates:get("catalog/gates.json").gates,outputs:get("catalog/outputs.json").outputs,
  implementation:get("catalog/implementation-status.json")
 };
}
test("synthetic 07–20 vertical slice gives evidence, proposed graph, roadmap and economics",()=>{
 const r=simulateSyntheticEngagement(fixture(),root);
 assert.equal(r.ok,true,JSON.stringify(r.errors));
 assert.equal(r.kind,"SYNTHETIC_REHEARSAL");
 assert.equal(r.graph.node_count,3);
 assert.equal(r.assurance.design_components,230);
 assert.equal(r.evidence.provisional_project_score,3.65);
 assert.equal(r.activation.milestones.length,3);
 assert.equal(r.economics.estimated_direct_cost_eur,12897.5);
 assert.equal(r.economics.verified_actuals,false);
});
test("all gates unverified, output remains draft, no real people evaluations",()=>{
 const r=simulateSyntheticEngagement(fixture(),root);
 assert.ok(Object.values(r.gate_states).every(x=>x==="UNVERIFIED"));
 assert.equal(r.production_ready,false);
 assert.equal(r.report_publishable,false);
 assert.equal(r.employment_decisions_permitted,false);
 assert.equal(r.executive_bundle.status,"review_required");
 assert.equal(r.evidence.private_capabilities_not_exported,true);
 assert.equal(r.activation.activated,false);
 const publicOutput=JSON.stringify(r);
 assert.ok(!publicOutput.includes("participant-001"));
 assert.ok(!publicOutput.includes("juror-001"));
 assert.ok(!publicOutput.includes("employment_score"));
});
test("wrong tenant silently poisons nothing and stops pipeline",()=>{
 const data=fixture();data.priceModel.tenant_id="another-company";
 const r=simulateSyntheticEngagement(data,root);
 assert.equal(r.ok,false);assert.equal(r.blocked_stage,"TENANT");
 assert.equal(r.production_ready,false);
});
test("altered archive hash blocks downstream report",()=>{
 const data=fixture();data.manifest.artifact_refs[0].sha256="0".repeat(64);
 const r=simulateSyntheticEngagement(data,root);
 assert.equal(r.ok,false);assert.equal(r.blocked_stage,"08_RECEIPT");
 assert.ok(!Object.hasOwn(r,"executive_bundle"));
});
test("unverified evidence and withdrawn registrants block downstream",()=>{
 const a=fixture();a.claims[0].review_state="unverified";
 assert.equal(simulateSyntheticEngagement(a,root).blocked_stage,"11_EVIDENCE");
 const b=fixture();b.registrations[0].withdrawal_state="withdrawn";
 assert.equal(simulateSyntheticEngagement(b,root).blocked_stage,"REGISTRATION");
});
test("synthetic switch must be explicit and cannot be asserted by any caller as production",()=>{
 const x=fixture();x.synthetic=false;
 const r=simulateSyntheticEngagement(x,root);
 assert.equal(r.ok,false);assert.equal(r.blocked_stage,"POLICY");
});
test("same fixture replays deterministically without generating timestamps or external work",()=>{
 const first=simulateSyntheticEngagement(fixture(),root);
 const second=simulateSyntheticEngagement(fixture(),root);
 assert.deepEqual(first,second);
});
