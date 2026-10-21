import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {buildOrganizationalGraph,graphView,draftScenarios,prepareExecutiveBundle,planActivation,evaluatePilotOutcome,checkDeliveryOperations,authorizeTenantAccess,retentionDryRun,calculateUnitEconomics,auditOperatingAtlas} from "../src/phase3.mjs";
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const read=k=>JSON.parse(fs.readFileSync(path.join(root,"examples/phase3",k+".json"),"utf8"));
const scope={tenant_id:"tenant-demo",engagement_id:"engagement-demo"};
const makeGraph=()=>{const nodes=read("GraphNode"),edges=read("GraphEdge");return buildOrganizationalGraph(nodes,edges,[...new Set(nodes.flatMap(n=>n.source_refs))],root)};
test("13 validates graph, references and role-redacted projection",()=>{
 const g=makeGraph();assert.equal(g.ok,true,JSON.stringify(g.errors));
 const ceo=graphView(g,"ceo");
 assert.ok(ceo.nodes.every(n=>n.visibility_scope!=="restricted"&&n.visibility_scope!=="participant"));
 assert.ok(graphView(g,"people_reviewer").nodes.every(n=>n.visibility_scope!=="restricted"&&n.visibility_scope!=="participant"));
 assert.ok(ceo.edges.every(e=>ceo.nodes.some(n=>n.node_id===e.source_id)&&ceo.nodes.some(n=>n.node_id===e.target_id)));
 const bad=read("GraphEdge");bad[0].target_id="missing";
 assert.equal(buildOrganizationalGraph(read("GraphNode"),bad,["source:submission-001","source:strategy-001","source:baseline-001","source:roster-001"],root).ok,false);
});
test("13 rejects invented evidence and cross-tenant links",()=>{
 const nodes=read("GraphNode"),edges=read("GraphEdge");
 edges[0].evidence_refs=["unknown-evidence"];
 assert.equal(buildOrganizationalGraph(nodes,edges,["source:submission-001"],root).ok,false);
 const copy=read("GraphNode");copy[0].tenant_id="different";
 assert.equal(buildOrganizationalGraph(copy,read("GraphEdge"),["source:submission-001","source:strategy-001","source:baseline-001","source:roster-001"],root).ok,false);
});
test("14 drafts two scenarios but never assigns workers or clears G5",()=>{
 const s=draftScenarios(makeGraph(),read("ScenarioOption"),root);
 assert.equal(s.ok,true,JSON.stringify(s.errors));assert.equal(s.scenarios.length,2);
 assert.equal(s.gate_g5,"pending_external_human_validation");
 assert.equal(s.can_assign_people,false);
 const bad=read("ScenarioOption");bad[0].candidate_team_refs=["team:protected"];
 assert.equal(draftScenarios(makeGraph(),bad,root).ok,false);
});
test("15 builds source-linked executive draft only, blocks sensitive information",()=>{
 const r=prepareExecutiveBundle(scope,read("ExecutiveSection"),root);
 assert.equal(r.ok,true,JSON.stringify(r.errors));
 assert.equal(r.manifest.status,"review_required");assert.equal(r.published,false);
 assert.match(r.documents[0].body,/Limitations:/);
 const unsafe=read("ExecutiveSection");unsafe[0].contains_individual_data=true;
 assert.equal(prepareExecutiveBundle(scope,unsafe,root).ok,false);
 unsafe[0].contains_individual_data=false;unsafe[0].source_refs=[];
 assert.equal(prepareExecutiveBundle(scope,unsafe,root).ok,false);
});
test("16 roadmap checks dependences and doesn't autoactivate",()=>{
 const p=planActivation(read("RoadmapItem"),scope,root);
 assert.equal(p.ok,true,JSON.stringify(p.errors));assert.equal(p.activation_allowed,false);
 const cyclic=read("RoadmapItem");cyclic[0].dependencies=["roadmap:decision"];
 assert.equal(planActivation(cyclic,scope,root).ok,false);
 const outcome=evaluatePilotOutcome(read("PilotOutcome"),read("RoadmapItem"),root);
 assert.equal(outcome.ok,true);assert.equal(outcome.difference,-2);assert.equal(outcome.verified_benefit,false);
});
test("17 staffing and unresolved high incidents stop delivery",()=>{
 const run=read("EngagementOperations");
 assert.equal(checkDeliveryOperations(run,[],root).ok,true);
 run.staffing_hours[0].planned_hours=200;
 assert.equal(checkDeliveryOperations(run,[],root).ok,false);
});
test("18 IAM policy NEVER grants real access and retention is dry-run",()=>{
 const pol=read("TenantPolicy");
 const request={...scope,request_id:"req:demo",actor_role:"sponsor",action:"read:aggregates",resource_tenant_id:scope.tenant_id,resource_engagement_id:scope.engagement_id};
 const r=authorizeTenantAccess(pol,request,root);
 assert.equal(r.allowed,false);
 const other={...request,resource_tenant_id:"other"};
 assert.equal(authorizeTenantAccess(pol,other,root).policy_match,false);
 const retention=retentionDryRun(read("RetentionPlan"),root);
 assert.equal(retention.deletion_performed,false);
 assert.equal(retentionDryRun({...read("RetentionPlan"),legal_hold:true},root).ok,false);
});
test("19 pricing arithmetic and target margin",()=>{
 const r=calculateUnitEconomics(read("PriceModel"),root);
 assert.equal(r.ok,true,JSON.stringify(r.errors));
 assert.equal(r.economics.verified_actuals,false);
 const low={...read("PriceModel"),offered_price_eur:100};
 assert.equal(calculateUnitEconomics(low,root).ok,false);
});
test("20 230-node audit validates design without claiming production",()=>{
 const a=auditOperatingAtlas(readAt("catalog/operating-model.json"),readAt("catalog/gates.json").gates,readAt("catalog/outputs.json").outputs,readAt("catalog/implementation-status.json"),scope,root);
 assert.equal(a.ok,true,JSON.stringify(a.errors));
 assert.equal(a.design_coverage,"complete");
 assert.equal(a.audit.component_count,230);
 assert.equal(a.audit.gate_coverage.length,8);
 assert.equal(a.production_ready,false);
});
function readAt(p){return JSON.parse(fs.readFileSync(path.join(root,p),"utf8"))}
