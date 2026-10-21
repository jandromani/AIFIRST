#!/usr/bin/env node
import path from "node:path";
import {fileURLToPath} from "node:url";
import {schemaFor,readJson,validateContract,validateCatalog,loadBundle,evaluateGates,calculateQuote} from "../src/core.mjs";
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const [command,...args]=process.argv.slice(2);
function out(data,failed=false){console.log(JSON.stringify(data,null,2));if(failed)process.exitCode=1;}
try {
 if(command==="validate"){
   const [kind,file]=args;
   if(!kind||!file)throw Error("Usage: validate <ContractName> <file.json>");
   schemaFor(kind,root);
   const errors=validateContract(kind,readJson(file),root);
   out({contract:kind,valid:errors.length===0,errors},errors.length>0);
 }else if(command==="gates"){
   if(!args[0])throw Error("Usage: gates <directory>");
   const r=evaluateGates(loadBundle(args[0]),root);
   out({gates:r,all_pass:r.every(x=>x.passed)},!r.every(x=>x.passed));
 }else if(command==="quote"){
   if(!args[0])throw Error("Usage: quote <PricingQuote.json>");
   const q=readJson(args[0]),errors=validateContract("PricingQuote",q,root);
   out({valid:errors.length===0,errors,breakdown:calculateQuote(q)},errors.length>0);
 }else if(command==="catalog"){
   const graph=readJson(path.join(root,"catalog/operating-model.json"));
   const errors=validateCatalog(graph);
   out({valid:errors.length===0,domainCount:graph.domains.length,componentCount:graph.componentCount,edgeCount:graph.edges.length,errors},errors.length>0);
 }else{
   out({usage:["validate <ContractName> <file.json>","gates <directory>","quote <PricingQuote.json>","catalog"]},!["-h","--help","help"].includes(command));
 }
}catch(e){out({error:String(e.message||e)},true);}
