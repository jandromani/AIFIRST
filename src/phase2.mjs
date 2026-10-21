// Offline reference workflow for domains 06–12. No outbound network, no code execution, no LLM.
import fs from "node:fs";
import path from "node:path";
import {createHash} from "node:crypto";
import {validateContract} from "./core.mjs";

const SHA = /^[0-9a-f]{64}$/;
const ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{2,127}$/;
export function sha256(value){return createHash("sha256").update(value).digest("hex");}
export function artifactDigest(artifacts){
  return sha256(artifacts.map(x=>x.artifact_id+":"+x.sha256).sort().join("\n"));
}
function failures(kind,obj,root){return validateContract(kind,obj,root);}
function same(a,b){return a.tenant_id===b.tenant_id&&a.engagement_id===b.engagement_id;}
function unique(a){return new Set(a).size===a.length;}
function checkId(x){return typeof x==="string"&&ID.test(x);}
function fail(message){return {ok:false,errors:[message]};}
const EVENT_VERSION="1.0.0";

/** Module 06: build an offline dispatch plan (never emails, SMS or webhook calls). */
export function planCommunications(messages,tenant,engagement,root){
 const errors=[],out=[],keys=new Set();
 for(const [i,m] of messages.entries()){
   const e=failures("DeliveryMessage",m,root);
   if(e.length)errors.push(...e.map(x=>"messages["+i+"] "+x));
   if(m.tenant_id!==tenant||m.engagement_id!==engagement)errors.push("messages["+i+"]: scope mismatch");
   if(keys.has(m.idempotency_key))errors.push("messages["+i+"]: duplicate idempotency key");
   keys.add(m.idempotency_key);
   if(m.dispatch_state==="sent")errors.push("messages["+i+"]: sent status cannot be asserted by offline planner");
   if(m.channel==="sms"&&!m.approval_ref)errors.push("messages["+i+"]: SMS requires explicit approval reference");
   if(m.body&&/\b(?:password|private.key|api.key)\b/i.test(m.body))errors.push("messages["+i+"]: possible secret in template");
   out.push({...m,dispatch_state:m.dispatch_state==="suppressed"?"suppressed":"queued"});
 }
 return {ok:errors.length===0,errors,queued:errors.length?[]:out,note:"Messages are queued in-memory only; no participant contacted."};
}
/** Module 07: roster checks; aliases are not real identities or employee scores. */
export function validateRoster(registrations,roster,challengeId,root){
 const errors=[];
 errors.push(...failures("TeamRoster",roster,root));
 if(roster.challenge_id!==challengeId)errors.push("Roster challenge mismatch");
 const aliases=new Set();
 for(const [i,p] of registrations.entries()){
   errors.push(...failures("ParticipantRegistration",p,root).map(e=>"participant["+i+"] "+e));
   if(!same(p,roster))errors.push("Participant scope mismatch");
   if(aliases.has(p.participant_alias))errors.push("Duplicate alias");
   aliases.add(p.participant_alias);
   if(p.team_id!==roster.team_id||!p.challenge_ids?.includes(challengeId))errors.push("Team/challenge mismatch");
   if(!p.eligibility_verified||!p.rules_accepted||p.withdrawal_state!=="active")errors.push("Participant not eligible/active/acknowledged: "+p.participant_alias);
 }
 const memberAliases=roster.members?.map(m=>m.participant_alias)||[];
 if(!unique(memberAliases))errors.push("Duplicate roster member");
 if(aliases.size!==memberAliases.length||memberAliases.some(x=>!aliases.has(x)))errors.push("Roster does not match registrations");
 return {ok:errors.length===0,errors,participant_count:aliases.size,team_id:roster.team_id};
}
function boundedFile(base,relative,maxBytes=1024*1024){
 if(typeof relative!=="string"||!relative||path.isAbsolute(relative)||relative.includes("\\")||relative.split("/").some(x=>!x||x==="."||x===".."))throw Error("Unsafe artifact path");
 const root=fs.realpathSync(base);let cursor=root;
 for(const segment of relative.split("/")){
   cursor=path.join(cursor,segment);
   const stat=fs.lstatSync(cursor);
   if(stat.isSymbolicLink())throw Error("Symlink blocked");
 }
 const resolved=fs.realpathSync(cursor);
 if(!resolved.startsWith(root+path.sep))throw Error("Artifact escapes root");
 const stat=fs.statSync(resolved);
 if(!stat.isFile()||stat.size>maxBytes)throw Error("Invalid artifact type/size");
 return fs.readFileSync(resolved);
}
/** Module 08–09: hash actual files, quarantine until independent security checks. */
export function inspectLocalSubmission(folder,manifest,root){
 const errors=failures("SubmissionManifest",manifest,root);
 const ids=new Set(),paths=new Set(),verified=[];
 for(const artifact of manifest.artifact_refs||[]){
   if(!checkId(artifact.artifact_id)||!SHA.test(artifact.sha256||"")){errors.push("Artifact ID/digest malformed");continue;}
   if(ids.has(artifact.artifact_id)||paths.has(artifact.relative_path))errors.push("Duplicate artifact id/path");
   ids.add(artifact.artifact_id);paths.add(artifact.relative_path);
   try{
     const bytes=boundedFile(folder,artifact.relative_path);
     const hash=sha256(bytes);
     if(hash!==artifact.sha256||bytes.length!==artifact.size_bytes)errors.push("Artifact size/hash mismatch: "+artifact.artifact_id);
     else verified.push({artifact_id:artifact.artifact_id,sha256:hash});
   }catch(e){errors.push("Artifact "+artifact.artifact_id+": "+e.message);}
 }
 if(manifest.artifact_refs?.length===0)errors.push("Empty artifact list");
 if(!manifest.artifact_refs?.some(x=>x.relative_path===manifest.readme_ref))errors.push("README not in artifact list");
 if(manifest.sha256!==artifactDigest(manifest.artifact_refs||[]))errors.push("Manifest bundle digest mismatch");
 if(!unique((manifest.contribution_claims||[]).map(c=>c.participant_alias)))errors.push("Duplicate contributor alias");
 for(const c of manifest.contribution_claims||[]){
  if(!Array.isArray(c.artifact_ids)||c.artifact_ids.some(x=>!ids.has(x)))errors.push("Contributor refers to missing artifact");
 }
 return {ok:errors.length===0,errors,verified_artifacts:verified,quarantine:true,
  security_checks:{malware:"unknown",secrets:"unknown",pii:"unknown"},
  note:"SHA-256 is verified, but no AV, secret detection, PII inspection, legal review or execution has run."};
}
/** G3 cannot be auto-approved by this reference implementation. */
export function g3Preflight(manifest,receipt,packet,root){
 const errors=[
   ...failures("SubmissionManifest",manifest,root),
   ...failures("IntakeReceipt",receipt,root),
   ...failures("NormalizedPackage",packet,root)
 ];
 if(!same(manifest,receipt)||!same(receipt,packet))errors.push("Cross-tenant/engagement mismatch");
 if(receipt.submission_id!==manifest.submission_id||packet.submission_id!==manifest.submission_id)errors.push("Submission ID mismatch");
 if(receipt.manifest_sha256!==manifest.sha256)errors.push("Manifest digest mismatch");
 const required=["schema","hash","malware","secrets","pii","license"];
 for(const kind of required){
  const item=receipt.checks?.filter(c=>c.kind===kind)||[];
  if(item.length!==1||item[0].status!=="pass")errors.push(kind+" check missing or not passed");
 }
 if(receipt.quarantine||packet.quarantine||packet.gate_g3!=="approved")errors.push("Packet remains quarantined or unapproved");
 if(packet.artifact_hashes?.some(x=>!manifest.artifact_refs.some(a=>a.artifact_id===x.artifact_id&&a.sha256===x.sha256))||packet.artifact_hashes?.length!==manifest.artifact_refs?.length)errors.push("Artifacts inconsistent");
 return {checks_pass:errors.length===0,errors,authorization_verified:false,
 note:"External security attestations and real human signature are NOT verified by this CLI. G3 operational status is pending regardless of checks."};
}
/** Module 10: deterministic blocked-by-default job planning. No AI calls. */
export function planJobs(packet,jobSpecs,maxBudget,root){
 const errors=[],keys=new Set(),planned=[];
 errors.push(...failures("NormalizedPackage",packet,root));
 if(!Number.isFinite(maxBudget)||maxBudget<0)errors.push("Invalid cost ceiling");
 let total=0;
 for(const job of jobSpecs){
  errors.push(...failures("JobSpec",job,root));
  if(!same(job,packet))errors.push("Job scope mismatch");
  if(keys.has(job.idempotency_key))errors.push("Duplicate job idempotency key");
  keys.add(job.idempotency_key);
  if(!job.input_refs?.includes(packet.package_id))errors.push("Job missing normalized input");
  if(job.state!=="queued")errors.push("Only queued job allowed");
  total+=job.max_cost_eur||0;
  planned.push({...job,state:packet.gate_g3==="approved"&&!packet.quarantine?"queued":"blocked"});
 }
 if(total>maxBudget)errors.push("Budget exceeded");
 return {ok:errors.length===0,errors,jobs:errors.length?[]:planned,planned_budget_eur:total,
 actual_spend_eur:0,executed:false,note:"Job specifications only: no sandbox, model, worker or code execution."};
}
/** Module 11: score SOLUTIONS only, from independently verified claims tied to artifacts. */
export function evaluateSolution(manifest,rubric,claims,challenge,root){
 const errors=[
  ...failures("SubmissionManifest",manifest,root),
  ...failures("Rubric",rubric,root)
 ];
 if(manifest.rubric_id!==rubric.rubric_id||manifest.rubric_version!==rubric.version)errors.push("Rubric/version mismatch");
 if(manifest.challenge_id!==challenge.challenge_id||challenge.rubric_id!==rubric.rubric_id)errors.push("Challenge mismatch");
 const sourceIds=new Set((manifest.artifact_refs||[]).map(x=>x.artifact_id));
 const used=new Set(),criterion_scores=[];
 for(const criterion of rubric.criteria||[]){
  const matches=claims.filter(c=>c.subject_id===manifest.submission_id&&c.predicate==="criterion:"+criterion.id);
  if(matches.length!==1){errors.push("Expected one evidence claim per criterion: "+criterion.id);continue;}
  const claim=matches[0];
  errors.push(...failures("EvidenceClaim",claim,root).map(x=>claim.claim_id+" "+x));
  if(used.has(claim.claim_id))errors.push("Repeated claim ID");
  used.add(claim.claim_id);
  if(!same(claim,manifest)||!sourceIds.has(claim.source_artifact_id))errors.push("Claim source or tenant mismatch");
  if(claim.review_state!=="verified"||claim.method==="self_report")errors.push("Unverified or self-reported scoring: "+criterion.id);
  if(!claim.reviewer_ref)errors.push("Missing human reviewer reference: "+criterion.id);
  const score=Number(claim.value);
  if(!Number.isFinite(score)||score<0||score>5||String(score)!==claim.value)errors.push("Invalid score: "+criterion.id);
  if(Number.isFinite(score)&&score>=0&&score<=5)criterion_scores.push({criterion_id:criterion.id,score,weight:criterion.weight,evidence_claim_ids:[claim.claim_id],rationale:"Evidence "+claim.claim_id+" requires independent review"});
 }
 if(!Number.isFinite((rubric.criteria||[]).reduce((s,c)=>s+c.weight,0))||Math.abs(rubric.criteria.reduce((s,c)=>s+c.weight,0)-1)>1e-8)errors.push("Rubric weights must sum to 1");
 const sum=criterion_scores.reduce((s,x)=>s+x.score*x.weight,0);
 const result={schema_version:EVENT_VERSION,tenant_id:manifest.tenant_id,engagement_id:manifest.engagement_id,
 evaluation_id:"evaluation:"+manifest.submission_id,submission_id:manifest.submission_id,challenge_id:manifest.challenge_id,
 rubric_id:rubric.rubric_id,rubric_version:rubric.version,difficulty:challenge.difficulty,
 criterion_scores:errors.length?[]:criterion_scores,evidence_claim_ids:errors.length?[]:[...used],veto_flags:[],
 limitations:["Offline draft; no AV/PII scan, sandbox, juror identity validation or G4 signoff"],
 review_state:errors.length?"needs_evidence":"pending_jury"};
 if(!errors.length)result.weighted_score=Math.round(sum*1000)/1000;
 return {ok:errors.length===0,errors,result,rankable:false,gate_g4:"pending",note:"No jury signoff; score is a provisional project assessment, never an employee score."};
}
/** Module 11 jury packet consistency, not an e-signature verifier. */
export function reviewJury(result,reviews,root){
 const errors=[];
 errors.push(...failures("EvaluationResult",result,root));
 if(result.review_state!=="pending_jury")errors.push("Result not ready for jury");
 if(!reviews.length)errors.push("No reviews");
 const jurors=new Set();
 for(const review of reviews){
  errors.push(...failures("JuryReview",review,root));
  if(!same(review,result)||review.evaluation_id!==result.evaluation_id)errors.push("Review scope mismatch");
  if(jurors.has(review.juror_ref))errors.push("Repeated juror");
  jurors.add(review.juror_ref);
  if(review.recused||!review.conflicts_declared)errors.push("Conflict declaration/recusal blocks review");
  if(review.decision!=="approve")errors.push("Review not approved or requests revision");
 }
 return {checks_pass:errors.length===0,errors,gate_g4:"pending_external_signoff",
 note:"The identity and independence of jurors must be checked outside the CLI."};
}
/** 12: capability evidence requires a corroborated contribution and verified skill-specific source. */
export function deriveCapability(participant,manifest,claims,skillId,root){
 const errors=[...failures("ParticipantRegistration",participant,root)];
 if(!same(participant,manifest)||participant.team_id!==manifest.team_id)errors.push("Wrong participant/team scope");
 const contribution=(manifest.contribution_claims||[]).find(c=>c.participant_alias===participant.participant_alias&&c.verification_state==="corroborated");
 if(!contribution)errors.push("No corroborated contribution");
 const sources=new Set(contribution?.artifact_ids||[]);
 const verified=claims.filter(c=>c.subject_id===participant.participant_alias&&c.predicate==="skill:"+skillId&&c.review_state==="verified"&&c.method!=="self_report"&&sources.has(c.source_artifact_id)&&same(c,manifest)&&c.reviewer_ref);
 for(const c of verified)errors.push(...failures("EvidenceClaim",c,root));
 if(!verified.length)errors.push("No independent verified skill evidence");
 if(!checkId(skillId))errors.push("Invalid skill taxonomy ID");
 if(errors.length)return {ok:false,errors,capability:null};
 const doc={schema_version:EVENT_VERSION,tenant_id:manifest.tenant_id,engagement_id:manifest.engagement_id,
 capability_id:"cap:"+participant.participant_alias+":"+skillId,participant_alias:participant.participant_alias,skill_id:skillId,
 evidence_claim_ids:verified.map(c=>c.claim_id),context:"Specific challenge "+manifest.challenge_id+"; contribution scope: "+contribution.description,
 confidence_band:"low",limitations:["Participation is voluntary and non-representative","Contribution context and available evidence limit comparability","Human review is pending"],
 human_review_state:"pending",visibility_scope:"participant",challenge_id:manifest.challenge_id};
 return {ok:true,errors:[],capability:doc,employment_decision_permitted:false};
}
/** k-anonymity gate: suppress small cells and never expose per-person ordering. */
export function aggregateCapabilities(capabilities,unitAlias,eligiblePopulation,k=5){
 if(!Number.isInteger(k)||k<5)throw Error("k must be >=5");
 const valid=capabilities.filter(c=>c.human_review_state==="approved");
 const groups=new Map();
 for(const x of valid){
  const key=x.skill_id;const a=groups.get(key)||new Set();a.add(x.participant_alias);groups.set(key,a);
 }
 return [...groups].map(([skill,aliases])=>({unit_alias:unitAlias,skill_id:skill,sample_size:aliases.size,evidence_count:valid.filter(x=>x.skill_id===skill).length,
 eligible_population:eligiblePopulation,k_threshold:k,suppressed:aliases.size<k,
 coverage_note:"Observed approved contributors only; not an estimate of workforce proficiency."}));
}
export function compareSolutions(evaluations){
 const groups=new Map();
 for(const x of evaluations){
  if(x.review_state!=="jury_approved"||x.veto_flags?.length||!Number.isFinite(x.weighted_score))continue;
  const key=[x.challenge_id,x.rubric_id,x.rubric_version,x.difficulty].join("|");
  const a=groups.get(key)||[];a.push({submission_id:x.submission_id,score:x.weighted_score});groups.set(key,a);
 }
 return [...groups.entries()].map(([comparison_key,solutions])=>({comparison_key,
 solutions:solutions.sort((a,b)=>b.score-a.score||a.submission_id.localeCompare(b.submission_id)),
 limitations:["Only comparable projects with externally verified G4; never a worker ranking"]}));
}
