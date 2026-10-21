// Phase 3 · Organizational intelligence and business operating controls.
// Offline, deterministic, tenant-scoped, fail-closed. No LLM or remote infrastructure.
import {createHash} from "node:crypto";
import {validateContract} from "./core.mjs";

const VERSION="1.0.0";
const scopeOf=x=>x?.tenant_id+"|"+x?.engagement_id;
const digest=x=>createHash("sha256").update(typeof x==="string"?x:JSON.stringify(x)).digest("hex");
function check(kind,value,root,errors){errors.push(...validateContract(kind,value,root).map(x=>kind+" "+x))}
function scoped(items,errors){const values=new Set(items.filter(Boolean).map(scopeOf));if(values.size>1)errors.push("Cross-tenant/engagement data forbidden");return values.size===1}
const unique=values=>new Set(values).size===values.length;
const ok=(errors,extra={})=>({ok:errors.length===0,errors,...extra});
const sensitive=x=>x.visibility_scope==="restricted"||x.visibility_scope==="participant";
const evidenceSet=arr=>new Set(arr.filter(Boolean).map(x=>x.claim_id||x.node_id||x));

// 13 · Knowledge Graph: no invented edges and no cross-tenant references.
export function buildOrganizationalGraph(nodes,edges,evidenceRefs,root){
 const errors=[],byId=new Map(),edgeIds=new Set(),sourceSet=new Set(evidenceRefs);
 scoped([...nodes,...edges],errors);
 for(const n of nodes){
  check("GraphNode",n,root,errors);
  if(byId.has(n.node_id))errors.push("Duplicate graph node "+n.node_id);
  byId.set(n.node_id,n);
  if(n.state==="observed"&&!n.source_refs?.length)errors.push("Observed node missing source: "+n.node_id);
 }
 for(const e of edges){
  check("GraphEdge",e,root,errors);
  if(edgeIds.has(e.edge_id))errors.push("Duplicate graph edge "+e.edge_id);
  edgeIds.add(e.edge_id);
  const from=byId.get(e.source_id),to=byId.get(e.target_id);
  if(!from||!to)errors.push("Dangling edge "+e.edge_id);
  else if(scopeOf(e)!==scopeOf(from)||scopeOf(e)!==scopeOf(to))errors.push("Cross-scope edge "+e.edge_id);
  if(e.state==="observed"&&!e.evidence_refs?.length)errors.push("Observed relationship without evidence "+e.edge_id);
  if(e.evidence_refs?.some(id=>!sourceSet.has(id)))errors.push("Evidence reference not resolved "+e.edge_id);
  if((from&&sensitive(from))||(to&&sensitive(to))) {
   if(e.visibility_scope==="aggregate"||e.visibility_scope==="client")errors.push("Edge leaks protected identity "+e.edge_id);
  }
 }
 if(nodes.length===0)errors.push("Graph without nodes");
 const first=nodes[0]||{};
 const metadata={schema_version:VERSION,tenant_id:first.tenant_id,engagement_id:first.engagement_id,
 graph_id:"graph:"+first.engagement_id,version:VERSION,node_refs:nodes.map(n=>n.node_id),edge_refs:edges.map(e=>e.edge_id),
 source_refs:[...sourceSet],coverage:{node_count:nodes.length,edge_count:edges.length,unresolved_count:errors.length},
 limitations:["Graph reflects supplied evidence, not a complete census of employees or organizational truth"],
 generated_at:"2026-10-21T15:00:00Z"};
 if(!errors.length)check("OrganizationGraph",metadata,root,errors);
 return ok(errors,{graph:errors.length?null:metadata,nodes:errors.length?[]:nodes,edges:errors.length?[]:edges});
}
export function graphView(graph,role="ceo"){
 if(!graph?.ok)throw Error("Graph invalid or not verified");
 // An offline, unauthenticated preview must never expose restricted or participant records.
 // Even a caller-supplied "people_reviewer" string is not proof of IAM authorization.
 const allowed=new Set(["aggregate","client"]);
 const nodes=graph.nodes.filter(n=>allowed.has(n.visibility_scope));
 const ids=new Set(nodes.map(n=>n.node_id));
 const edges=graph.edges.filter(e=>allowed.has(e.visibility_scope)&&ids.has(e.source_id)&&ids.has(e.target_id));
 return {role,nodes,edges,limitations:["Redacted graph projection; never a basis for automated labor decisions."]};
}

