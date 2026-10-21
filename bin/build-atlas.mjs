#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const catalog=JSON.parse(fs.readFileSync(path.join(root,"catalog","operating-model.json"),"utf8"));
const tpl=fs.readFileSync(path.join(root,"web","atlas.template.html"),"utf8");
const safe=JSON.stringify(catalog).replace(/</g,"\\u003c").replace(/\u2028/g,"\\u2028").replace(/\u2029/g,"\\u2029");
const output=tpl.replace("__GRAPH_JSON__",safe);
fs.writeFileSync(path.join(root,"web","atlas.html"),output,"utf8");
console.log("Generated web/atlas.html: "+catalog.componentCount+" components / "+catalog.edges.length+" edges (offline).");
