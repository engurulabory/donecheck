import test from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPairSync,sign as cryptSign,createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {verifyOwnerGrant,recordSingleOwnerCriterion,ENGURU_CANONICAL_V421_SHA256,sha256} from '../../dist/runtime/node/single-owner-criterion-acceptance.js';
const dir=dirname(fileURLToPath(import.meta.url));
const canonicalBytes=readFileSync(join(dir,'D03D04_ONE_OWNER_CANONICAL_V421.json'));
const now='2026-11-21T15:00:00Z';
const key=generateKeyPairSync('ed25519');
const ownerPublicKeyPem=key.publicKey.export({type:'spki',format:'pem'}).toString();
const ownerSpkiSha256=sha256(key.publicKey.export({type:'spki',format:'der'}));
const canonical=x=>JSON.stringify(x,(_k,v)=>v!==null&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.entries(v).sort(([a],[b])=>a<b?-1:a>b?1:0)):v);
const signed=payload=>({payload,signatureBase64:cryptSign(null,Buffer.from(canonical(payload)),key.privateKey).toString('base64')});
const oracleKey=generateKeyPairSync('ed25519');
const oraclePublicKeyPem=oracleKey.publicKey.export({type:'spki',format:'pem'}).toString();
const oracleSpkiSha256=sha256(oracleKey.publicKey.export({type:'spki',format:'der'}));
const sourceBytes=Buffer.from('real source fixture');
const logBytes=Buffer.from('TAP: 1/1 condition satisfied after real deterministic byte check');
const oraclePayload={schema:'enguru.d03d04.oracle-criterion-proof/v1',criterionId:'H01-05',executionId:'execution001',outcome:'pass',verificationResultId:'verification-original-01',sourceSha256:sha256(sourceBytes),logSha256:sha256(logBytes)};
const oracleSigned={payload:oraclePayload,signatureBase64:cryptSign(null,Buffer.from(canonical(oraclePayload)),oracleKey.privateKey).toString('base64')};
const oracleReceiptBytes=Buffer.from(canonical(oracleSigned));
function env(ops={}){
 const r={schema:'enguru.d03d04.owner-registry/v4.2.1',status:'ACTIVE_M02_ONLY',policySha256:ENGURU_CANONICAL_V421_SHA256,
 ownerKeySha256:ownerSpkiSha256,oracleKeySha256:oracleSpkiSha256,version:3,epoch:1,nonce:'e6f7a4b8768e4a05afd92021e4c53a8a',notBefore:'2026-11-21T12:00:00Z',notAfter:'2026-11-22T12:00:00Z',revokedIds:[],allowedIds:['H01-05','DG02-01'],...ops.registry};
 const sr=signed(r);
 const g={schema:'enguru.d03d04.owner-grant/v4.2.1',grantId:'gain00001',actor:'SOLE_HUMAN_OWNER',action:'ACCEPT_M02_CRITERION',policySha256:ENGURU_CANONICAL_V421_SHA256,
 registryVersion:r.version,registryEpoch:r.epoch,registryNonce:r.nonce,criterionId:'H01-05',sourceSha256:sha256(sourceBytes),testLogSha256:sha256(logBytes),oracleReceiptSha256:sha256(oracleReceiptBytes),notBefore:'2026-11-21T12:00:00Z',notAfter:'2026-11-22T12:00:00Z',denyM03:true,denyVerifiedFinish:true,...ops.grant};
 const root={origin:'PROTECTED_OWNER_CAS_STORE',policySha256:ENGURU_CANONICAL_V421_SHA256,ownerSpkiSha256,oracleSpkiSha256,expectedRegistrySha256:sha256(canonical(sr)),liveAuthorized:true,registryVersion:r.version,registryEpoch:r.epoch,registryNonce:r.nonce,...ops.root};
 return {root,signedRegistry:sr,signedGrant:signed(g),ownerPublicKeyPem,canonicalBytes,now,...ops.other};
}
function ledger(){const records=[];return {verify:async()=>({valid:true,records:[...records],headHash:records.at(-1)?.hash??null}),append:async e=>{if(records.some(r=>r.event.id===e.id))throw Error('DUPLICATE');const rec={event:e,hash:'sha256:'+sha256(canonical(e))};records.push(rec);return rec;}}}
const evidence={sourceBytes,logBytes,oracleReceiptBytes,oraclePublicKeyPem,criterionId:'H01-05',executionId:'execution001'};
const donecheckResult={id:'verification-original-01',outcome:'pass',criteria:[{criterionId:'H01-05',outcome:'pass'}]};
test('01 valid owner Ed25519 + independently pinned CAS yields scoped grant',()=>assert.equal(verifyOwnerGrant(env()).criterionId,'H01-05'));
test('02 absent protected CAS root refuses',()=>assert.throws(()=>verifyOwnerGrant(env({root:{origin:'UNTRUSTED'}})),/TRUSTED_CAS_NOT_ACTIVE/));
test('03 untrusted owner public key refused',()=>assert.throws(()=>verifyOwnerGrant(env({root:{ownerSpkiSha256:'f'.repeat(64)}})),/UNTRUSTED_OWNER_KEY/));
test('04 canonical bytes modified refused',()=>assert.throws(()=>verifyOwnerGrant(env({other:{canonicalBytes:Buffer.from(canonicalBytes.toString().replace('4.2.1','4.2.2'))}})),/CANONICAL_BYTES_CHANGED/));
test('05 CAS nonce/epoch drift refused',()=>assert.throws(()=>verifyOwnerGrant(env({root:{registryNonce:'0'.repeat(32)}})),/CAS_VERSION_OR_NONCE_MISMATCH/));
test('06 revoked owner grant refused',()=>assert.throws(()=>verifyOwnerGrant(env({registry:{revokedIds:['gain00001']}})),/GRANT_REVOKED_OR_INVALID/));
test('07 expired owner grant refused',()=>assert.throws(()=>verifyOwnerGrant(env({grant:{notAfter:'2026-11-21T13:00:00Z'}})),/GRANT_EXPIRED/));
test('08 illegal M03 escalation refused',()=>assert.throws(()=>verifyOwnerGrant(env({grant:{denyM03:false}})),/HUMAN_THRESHOLD_BYPASS/));
test('09 original criterion outside allowed scope refused',()=>assert.throws(()=>verifyOwnerGrant(env({grant:{criterionId:'H01-03'}})),/CRITERION_NOT_AUTHORIZED/));
test('10 changed registry signature refused',()=>{const x=env();x.signedRegistry.signatureBase64='A'.repeat(88);x.root.expectedRegistrySha256=sha256(canonical(x.signedRegistry));assert.throws(()=>verifyOwnerGrant(x),/(SIGNATURE_INVALID|SIGNATURE_ENCODING)/)});
test('11 forged authority object cannot record',async()=>await assert.rejects(recordSingleOwnerCriterion({authority:{criterionId:'H01-05'},evidence,donecheckResult,ledger:ledger(),occurredAt:now}),/UNVERIFIED_OWNER_AUTHORITY/));
test('12 valid scoped owner grant + actual proof SHA + DoneCheck yields one event',async()=>{const a=verifyOwnerGrant(env());const l=ledger();const receipt=await recordSingleOwnerCriterion({authority:a,evidence,donecheckResult,ledger:l,occurredAt:now});assert.equal(receipt.state,'PASS_SCOPED');assert.equal((await l.verify()).records.length,1)});
test('13 tampered source bytes rejected',async()=>await assert.rejects(recordSingleOwnerCriterion({authority:verifyOwnerGrant(env()),evidence:{...evidence,sourceBytes:Buffer.from('modified')},donecheckResult,ledger:ledger(),occurredAt:now}),/EVIDENCE_BYTES_CHANGED/));
test('14 DoneCheck inconclusive cannot be authorized',async()=>await assert.rejects(recordSingleOwnerCriterion({authority:verifyOwnerGrant(env()),evidence,donecheckResult:{...donecheckResult,outcome:'inconclusive'},ledger:ledger(),occurredAt:now}),/DONECHECK_CRITERION_NOT_PASS/));
test('15 idempotent readback no duplicate events',async()=>{const a=verifyOwnerGrant(env()),l=ledger(),i={authority:a,evidence,donecheckResult,ledger:l,occurredAt:now};await recordSingleOwnerCriterion(i);await recordSingleOwnerCriterion(i);assert.equal((await l.verify()).records.length,1)});
test('16 invalid ledger refuses',async()=>await assert.rejects(recordSingleOwnerCriterion({authority:verifyOwnerGrant(env()),evidence,donecheckResult,ledger:{verify:async()=>({valid:false}),append:async()=>{throw Error('unexpected')}},occurredAt:now}),/LEDGER_UNAVAILABLE_OR_INVALID/));
test('17 replay with altered evidence proof rejected',async()=>{const a=verifyOwnerGrant(env());const l=ledger();await recordSingleOwnerCriterion({authority:a,evidence,donecheckResult,ledger:l,occurredAt:now});const copy=await l.verify();copy.records[0].event.payload.proofSha256='f'.repeat(64);await assert.rejects(recordSingleOwnerCriterion({authority:a,evidence,donecheckResult,ledger:l,occurredAt:now}),/REPLAY_CONFLICT/)});
test('18 returned audit never claims formal verified finish',async()=>{const a=verifyOwnerGrant(env());const l=ledger();const out=await recordSingleOwnerCriterion({authority:a,evidence,donecheckResult,ledger:l,occurredAt:now});assert.equal(out.schema,'donecheck.single-owner-criterion-evidence/v1');const v=await l.verify();assert.notEqual(v.records[0].event.type,'verified_finish');assert.equal(v.records[0].event.payload.verifiedFinish,false)});