// 14 · Organizational scenarios: decisions belong to people, not this engine.
export function draftScenarios(graph,options,root){
 const errors=[];if(!graph?.ok)errors.push("Invalid knowledge graph");
 const known=new Set(graph?.nodes?.map(n=>n.node_id)||[]),scope=graph?.graph||{};
 const drafts=[];
 for(const x of options){
  const scenario={schema_version:VERSION,tenant_id:scope.tenant_id,engagement_id:scope.engagement_id,
   scenario_id:x.scenario_id,objective:x.objective,assumptions:x.assumptions||[],
   candidate_team_refs:x.candidate_team_refs||[],required_skills:x.required_skills||[],
   initiative_refs:x.initiative_refs||[],cost_range_eur:x.cost_range_eur||[],
   tradeoffs:x.tradeoffs||[],risks:x.risks||[],evidence_refs:x.evidence_refs||[],
   coverage_limitations:x.coverage_limitations||[],status:"pending_review"};
  check("OrganizationScenario",scenario,root,errors);
  if(scenario.cost_range_eur.length!==2||scenario.cost_range_eur[0]>scenario.cost_range_eur[1])errors.push("Invalid scenario cost range: "+x.scenario_id);
  if(scenario.evidence_refs.some(y=>!known.has(y)))errors.push("Scenario evidence node not found: "+x.scenario_id);
  if(scenario.candidate_team_refs.length)errors.push("Individual/team assignment requires separate voluntary opt-in and human approval; exclude from automated draft");
  if(scenario.coverage_limitations.length===0)errors.push("Missing sample limitations");
  drafts.push(scenario);
 }
 if(!unique(drafts.map(x=>x.scenario_id)))errors.push("Duplicate scenario ID");
 return ok(errors,{scenarios:errors.length?[]:drafts,gate_g5:"pending_external_human_validation",can_assign_people:false});
}

// 15 · Executive artifacts: deterministic Markdown and manifest, restricted audiences.
export function prepareExecutiveBundle(engagement,sections,root){
 const errors=[],artifacts=[];
 if(!engagement?.tenant_id||!engagement.engagement_id)errors.push("Missing tenant/engagement");
 for(const section of sections){
  if(!section.title||!section.body||!section.source_refs?.length)errors.push("Executive claim without evidence");
  if(!section.limitations?.length)errors.push("Missing explicit limitations");
  if(["ceo","board"].includes(section.audience)&&section.contains_individual_data)errors.push("Personal information forbidden for executives");
  if(section.audience==="participant")errors.push("Participant-private report cannot be bundled with executive report");
  const format="md";
  const body="# "+String(section.title||"").replace(/[\r\n]/g," ")+"\n\n"+String(section.body||"")+
   "\n\nSources: "+(section.source_refs||[]).join(", ")+"\nLimitations: "+(section.limitations||[]).join("; ")+"\n";
  artifacts.push({id:section.id,name:section.title,format,audience:section.audience,
   source_refs:section.source_refs||[],limitations:section.limitations||[],content_sha256:digest(body),body});
 }
 const metadata={schema_version:VERSION,tenant_id:engagement.tenant_id,engagement_id:engagement.engagement_id,
 bundle_id:"bundle:"+engagement.engagement_id,version:VERSION,artifacts:artifacts.map(({body,...x})=>x),
 provenance_refs:[...new Set(sections.flatMap(s=>s.source_refs||[]))],
 limitations:["Draft only: citations and reviewers must validate source authenticity and access controls"],
 approval_signatures:[],status:"review_required",generated_at:"2026-10-21T15:00:00Z"};
 check("DeliverableManifest",metadata,root,errors);
 if(!unique(artifacts.map(a=>a.id)))errors.push("Duplicate deliverable ID");
 return ok(errors,{manifest:errors.length?null:metadata,documents:errors.length?[]:artifacts,
 gate_g6:"pending_external_acceptance",published:false});
}

