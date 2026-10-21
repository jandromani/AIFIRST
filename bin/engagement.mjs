#!/usr/bin/env node
// Fixed synthetic fixture only: no flag may point to live customer data.
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {simulateSyntheticEngagement} from "../src/engagement.mjs";
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const load=p=>JSON.parse(fs.readFileSync(path.join(root,p),"utf8"));
if(process.argv.length!==3||process.argv[2]!=="simulate"){
 console.error("Usage: node bin/engagement.mjs simulate  # synthetic fixtures only");
 process.exitCode=2;
}else{
 const b="examples/phase2/",p="examples/vertical/";
 const input={
  synthetic:true,artifactDirectory:path.join(root,b,"artifacts"),
  manifest:load(b+"SubmissionManifest.json"),
  registrations:load(b+"ParticipantRegistration.json"),roster:load(b+"TeamRoster.json"),
  rubric:load(b+"Rubric.json"),challenge:load(b+"ChallengeBrief.json"),
  claims:load(b+"EvidenceClaim.json"),jury:load(b+"JuryReview.json"),
  priceModel:load(p+"PriceModel.json"),
  catalog:load("catalog/operating-model.json"),
  gates:load("catalog/gates.json").gates,
  outputs:load("catalog/outputs.json").outputs,
  implementation:load("catalog/implementation-status.json")
 };
 const result=simulateSyntheticEngagement(input,root);
 console.log(JSON.stringify(result,null,2));
 if(!result.ok)process.exitCode=1;
}