test('19 independently pinned oracle key cannot be changed',async()=>await assert.rejects(recordSingleOwnerCriterion({authority:verifyOwnerGrant(env()),evidence:{...evidence,oraclePublicKeyPem:ownerPublicKeyPem},donecheckResult,ledger:ledger(),occurredAt:now}),/ORACLE_KEY_UNTRUSTED/));
test('20 DoneCheck result id must match independently signed oracle receipt',async()=>await assert.rejects(recordSingleOwnerCriterion({authority:verifyOwnerGrant(env()),evidence,donecheckResult:{...donecheckResult,id:'forged-result'},ledger:ledger(),occurredAt:now}),/ORACLE_RESULT_MISMATCH/));
test('21 forged oracle signature is rejected even when grant signs its SHA',async()=>{const fake={...oracleSigned,signatureBase64:'A'.repeat(88)};const fakeBytes=Buffer.from(canonical(fake));const a=verifyOwnerGrant(env({grant:{oracleReceiptSha256:sha256(fakeBytes)}}));await assert.rejects(recordSingleOwnerCriterion({authority:a,evidence:{...evidence,oracleReceiptBytes:fakeBytes},donecheckResult,ledger:ledger(),occurredAt:now}),/(SIGNATURE_ENCODING|SIGNATURE_INVALID)/)});