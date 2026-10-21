#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {buildOrganizationalGraph,graphView,draftScenarios,prepareExecutiveBundle,planActivation,evaluatePilotOutcome,checkDeliveryOperations,authorizeTenantAccess,retentionDryRun,calculateUnitEconomics,auditOperatingAtlas} from "../src/phase3.mjs";
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const [command,folder="examples/phase3"]=process.argv.slice(2);
const j=f=>JSON.parse(fs.readFileSync(path.join(root,f),"utf8"));
const fixture=f=>j(path.join(folder,f+".json"));
try{
 if(command!=="demo")throw Error("Usage: node bin/phase3.mjs demo [fixture-folder]");
 const nodes=fixture("GraphNode"),edges=fixture("GraphEdge");
 const graph=buildOrganizationalGraph(nodes,edges,[...new Set(nodes.flatMap(n=>n.source_refs))],root);
 const sampleScope={tenant_id:"tenant-demo",engagement_id:"engagement-demo"};
 const sc=draftScenarios(graph,fixture("ScenarioOption"),root);
 const bundle=prepareExecutiveBundle(sampleScope,fixture("ExecutiveSection"),root);
 const roadmap=fixture("RoadmapItem");
 const activation=planActivation(roadmap,sampleScope,root);
 const pilot=evaluatePilotOutcome(fixture("PilotOutcome"),roadmap,root);
 const ops=checkDeliveryOperations(fixture("EngagementOperations"),[],root);
 const access=authorizeTenantAccess(fixture("TenantPolicy"),{request_id:"req:demo",actor_role:"sponsor",action:"read:aggregates",resource_tenant_id:"tenant-demo",resource_engagement_id:"engagement-demo",...sampleScope},root);
 const retention=retentionDryRun(fixture("RetentionPlan"),root);
 const economics=calculateUnitEconomics(fixture("PriceModel"),root);
 const cat=j("catalog/operating-model.json"),gates=j("catalog/gates.json").gates,outputs=j("catalog/outputs.json").outputs,states=j("catalog/implementation-status.json");
 const audit=auditOperatingAtlas(cat,gates,outputs,states,sampleScope,root);
 const status={graph:graph.ok,scenarios:sc.ok,bundle:bundle.ok,roadmap:activation.ok,pilot:pilot.ok,operations:ops.ok,economics:economics.ok,assurance:audit.ok};
 console.log(JSON.stringify({status,coverage:{domains:audit.audit.domain_count,components:audit.audit.component_count,relations:cat.edges.length,contracts:Object.keys(j("contracts/index.json").contracts).length,outputs:outputs.length},
 project_scores:"never computed here",scenarios:sc.scenarios.map(s=>({id:s.scenario_id,status:s.status,assumptions:s.assumptions})),deliverable_manifest:bundle.manifest,
 roadmap:activation.roadmap.map(x=>({item_id:x.item_id,milestone:x.milestone,status:x.status})),pilot:{difference:pilot.difference,verified_benefit:pilot.verified_benefit},pricing:economics.economics,
 security:{access_allowed:access.allowed,retention_deletion_performed:retention.deletion_performed},gates:["G5","G6","G7"].map(g=>({gate:g,verified:false})),
 production_ready:audit.production_ready,limitations:audit.audit.limitations},null,2));
 if(Object.values(status).some(x=>!x))process.exitCode=1;
}catch(e){console.error(JSON.stringify({error:e.message}));process.exitCode=1;}
