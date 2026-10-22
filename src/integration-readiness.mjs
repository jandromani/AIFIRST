/** AIFIRST operational readiness registry. Never convert mere configuration into authorization. */
export const CONNECTOR_REGISTRY=Object.freeze([
 {id:'openrouter',name:'OpenRouter Free',owner:'AI Engineering / DPO',gate:'G3/G4',requires:['provider_key','synthetic_data_policy','live_test','legal_review'],next:'Live synthetic request, quality and 429 check, explicit DPO provider approval'},
 {id:'identity',name:'OIDC / corporate SSO',owner:'Corporate IT / IAM',gate:'G1/G3',requires:['trusted_issuer','client_id','mfa','offboarding','revocation'],next:'Connect an approved IdP, test MFA/revocation and tenant mapping'},
 {id:'keys',name:'Encryption and KMS',owner:'Security / Platform',gate:'G3',requires:['kms','rotation','database_encryption','external_restore'],next:'Replace local master key with tenant-scoped KMS, rotate and rehearse restore'},
 {id:'security',name:'AV / DLP and sandbox',owner:'Security / DPO',gate:'G3',requires:['av_signatures','dlp','untrusted_execution_isolation','pentest'],next:'Approved AV/DLP, adversarial format tests and sandbox escape assessment'},
 {id:'reports',name:'EX01–EX11 protected distribution',owner:'Product / CEO / Legal',gate:'G6',requires:['editorial_approval','private_delivery','claim_lineage','human_signature'],next:'Approve design, establish per-audience access and signed delivery receipts'},
 {id:'erp',name:'Fiscal ERP / invoicing',owner:'Finance / Accountant',gate:'G0/G7',requires:['fiscal_configuration','erp_api','invoice_receipts','credit_notes'],next:'Connect fiscal ERP with regulated invoice series and payment statuses'},
 {id:'bank',name:'Bank / PSP / prize settlements',owner:'Treasury / Legal',gate:'G7',requires:['regulated_provider','dual_control','kyc','settlement_webhook'],next:'Authorized PSP/bank, dual approval, reconciliation and refund evidence'},
 {id:'signatures',name:'Signatures and authorities',owner:'Legal / Independent juror',gate:'G1/G4/G5/G6/G7',requires:['signer_authority','external_signature_provider','timestamp','revocation'],next:'Configure recognized signature workflow and independent legal acceptance'},
 {id:'operations',name:'Production infrastructure',owner:'SRE / Security',gate:'G3/G7',requires:['tls','ha','audit_pipeline','backups','slo'],next:'Protected deployment, security audit, monitored backup drill and incident runbook'}
]);
export function integrationReadiness({enterprise=null,env={}}={}){
 const flags={
  openrouter:env.AIFIRST_SYNTHETIC_DEMO==='1'&&env.AIFIRST_ALLOW_OPENROUTER_FREE==='1'&&Boolean(env.OPENROUTER_API_KEY),
  identity:Boolean(enterprise?.oidc),keys:Boolean(enterprise?.masterKey),
  security:env.AIFIRST_ENABLE_CLAMAV==='1',reports:false,
  erp:Boolean(env.AIFIRST_ERP_ENDPOINT&&env.AIFIRST_ERP_API_KEY),
  bank:Boolean(enterprise?.bankVerifyKey),signatures:false,operations:false
 };
 return {
  scope:'LOCAL_WORKSPACE',generated_at:null,production_ready:false,externally_authorized:false,
  policy:'CONFIGURED_NEVER_IMPLIES_VERIFIED',
  connectors:CONNECTOR_REGISTRY.map(c=>({...c,status:flags[c.id]?'LOCALLY_CONFIGURED':'NOT_CONFIGURED',externally_verified:false,production_accepted:false})),
  summary:{configured:Object.values(flags).filter(Boolean).length,total:CONNECTOR_REGISTRY.length,externally_verified:0},
  invariants:['Local role tokens are not corporate SSO','OpenRouter Free is synthetic-metadata-only','Never accept manual bank references as settled funds','Human/legal gates remain closed','No untrusted source execution']
 };
}
