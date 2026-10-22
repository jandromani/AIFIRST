#!/usr/bin/env node
/** Offline reference replay CLI: no network, no credentials or external services. */
import fs from 'node:fs';
import crypto from 'node:crypto';
import {runReplay,defaultReplayInput,canonicalJson} from '../web/replay-core.mjs';
const digest=s=>crypto.createHash('sha256').update(s).digest('hex');
const mode=process.argv[2]||'default';
if(!['default','verify'].includes(mode))throw Error('Usage: node bin/replay.mjs [default | verify path-to-json]');
const input=mode==='verify'?JSON.parse(fs.readFileSync(process.argv[3]||'','utf8')):defaultReplayInput();
const result=runReplay(input);
console.log(JSON.stringify({schema:'aifirst.replay.portable_v1',input,result,scenario_sha256:digest(canonicalJson(input)),result_sha256:digest(canonicalJson(result)),synthetic_only:true,production_release:false},null,2));
