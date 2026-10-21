// AIFIRST vertical slice: ONE synthetic engagement, from intake to board handoff.
// No participant execution, remote services, tenant writes, auth, signatures or employment decisions.
import {createHash} from "node:crypto";
import {inspectLocalSubmission,validateRoster,evaluateSolution,deriveCapability,reviewJury} from "./phase2.mjs";
import {buildOrganizationalGraph,graphView,draftScenarios,prepareExecutiveBundle,planActivation,calculateUnitEconomics,auditOperatingAtlas} from "./phase3.mjs";
import {validateContract} from "./core.mjs";

const digest=v=>createHash("sha256").update(String(v)).digest("hex");
const scope=x=>[x?.tenant_id,x?.engagement_id].join("|");
const requiredFiles=["manifest","registrations","roster","rubric","claims","challenge","jury","priceModel","catalog","gates","outputs","implementation","artifactDirectory"];
const syntheticWarning="SYNTHETIC ONLY. External G3–G7 authorization is unavailable. No real jury, execution, business ROI, person ranking, employment decision or publication.";
function blocked(stage,reason,run_id){
 return {ok:false,kind:"REJECTED_INTAKE",run_id,blocked_stage:stage,errors:[reason],
  production_ready:false,gate_states:Object.fromEntries(Array.from({length:8},(_,i)=>["G"+i,"UNVERIFIED"])),
  limitations:[syntheticWarning]};
}
/** Validate and build a complete *non-authoritative* demo. No side effects except reading fixture files for hashes. */
export function simulateSyntheticEngagement(input,root){
 const missing=requiredFiles.filter(key=>!input||!Object.hasOwn(input,key));
 if(missing.length)return blocked("INPUT","MISSING_REQUIRED_INPUTS","run:missing");
 if(input.synthetic!==true)return blocked("POLICY","SYNTHETIC_MODE_REQUIRED","run:denied");
 const {manifest,registrations,roster,rubric,claims,challenge,jury,priceModel,catalog,gates,outputs,implementation,artifactDirectory}=input;
 const run_id="run:"+digest(manifest?.sha256||"invalid").slice(0,20);
 const baseScope=scope(manifest);
 if([roster,...registrations,...claims,...jury,priceModel].some(x=>scope(x)!==baseScope))return blocked("TENANT","CROSS_SCOPE_INPUTS",run_id);
 if(!Array.isArray(manifest?.artifact_refs)||!Array.isArray(registrations)||!Array.isArray(claims)||!Array.isArray(jury))return blocked("INPUT","INVALID_COLLECTION",run_id);
 if(validateContract("PriceModel",priceModel,root).length)return blocked("ECONOMICS","INVALID_PRICE_MODEL",run_id);
 const inputJournal=[];
 const emit=(step,status,evidenceCount)=>inputJournal.push({sequence:inputJournal.length+1,step,status,evidence_count:evidenceCount,
  trace_id:"trace:"+digest(run_id+"|"+step).slice(0,24)});
 const rosterCheck=validateRoster(registrations,roster,manifest.challenge_id,root);
 if(!rosterCheck.ok)return blocked("REGISTRATION","INELIGIBLE_OR_INCONSISTENT_ROSTER",run_id);
 emit("07_ROSTER","VALIDATED_SYNTHETIC",registrations.length);
 const receipt=inspectLocalSubmission(artifactDirectory,manifest,root);
 if(!receipt.ok)return blocked("08_RECEIPT","INVALID_ARTIFACT_OR_MANIFEST",run_id);
 if(receipt.quarantine!==true)return blocked("09_SECURITY","EXPECTED_QUARANTINE",run_id);
 emit("08_09_QUARANTINE","BLOCKED_PENDING_G3",receipt.verified_artifacts.length);
 const evaluation=evaluateSolution(manifest,rubric,claims,challenge,root);
 if(!evaluation.ok||evaluation.result.review_state!=="pending_jury")return blocked("11_EVIDENCE","UNSUPPORTED_EVALUATION",run_id);
 const juror=reviewJury(evaluation.result,jury,root);
 if(!juror.checks_pass||juror.gate_g4!=="pending_external_signoff")return blocked("11_JURY","INVALID_OR_UNREVIEWED_JURY_PACKET",run_id);
 emit("11_PROVISIONAL_EVALUATION","DRAFT_NOT_RANKABLE",evaluation.result.criterion_scores.length);
 // We intentionally do not export or persist the individually scoped capability, even if synthetic.
 const capability=deriveCapability(registrations[0],manifest,claims,"skill:documentation",root);
 if(!capability.ok||capability.capability.human_review_state!=="pending")return blocked("12_CAPABILITY","UNREVIEWED_CAPABILITY",run_id);
 emit("12_CAPABILITY","PRIVATE_REVIEW_PENDING",capability.capability.evidence_claim_ids.length);
 const prefix={schema_version:"1.0.0",tenant_id:manifest.tenant_id,engagement_id:manifest.engagement_id};
 const solution="solution:"+manifest.submission_id,challengeId="challenge:"+challenge.challenge_id;
 const artifactNode="artifact:"+manifest.artifact_refs[0].artifact_id;
 const refs=[manifest.submission_id,challenge.challenge_id,...claims.map(x=>x.claim_id)];
 const graphNodes=[
  {...prefix,node_id:solution,type:"solution",label:manifest.title,source_refs:[manifest.submission_id],visibility_scope:"client",state:"proposed"},
  {...prefix,node_id:challengeId,type:"challenge",label:challenge.title,source_refs:[challenge.challenge_id],visibility_scope:"client",state:"proposed"},
  {...prefix,node_id:artifactNode,type:"artifact",label:"Submission artifact (quarantined)",source_refs:[manifest.submission_id],visibility_scope:"client",state:"proposed"}
 ];
 const graphEdges=[
  {...prefix,edge_id:"edge:proposes",source_id:solution,target_id:challengeId,relation:"ADDRESSES_PROBLEM",evidence_refs:[manifest.submission_id],visibility_scope:"client",state:"proposed"},
  {...prefix,edge_id:"edge:contains",source_id:solution,target_id:artifactNode,relation:"CONTAINS_ARTIFACT",evidence_refs:[manifest.submission_id],visibility_scope:"client",state:"proposed"}
 ];
 const graph=buildOrganizationalGraph(graphNodes,graphEdges,refs,root);
 if(!graph.ok)return blocked("13_GRAPH","GRAPH_REFERENCES_NOT_VERIFIABLE",run_id);
 const executiveGraph=graphView(graph,"ceo");
 emit("13_EVIDENCE_GRAPH","PROPOSED_UNVERIFIED",executiveGraph.nodes.length);
 const scenarioSpec=[{
  scenario_id:"scenario:pilot",objective:"Consider a controlled pilot for: "+challenge.title,
  assumptions:["Proposed hypothesis only; not verified in production","Sponsor and legal approvals required"],
  initiative_refs:[solution],candidate_team_refs:[],required_skills:[],cost_range_eur:[0,priceModel.offered_price_eur],
  tradeoffs:["Availability and security approval may delay implementation"],
  risks:["G3/G4 signatures not verified","No measured customer outcomes"],evidence_refs:[solution],
  coverage_limitations:["Voluntary participants are not representative","No assignment of individuals or inference about all staff"]
 }];
 const scenarios=draftScenarios(graph,scenarioSpec,root);
 if(!scenarios.ok)return blocked("14_SCENARIOS","INVALID_SCENARIO_DRAFT",run_id);
 emit("14_SCENARIOS","G5_REVIEW_REQUIRED",scenarios.scenarios.length);
 const claimsList=claims.filter(c=>c.subject_id===manifest.submission_id);
 const report=prepareExecutiveBundle(prefix,[{
  id:"report:executive",title:"AI First Discovery — synthetic evidence preview",
  body:"Challenge: "+challenge.title+". A submitted project exists in the synthetic example, but its artifacts remain quarantined and the project has no externally verified G3/G4 signoff. No claims about employee performance, measured savings or organizational readiness can be made.",
  source_refs:[manifest.submission_id,...claimsList.map(c=>c.claim_id)],
  limitations:["G3/G4 unverified","No representative employee sample","No measured ROI","Simulation only"],
  audience:"ceo",contains_individual_data:false
 },{
  id:"report:roadmap",title:"Candidate activation plan",
  body:"A controlled pilot may be considered only after sponsor approval, legal review, security scans and a reproducible business baseline.",
  source_refs:[manifest.submission_id,challenge.challenge_id],
  limitations:["Proposal only","No staffing decision","No approved handoff"],
  audience:"operations",contains_individual_data:false
 }],root);
 if(!report.ok)return blocked("15_REPORT","UNSUPPORTED_EXECUTIVE_CLAIMS",run_id);
 emit("15_EXECUTIVE_REPORT","G6_REVIEW_REQUIRED",report.manifest.artifacts.length);
 const stageIds=["roadmap:baseline","roadmap:pilot","roadmap:decision"];
 const stageNames=["Establish verified baseline","Pilot with sponsor and security","Review results and decide"];
 const roadmap=stageIds.map((item_id,i)=>({...prefix,item_id,initiative_id:"initiative:synthetic",title:stageNames[i],
   owner_role:i===1?"Client IT sponsor":"Client business sponsor",
   dependencies:i?[stageIds[i-1]]:[],milestone:["D30","D60","D90"][i],
   acceptance_criteria:[i===0?"Baseline measurement and evidence":"Human signoff with reproducible results"],
   baseline_ref:challenge.baseline_ref,kpi_id:"kpi:baseline",planned_cost_eur:0,
   status:"candidate",evidence_refs:[challenge.challenge_id]}));
 const activation=planActivation(roadmap,prefix,root);
 if(!activation.ok||activation.activation_allowed!==false)return blocked("16_ROADMAP","ROADMAP_NOT_SAFE",run_id);
 emit("16_ACTIVATION","G7_HANDOFF_REQUIRED",roadmap.length);
 const economics=calculateUnitEconomics(priceModel,root);
 if(!economics.ok)return blocked("19_ECONOMICS","PRICE_OUTSIDE_POLICY",run_id);
 emit("19_ECONOMICS","HYPOTHETICAL",1);
 const audit=auditOperatingAtlas(catalog,gates,outputs,implementation,prefix,root);
 if(!audit.ok)return blocked("20_ASSURANCE","INCOMPLETE_OPERATING_ATLAS",run_id);
 emit("20_ASSURANCE","DESIGN_COVERAGE_ONLY",catalog.componentCount);
 const gatesStatus=Object.fromEntries(Array.from({length:8},(_,i)=>["G"+i,"UNVERIFIED"]));
 return {
  ok:true,kind:"SYNTHETIC_REHEARSAL",run_id,tenant_id:manifest.tenant_id,engagement_id:manifest.engagement_id,
  gate_states:gatesStatus,production_ready:false,report_publishable:false,employment_decisions_permitted:false,
  evidence:{artifact_count:receipt.verified_artifacts.length,quarantined:true,
   provisional_project_score:evaluation.result.weighted_score,score_scale:"0–5, synthetic and not jury certified",
   claims_referenced:claimsList.length,private_capabilities_not_exported:true},
  graph:{node_count:executiveGraph.nodes.length,edge_count:executiveGraph.edges.length,all_nodes_proposed:true},
  scenarios:scenarios.scenarios.map(x=>({scenario_id:x.scenario_id,status:x.status,objective:x.objective,cost_range_eur:x.cost_range_eur})),
  executive_bundle:{status:report.manifest.status,manifest:report.manifest,documents:report.documents.map(({body,...meta})=>meta)},
  activation:{milestones:activation.roadmap.map(x=>({item_id:x.item_id,milestone:x.milestone,status:x.status,dependencies:x.dependencies})),activated:false},
  economics:{estimated_direct_cost_eur:economics.economics.direct_cost_eur,hypothetical_price_eur:economics.economics.price_eur,
    margin_ratio:economics.economics.gross_margin_ratio,verified_actuals:false},
  assurance:{design_domains:audit.audit.domain_count,design_components:audit.audit.component_count,
   unverified_components:audit.unverified_components,production_ready:false},
  journal:inputJournal,limitations:[syntheticWarning]
 };
}
