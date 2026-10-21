import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {sha256,artifactDigest,planCommunications,validateRoster,inspectLocalSubmission,g3Preflight,planJobs,evaluateSolution,reviewJury,deriveCapability,aggregateCapabilities,compareSolutions} from "../src/phase2.mjs";
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const fixture=path.join(root,"examples/phase2");
const read=x=>JSON.parse(fs.readFileSync(path.join(fixture,x+".json"),"utf8"));
const base=()=>({manifest:read("SubmissionManifest"),roster:read("TeamRoster"),participants:read("ParticipantRegistration"),rubric:read("Rubric"),claims:read("EvidenceClaim"),challenge:read("ChallengeBrief")});
test("06 communication queues offline, duplicates blocked",()=>{
 const msg=read("DeliveryMessage");
 assert.equal(planCommunications(msg,"demo-tenant","demo-engagement",root).ok,true);
 assert.equal(planCommunications([msg[0],msg[0]],"demo-tenant","demo-engagement",root).ok,false);
});
test("07 participant aliases match eligible active roster",()=>{
 const b=base();
 assert.equal(validateRoster(b.participants,b.roster,b.manifest.challenge_id,root).ok,true);
 assert.equal(validateRoster([{...b.participants[0],withdrawal_state:"withdrawn"}],b.roster,b.manifest.challenge_id,root).ok,false);
});
test("08–09 hash read-only artifacts; G3 always needs external verification",()=>{
 const b=base();
 const intake=inspectLocalSubmission(path.join(fixture,"artifacts"),b.manifest,root);
 assert.equal(intake.ok,true);
 assert.equal(intake.quarantine,true);
 const r={schema_version:"1.0.0",tenant_id:b.manifest.tenant_id,engagement_id:b.manifest.engagement_id,receipt_id:"receipt-demo",submission_id:b.manifest.submission_id,manifest_sha256:b.manifest.sha256,received_at:"2026-10-21T12:00:00Z",checks:["schema","hash","malware","secrets","pii","license"].map(kind=>({kind,status:"pass",evidence_ref:"DEMO-attestation"})),quarantine:false,reasons:[]};
 const p={schema_version:"1.0.0",tenant_id:b.manifest.tenant_id,engagement_id:b.manifest.engagement_id,package_id:"package-demo",submission_id:b.manifest.submission_id,receipt_id:r.receipt_id,artifact_hashes:b.manifest.artifact_refs.map(({artifact_id,sha256})=>({artifact_id,sha256})),evidence_claim_ids:[],gate_g3:"approved",quarantine:false,limitations:[]};
 const status=g3Preflight(b.manifest,r,p,root);
 assert.equal(status.checks_pass,true);
 assert.equal(status.authorization_verified,false);
});
test("09 reject missing files, symlinks and tampered artifacts",()=>{
 const b=base();
 b.manifest.artifact_refs[0].relative_path="../escape.txt";
 assert.equal(inspectLocalSubmission(path.join(fixture,"artifacts"),b.manifest,root).ok,false);
 const wrong=base();wrong.manifest.artifact_refs[0].sha256="a".repeat(64);
 assert.equal(inspectLocalSubmission(path.join(fixture,"artifacts"),wrong.manifest,root).ok,false);
});
test("10 refuse excess job budget and duplicate jobs",()=>{
 const packet={schema_version:"1.0.0",tenant_id:"demo-tenant",engagement_id:"demo-engagement",package_id:"package-demo",submission_id:"submission-demo",receipt_id:"receipt-demo",artifact_hashes:[{artifact_id:"artifact-demo",sha256:"a".repeat(64)}],evidence_claim_ids:[],gate_g3:"pending",quarantine:true,limitations:[]};
 const job={schema_version:"1.0.0",tenant_id:"demo-tenant",engagement_id:"demo-engagement",job_id:"job-demo",job_type:"evaluation_draft",input_refs:["package-demo"],policy_version:"1.0",max_cost_eur:2,state:"queued",attempt:0,idempotency_key:"key-demo"};
 const r=planJobs(packet,[job],3,root);
 assert.equal(r.ok,true);assert.equal(r.executed,false);assert.equal(r.jobs[0].state,"blocked");
 assert.equal(planJobs(packet,[job],1,root).ok,false);
 assert.equal(planJobs(packet,[job,job],5,root).ok,false);
});
test("11 provisional project scores require verified criterion evidence",()=>{
 const b=base();
 const r=evaluateSolution(b.manifest,b.rubric,b.claims,b.challenge,root);
 assert.equal(r.ok,true);assert.equal(r.rankable,false);assert.equal(r.result.review_state,"pending_jury");
 const broken=structuredClone(b.claims);broken[0].review_state="unverified";
 assert.equal(evaluateSolution(b.manifest,b.rubric,broken,b.challenge,root).ok,false);
 const other=structuredClone(b.manifest);other.rubric_version="2.0";
 assert.equal(evaluateSolution(other,b.rubric,b.claims,b.challenge,root).ok,false);
});
test("11 separate jury verification and disallow unreviewed rankings",()=>{
 const b=base();
 const result=evaluateSolution(b.manifest,b.rubric,b.claims,b.challenge,root).result;
 const review=read("JuryReview");
 const status=reviewJury(result,review,root);
 assert.equal(status.checks_pass,true);assert.equal(status.gate_g4,"pending_external_signoff");
 assert.deepEqual(compareSolutions([result]),[]);
});
test("12 derive contextual capability, never employment score",()=>{
 const b=base();
 const r=deriveCapability(b.participants[0],b.manifest,b.claims,"skill:documentation",root);
 assert.equal(r.ok,true);assert.equal(r.capability.human_review_state,"pending");
 assert.equal(r.employment_decision_permitted,false);
 const bad=structuredClone(b.manifest);bad.contribution_claims[0].verification_state="declared";
 assert.equal(deriveCapability(b.participants[0],bad,b.claims,"skill:documentation",root).ok,false);
});
test("12 aggregate suppresses small groups and ignores pending review",()=>{
 const b=base();const cap=deriveCapability(b.participants[0],b.manifest,b.claims,"skill:documentation",root).capability;
 assert.deepEqual(aggregateCapabilities([cap],"ops-unit",100,5),[]);
 const approved={...cap,human_review_state:"approved"};
 assert.equal(aggregateCapabilities([approved],"ops-unit",100,5)[0].suppressed,true);
});
