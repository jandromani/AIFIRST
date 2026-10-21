#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {validateRoster,inspectLocalSubmission,evaluateSolution,deriveCapability,aggregateCapabilities,planCommunications} from "../src/phase2.mjs";
const project=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const [cmd,arg]=process.argv.slice(2);
function print(value,fail=false){console.log(JSON.stringify(value,null,2));if(fail)process.exitCode=1;}
try{
 if(!arg)throw Error("Usage: node bin/phase2.mjs <inspect|validate-demo> <directory>");
 const read=name=>JSON.parse(fs.readFileSync(path.join(arg,name),"utf8"));
 const manifest=read("SubmissionManifest.json");
 if(cmd==="inspect"){
  const result=inspectLocalSubmission(path.join(arg,"artifacts"),manifest,project);
  print(result,!result.ok);
 }else if(cmd==="validate-demo"){
  const roster=read("TeamRoster.json"),registrations=read("ParticipantRegistration.json"),rubric=read("Rubric.json"),claims=read("EvidenceClaim.json"),challenge=read("ChallengeBrief.json");
  const intake=inspectLocalSubmission(path.join(arg,"artifacts"),manifest,project);
  const participation=validateRoster(registrations,roster,manifest.challenge_id,project);
  const evaluation=evaluateSolution(manifest,rubric,claims,challenge,project);
  const capability=deriveCapability(registrations[0],manifest,claims,"skill:documentation",project);
  print({intake,participation,evaluation,capability,operational_status:"BLOCKED_BEFORE_G3_G4",
   note:"Synthetic demo; no real scans, worker, external juror or legal approval."},
   !intake.ok||!participation.ok||!evaluation.ok||!capability.ok);
 }else throw Error("Unknown command "+cmd);
}catch(e){print({error:e.message},true);}
