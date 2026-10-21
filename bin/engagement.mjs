#!/usr/bin/env node
// Fixed synthetic fixture only: no flag may point to live customer data.
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {simulateSyntheticEngagement} from "../src/engagement.mjs";
import {writeSyntheticArtifacts} from "../src/export.mjs";
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const load=p=>JSON.parse(fs.readFileSync(path.join(root,p),"utf8"));
if(![3,4].includes(process.argv.length)||process.argv[2]!=="simulate"||(process.argv.length===4&&process.argv[3]!=="--write")){
 console.error("Usage: node bin/engagement.mjs simulate [--write]  # fixed synthetic fixtures only");
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
 const local_export=result.ok&&process.argv[3]==="--write"?writeSyntheticArtifacts(root,result):null;
 console.log(JSON.stringify({...result,local_export},null,2));
 if(!result.ok)process.exitCode=1;
}
