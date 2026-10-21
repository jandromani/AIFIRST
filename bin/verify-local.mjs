#!/usr/bin/env node
// Reproducible LOCAL QA runner. Uses Node built-ins only. Does not use GitHub Actions, Vercel or external services.
import fs from "node:fs";
import path from "node:path";
import {spawnSync} from "node:child_process";
import {createHash} from "node:crypto";
import {fileURLToPath} from "node:url";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const attempts=[
 ["node-unit-tests",["--test"]],
 ["operating-catalog",["bin/aifirst.mjs","catalog"]],
 ["synthetic-contract-gates",["bin/aifirst.mjs","gates","examples/synthetic"]],
 ["phase2-local",["bin/phase2.mjs","validate-demo","examples/phase2"]],
 ["phase3-local",["bin/phase3.mjs","demo","examples/phase3"]],
 ["engagement-rehearsal",["bin/engagement.mjs","simulate"]],
 ["synthetic-export",["bin/engagement.mjs","simulate","--write"]],
 ["atlas-build",["bin/build-atlas.mjs"]]
];
const now=()=>new Date().toISOString();
const started=now(),results=[];
let blocked=false;
for(const [label,args] of attempts){
 if(blocked){results.push({label,status:"SKIPPED_AFTER_FAILURE"});continue}
 const before=Date.now();
 const child=spawnSync(process.execPath,args,{cwd:root,encoding:"utf8",timeout:120000,maxBuffer:8*1024*1024,shell:false,env:{...process.env,CI:"1"}});
 const output=String(child.stdout||"")+"\n"+String(child.stderr||"");
 const exit_code=child.status??1;
 const pass=exit_code===0&&!child.error;
 results.push({label,status:pass?"PASS":"FAIL",exit_code,elapsed_ms:Date.now()-before,
  log_sha256:createHash("sha256").update(output).digest("hex"),
  output_tail:output.slice(-5000),
  error:child.error?child.error.message:null});
 console.log((pass?"PASS ":"FAIL ")+label+" ("+results.at(-1).elapsed_ms+" ms)");
 if(!pass)blocked=true;
}
if(!blocked){
 const catalog=JSON.parse(fs.readFileSync(path.join(root,"catalog/operating-model.json"),"utf8"));
 const template=fs.readFileSync(path.join(root,"web/atlas.template.html"),"utf8");
 const generated=fs.readFileSync(path.join(root,"web/atlas.html"),"utf8");
 const json=JSON.stringify(catalog).replace(/</g,"\\u003c").replace(/\u2028/g,"\\u2028").replace(/\u2029/g,"\\u2029");
 const matches=template.replace("__GRAPH_JSON__",json)===generated;
 results.push({label:"atlas-parity",status:matches?"PASS":"FAIL",exit_code:matches?0:1,
   component_count:catalog.componentCount,domain_count:catalog.domainCount,log_sha256:null});
 console.log((matches?"PASS ":"FAIL ")+"atlas-parity");
 if(!matches)blocked=true;
}
const dir=path.join(root,"artifacts");
fs.mkdirSync(dir,{recursive:true});
const report={kind:"LOCAL_QA_ONLY",does_not_certify_production:true,
 started_at:started,completed_at:now(),node_version:process.version,
 status:blocked?"FAILED":"PASSED",results,
 disclaimers:["Only synthetic fixtures are used.","Passing local tests is not external security authorization or GDPR/AI Act compliance.",
 "No human gates G3–G7 have been verified.","No GitHub Actions, Vercel or deployment is invoked."]};
const target=path.join(dir,"local-verification.json");
fs.writeFileSync(target,JSON.stringify(report,null,2)+"\n","utf8");
console.log("Local evidence: "+path.relative(root,target)+" · "+report.status);
if(blocked)process.exitCode=1;