// 16 · Activation: enforce measurable roadmap and baseline; never invent outcomes.
export function planActivation(items,scope,root){
 const errors=[],ids=new Set();
 for(const item of items){
  check("RoadmapItem",item,root,errors);
  if(scopeOf(item)!==scopeOf(scope))errors.push("Roadmap scope mismatch");
  if(ids.has(item.item_id))errors.push("Duplicate roadmap item");
  ids.add(item.item_id);
  if(item.status!=="candidate")errors.push("Cannot auto-approve/activate a roadmap initiative");
 }
 for(const item of items)if(item.dependencies?.some(dep=>!ids.has(dep)))errors.push("Missing dependency for "+item.item_id);
 const dependencyMap=new Map(items.map(x=>[x.item_id,x.dependencies||[]])),seen=new Set(),active=new Set();
 function visit(id){
  if(active.has(id)){errors.push("Cycle in roadmap dependencies");return}
  if(seen.has(id))return;active.add(id);
  for(const d of dependencyMap.get(id)||[])visit(d);
  active.delete(id);seen.add(id);
 }
 for(const id of ids)visit(id);
 return ok(errors,{roadmap:errors.length?[]:items,activation_allowed:false,gate_g7:"pending_customer_handoff"});
}
export function evaluatePilotOutcome(outcome,roadmapItems,root){
 const errors=[];check("PilotOutcome",outcome,root,errors);
 const item=roadmapItems.find(x=>x.item_id===outcome.roadmap_item_id);
 if(!item||scopeOf(item)!==scopeOf(outcome))errors.push("Pilot has no matching roadmap item");
 if(!outcome.baseline_ref||!outcome.source_refs?.length)errors.push("Missing measurement provenance");
 if(outcome.status==="measured"&&(!Number.isFinite(outcome.measured_value)||!Number.isFinite(outcome.baseline_value)))errors.push("Measured pilot lacks actual and baseline values");
 const delta=Number.isFinite(outcome.measured_value)&&Number.isFinite(outcome.baseline_value)?outcome.measured_value-outcome.baseline_value:null;
 return ok(errors,{difference:errors.length?null:delta,decision:"human_review_required",verified_benefit:false});
}

// 17 · Delivery operations: staffing and incident blockers.
export function checkDeliveryOperations(run,incidents,root){
 const errors=[];check("EngagementOperations",run,root,errors);
 for(const row of run.staffing_hours||[])if(row.planned_hours>row.available_hours)errors.push("Overstaffed role: "+row.role);
 for(const incident of incidents){
  check("IncidentRecord",incident,root,errors);
  if(scopeOf(incident)!==scopeOf(run))errors.push("Cross-engagement incident");
  if(["high","critical"].includes(incident.severity)&&incident.state!=="resolved")errors.push("Blocking incident: "+incident.incident_id);
 }
 if(run.billing_status==="paid")errors.push("Offline checklist cannot attest actual payments");
 return ok(errors,{operational_state:errors.length?"blocked":"review_required",real_supplier_checks:false,juror_independence_verified:false});
}

// 18 · Tenant policy: fail-closed authorization and dry-run retention.
export function authorizeTenantAccess(policy,request,root){
 const errors=[];check("TenantPolicy",policy,root,errors);
 if(scopeOf(policy)!==scopeOf(request)||request.resource_tenant_id!==policy.tenant_id||
    request.resource_engagement_id!==policy.engagement_id)errors.push("Cross-tenant/engagement request");
 if(policy.denied_actions?.includes(request.action))errors.push("Explicit policy deny");
 const role=policy.roles?.find(x=>x.role===request.actor_role);
 if(!role?.permissions.includes(request.action))errors.push("Role lacks permission");
 if(policy.attestation!=="external_verified")errors.push("Policy/IAM is not verified externally");
 const decision={schema_version:VERSION,tenant_id:policy.tenant_id,engagement_id:policy.engagement_id,
 request_id:request.request_id,actor_role:request.actor_role,action:request.action,
 resource_tenant_id:request.resource_tenant_id,resource_engagement_id:request.resource_engagement_id,
 allowed:errors.length===0,reasons:errors.length?errors:["Access would still require real identity authentication"],
 evaluated_at:"2026-10-21T15:00:00Z"};
 check("AccessDecision",decision,root,errors);
 return {allowed:false,policy_match:errors.filter(x=>!/verified externally/.test(x)).length===0,errors,
 decision:{...decision,allowed:false,reasons:[...decision.reasons,"Offline reference never grants real access"]}};
}
export function retentionDryRun(plan,root){
 const errors=[];check("RetentionPlan",plan,root,errors);
 if(plan.legal_hold)errors.push("Legal hold: deletion blocked");
 if(plan.export_status!=="completed")errors.push("Export not confirmed");
 if(plan.deletion_status==="verified")errors.push("Offline engine cannot attest deletion");
 return ok(errors,{deletion_performed:false,action:"external_approval_required",note:"Only a dry run; no data is deleted."});
}

