import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {CONTRACTS,validateContract,validateCatalog,readJson,loadBundle,evaluateGates,calculateQuote} from "../src/core.mjs";
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const fx=path.join(root,"examples/synthetic");
const doc=k=>readJson(path.join(fx,k+".json"));
test("catalog 135 nodes and 68 resolved edges",()=>{
 const g=readJson(path.join(root,"catalog/operating-model.json"));
 assert.equal(g.domainCount,12);assert.equal(g.componentCount,135);assert.equal(g.edges.length,68);
 assert.deepEqual(validateCatalog(g),[]);
});
test("synthetic contracts validate",()=>{
 for (const k of ["ClientBrief","SalesQualification","PricingQuote","EngagementConfig","CompanyContext","RiskRegister","ChallengeBrief","Rubric"])assert.deepEqual(validateContract(k,doc(k),root),[],k);
 for (const gate of ["G0","G1","G2"])assert.deepEqual(validateContract("GateApproval",doc(gate+".approval"),root),[],gate);
});
test("gates G0 G1 G2 pass on synthetic approvals (not legally verified)",()=>{
 const r=evaluateGates(loadBundle(fx),root);
 assert.deepEqual(r.map(x=>x.passed),[true,true,true]);
});
test("gate G0 blocks nonqualified lead, cascading to G1 G2",()=>{
 const b=loadBundle(fx);
 b.objects.SalesQualification.discovery_status="not_qualified";
 assert.deepEqual(evaluateGates(b,root).map(x=>x.passed),[false,false,false]);
});
test("gate G1 blocks absent DPA or high unresolved risk",()=>{
 const b=loadBundle(fx);
 b.objects.EngagementConfig.dpa_status="pending";
 assert.deepEqual(evaluateGates(b,root).map(x=>x.passed),[true,false,false]);
 const r=loadBundle(fx);
 r.objects.RiskRegister.risks.push({...r.objects.RiskRegister.risks[0],risk_id:"risk-002",severity:"critical",status:"open"});
 assert.deepEqual(evaluateGates(r,root).map(x=>x.passed),[true,false,false]);
});
test("gate G2 blocks changed rubric, unknown baseline and missing human approval",()=>{
 const b=loadBundle(fx);b.objects.Rubric.criteria[0].weight=0.2;
 assert.equal(evaluateGates(b,root)[2].passed,false);
 const c=loadBundle(fx);c.objects.ChallengeBrief.baseline_ref="missing-source";
 assert.equal(evaluateGates(c,root)[2].passed,false);
 const d=loadBundle(fx);delete d.approvals.G2;
 assert.equal(evaluateGates(d,root)[2].passed,false);
});
test("unknown properties rejected and types validated",()=>{
 const b={...doc("ClientBrief"),participant_emails:["never-add-personal"]};
 assert.ok(validateContract("ClientBrief",b,root).some(e=>e.includes("unknown")));
 const bad={...doc("ClientBrief"),buyer_role:3};
 assert.ok(validateContract("ClientBrief",bad,root).length>0);
});
test("pricing deterministic and margin threshold enforced",()=>{
 const q=doc("PricingQuote");const result=calculateQuote(q);
 assert.equal(result.direct_cost_eur,9920);
 assert.equal(result.minimum_price_eur,16533.34);
 assert.deepEqual(validateContract("PricingQuote",{...q,commercial_price_eur:10000},root).some(x=>x.includes("target margin")),true);
});