// 19 · Pricing and unit economics, transparent scope and unit drivers.
export function calculateUnitEconomics(model,root){
 const errors=[];check("PriceModel",model,root,errors);
 const subtotal=(model.service_hours||0)*(model.service_hourly_eur||0)+
  (model.jury_cost_eur||0)+(model.prizes_cost_eur||0)+(model.compute_budget_eur||0)+
  (model.security_cost_eur||0)+(model.other_direct_cost_eur||0);
 const direct=subtotal*(1+(model.contingency_rate||0));
 const margin=model.offered_price_eur>0?(model.offered_price_eur-direct)/model.offered_price_eur:null;
 const min=direct/(1-model.target_gross_margin);
 if(!Number.isFinite(min)||!Number.isFinite(direct))errors.push("Invalid economics");
 if(model.offered_price_eur+0.01<min)errors.push("Offered price is below target gross margin");
 const doc={schema_version:VERSION,tenant_id:model.tenant_id,engagement_id:model.engagement_id,
 analysis_id:"economics:"+model.model_id,price_model_id:model.model_id,
 direct_cost_eur:+direct.toFixed(2),price_eur:model.offered_price_eur,
 contribution_eur:+(model.offered_price_eur-direct).toFixed(2),
 gross_margin_ratio:margin,min_price_ignored:undefined,
 break_even_price_eur:+min.toFixed(2),
 scope_limitations:["Illustrative direct delivery costs; excludes fixed overhead, taxes and customer employee time.","Actual supplier, token and human costs are not independently audited."],
 verified_actuals:false};
 delete doc.min_price_ignored;
 check("UnitEconomics",doc,root,errors);
 return ok(errors,{economics:doc,offer_approved:false,customer_roi_unverified:true});
}

// 20 · Master assurance: structure, truthful readiness, controls and evidence coverage.
export function auditOperatingAtlas(catalog,gates,outputs,implementation,scope,root){
 const errors=[],findings=[];
 const domains=catalog.domains||[],nodes=domains.flatMap(d=>d.components||[]);
 const ids=new Set(nodes.map(n=>n.id));
 if(domains.length!==20)errors.push("Expected 20 operating domains");
 if(nodes.length!==230||catalog.componentCount!==230)errors.push("Inventory differs from 230-node baseline");
 if(ids.size!==nodes.length)errors.push("Duplicate component IDs");
 for(const n of nodes){
  for(const field of ["id","title","owner","inputs","outputs","acceptance"])if(!n[field])errors.push(n.id+" missing "+field);
 }
 for(const edge of catalog.edges||[])if(!ids.has(edge.from)||!ids.has(edge.to))errors.push("Dangling graph relation");
 if(new Set(gates.map(g=>g.id)).size!==8||gates.length!==8)errors.push("Must define eight gates G0–G7");
 for(let n=0;n<8;n++)if(!gates.some(g=>g.id==="G"+n))errors.push("Missing gate G"+n);
 if(outputs.length!==11)errors.push("Expected eleven customer deliverables");
 const status=implementation.domains||[];
 for(const domain of domains)if(!status.some(x=>x.domain===domain.id))findings.push({finding_id:"missing-status-"+domain.id,severity:"medium",description:"Domain missing implementation status"});
 for(const n of nodes)if(n.status!=="VERIFIED_PRODUCTION")findings.push({finding_id:"not-production-"+n.id,severity:"info",description:"Design or unverified component: "+n.id});
 const report={schema_version:VERSION,tenant_id:scope.tenant_id,engagement_id:scope.engagement_id,
 audit_id:"audit:"+scope.engagement_id,inventory_version:catalog.schemaVersion||VERSION,
 domain_count:domains.length,component_count:nodes.length,gate_coverage:gates.map(g=>g.id),
 artifact_coverage:outputs.map(o=>o.id),findings,
 readiness:"design",
 limitations:["Inventory closure does not imply deployed services or regulatory compliance.","Human gates and security cannot be attested from repository code.","LLM safety, business impact and end-to-end tenant segregation remain unverified."],
 generated_at:"2026-10-21T15:00:00Z"};
 check("AuditBundle",report,root,errors);
 return ok(errors,{audit:report,design_coverage:domains.length===20&&nodes.length===230?"complete":"incomplete",
 production_verified:false,production_ready:false,unverified_components:findings.filter(x=>x.finding_id.startsWith("not-production")).length});
}
