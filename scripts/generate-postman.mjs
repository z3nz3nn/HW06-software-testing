import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import jwt from "jsonwebtoken";
import { resetCases, couponCases, importCases } from "./case-definitions.mjs";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const postmanDir = path.join(repoRoot, "postman");
const dataDir = path.join(postmanDir, "data");
await fs.mkdir(dataDir, { recursive: true });

const sutSecret = "super_secret_key_that_should_not_be_here";
const expiredUserToken = jwt.sign({ id: 2, role: "user", exp: 1 }, sutSecret);
const expiredAdminToken = jwt.sign({ id: 1, role: "admin", exp: 1 }, sutSecret);
const invalidSignatureToken = jwt.sign({ id: 2, role: "user" }, "incorrect_test_secret");

const scriptEvent = (listen, lines) => ({
  listen,
  script: { type: "text/javascript", exec: lines },
});

const jsonBody = (raw) => ({ mode: "raw", raw, options: { raw: { language: "json" } } });
const url = (raw) => ({ raw, host: ["{{baseUrl}}"], path: raw.replace("{{baseUrl}}/", "").split("/") });
const fixtureUrl = (route) => ({ raw: `http://127.0.0.1:3001${route}`, protocol: "http", host: ["127", "0", "0", "1"], port: "3001", path: route.slice(1).split("/") });

const commonAssertions = [
  "pm.test(`[${pm.iterationData.get('id')}] X-Student-Id header is present`, () => {",
  "  pm.expect(pm.request.headers.get('X-Student-Id')).to.eql(pm.environment.get('studentId'));",
  "});",
];

const collectionPreRequest = [
  "const studentId = pm.environment.get('studentId');",
  "pm.request.headers.upsert({ key: 'X-Student-Id', value: studentId });",
  "pm.variables.set('caseId', pm.iterationData.get('id') || 'setup');",
  "pm.variables.set('caseTitle', pm.iterationData.get('title') || 'setup');",
];

const noLeakAssertions = [
  "const rawResponse = pm.response.text();",
  "pm.test(`[${pm.iterationData.get('id')}] response has no stack/database leak`, () => {",
  "  pm.expect(rawResponse).not.to.match(/SQLITE_|node_modules[\\\\/]|TypeError:|ReferenceError:|at .*\\.js:\\d+/i);",
  "});",
];

const resetFolder = {
  name: "Reset Password",
  item: [
    {
      name: "R1 - Register isolated fixture user",
      event: [
        scriptEvent("prerequest", [
          "const domain = pm.iterationData.get('emailDomain') || 'example.com';",
          "const safeId = String(pm.iterationData.get('id')).toLowerCase().replace(/[^a-z0-9]+/g, '.');",
          "const email = `hw06.${safeId}.${pm.info.iteration}.${Date.now()}@${domain}`;",
          "pm.environment.set('resetEmail', email);",
          "pm.environment.set('resetOldPassword', 'OldPass123!');",
        ]),
        scriptEvent("test", [
          ...commonAssertions,
          "pm.test('Reset fixture user was registered', () => pm.expect(pm.response.code).to.be.oneOf([200,201]));",
        ]),
      ],
      request: { method: "POST", header: [{ key: "Content-Type", value: "application/json" }], body: jsonBody('{"name":"HW06 Reset Fixture","email":"{{resetEmail}}","password":"{{resetOldPassword}}"}'), url: url("{{baseUrl}}/api/register") },
    },
    {
      name: "R2 - Issue OTP through the published flow",
      event: [scriptEvent("test", [
        ...commonAssertions,
        "let body = {}; try { body = pm.response.json(); } catch {}",
        "pm.test('OTP issue setup succeeded', () => pm.expect(pm.response.code).to.eql(200));",
        "pm.environment.set('issuedResetToken', String(body.resetToken || ''));",
        "pm.environment.set('activeResetToken', String(body.resetToken || ''));",
      ])],
      request: { method: "POST", header: [{ key: "Content-Type", value: "application/json" }], body: jsonBody('{"email":"{{resetEmail}}"}'), url: url("{{baseUrl}}/api/forgot-password") },
    },
    {
      name: "R3 - Optional set older controlled OTP",
      event: [
        scriptEvent("prerequest", [
          "const mode = pm.iterationData.get('tokenMode');",
          "if (!['old','reissued'].includes(mode)) pm.execution.skipRequest();",
          "pm.environment.set('fixtureResetToken', '111111');",
        ]),
        scriptEvent("test", [...commonAssertions, "pm.test('Older OTP fixture set', () => pm.expect(pm.response.code).to.eql(200));"]),
      ],
      request: { method: "POST", header: [{ key: "Content-Type", value: "application/json" }], body: jsonBody('{"email":"{{resetEmail}}","token":"{{fixtureResetToken}}"}'), url: fixtureUrl("/fixture/reset-token") },
    },
    {
      name: "R4 - Set active controlled six-digit OTP",
      event: [
        scriptEvent("prerequest", [
          "const mode = pm.iterationData.get('tokenMode');",
          "const token = mode === 'leadingZero' ? '012345' : (['old','reissued'].includes(mode) ? '222222' : '123456');",
          "pm.environment.set('fixtureResetToken', token);",
          "pm.environment.set('activeResetToken', token);",
        ]),
        scriptEvent("test", [...commonAssertions, "pm.test('Active OTP fixture set', () => pm.expect(pm.response.code).to.eql(200));"]),
      ],
      request: { method: "POST", header: [{ key: "Content-Type", value: "application/json" }], body: jsonBody('{"email":"{{resetEmail}}","token":"{{fixtureResetToken}}"}'), url: fixtureUrl("/fixture/reset-token") },
    },
    {
      name: "R5 - Optional consume OTP before replay",
      event: [
        scriptEvent("prerequest", ["if (pm.iterationData.get('tokenMode') !== 'replay') pm.execution.skipRequest();"]),
        scriptEvent("test", [...commonAssertions, "pm.test('Replay precondition consumed token', () => pm.expect(pm.response.code).to.eql(200));"]),
      ],
      request: { method: "POST", header: [{ key: "Content-Type", value: "application/json" }], body: jsonBody('{"email":"{{resetEmail}}","resetToken":"{{activeResetToken}}","newPassword":"Consumed123!"}'), url: url("{{baseUrl}}/api/reset-password") },
    },
    {
      name: "R6 - TARGET POST /api/reset-password",
      event: [
        scriptEvent("prerequest", [
          "const c = pm.iterationData.toObject();",
          "const email = pm.environment.get('resetEmail');",
          "const active = pm.environment.get('activeResetToken');",
          "const passwordMap = { valid:'NewPass123!', allSpecials:'Aa1@$!%*?&', length7:'Aa1!aaa', noUpper:'lowercase1!', noLower:'UPPERCASE1!', noDigit:'NoDigits!', noSpecial:'NoSpecial1', unlistedSpecial:'HashOnly1#', paddedSpaces:'  NewPass123!  ', internalSpace:'New Pass123!', unicode:'MậtKhẩu123!🙂', large:'Aa1!'+ 'x'.repeat(1100), empty:'', integer:12345678, nul:'Aa1!abc\\u0000def' };",
          "const tokenMap = { active, leadingZero:active, reissued:active, replay:active, old:'111111', wrong:'999999', length5:'12345', length7:'1234567', alpha:'12AB56', empty:'', integer:123456, sqli:\"123456' OR '1'='1\" };",
          "let body = { email, resetToken: tokenMap[c.tokenMode] ?? active, newPassword: passwordMap[c.passwordMode] ?? passwordMap.valid };",
          "if (c.emailMode === 'unregistered') body.email = `missing.${Date.now()}@example.com`;",
          "if (c.emailMode === 'otherRegistered') body.email = 'test@eshop.com';",
          "if (c.emailMode === 'uppercase') body.email = email.toUpperCase();",
          "if (c.emailMode === 'null') body.email = null; if (c.emailMode === 'empty') body.email = ''; if (c.emailMode === 'integer') body.email = 123; if (c.emailMode === 'sqli') body.email = \"' OR 1=1 --\";",
          "if (c.emailMode === 'missing') delete body.email;",
          "if (c.tokenMode === 'null') body.resetToken = null; if (c.tokenMode === 'missing') delete body.resetToken;",
          "if (c.passwordMode === 'null') body.newPassword = null; if (c.passwordMode === 'missing') delete body.newPassword;",
          "if (c.extraProperty) body.isAdmin = true;",
          "pm.environment.set('targetNewPassword', typeof body.newPassword === 'string' ? body.newPassword : '');",
          "pm.request.method = c.method || 'POST';",
          "pm.request.headers.upsert({key:'Content-Type', value:c.contentType || 'application/json'});",
          "pm.request.body.raw = c.rawBody || JSON.stringify(body);",
        ]),
        scriptEvent("test", [
          ...commonAssertions,
          ...noLeakAssertions,
          "const outcome = pm.iterationData.get('outcome');",
          "let responseJson = {}; try { responseJson = pm.response.json(); } catch {}",
          "if (outcome === 'ACCEPT') pm.test(`[${pm.iterationData.get('id')}] reset request accepted`, () => pm.expect(pm.response.code).to.be.within(200,299));",
          "if (outcome === 'REJECT') pm.test(`[${pm.iterationData.get('id')}] no success response for invalid reset`, () => pm.expect(!(pm.response.code >= 200 && pm.response.code < 300 && /reset successfully/i.test(String(responseJson.message || '')))).to.eql(true));",
          "if (pm.iterationData.get('leakCheck')) pm.test('Reset response omits secrets', () => { pm.expect(responseJson).not.to.have.any.keys('password','reset_token','resetToken'); });",
          "console.log(`HW06_RESULT|reset-password|${pm.iterationData.get('id')}|${outcome}|${pm.response.code}|${pm.response.text().slice(0,180)}`);",
        ]),
      ],
      request: { method: "POST", header: [{ key: "Content-Type", value: "application/json" }], body: jsonBody("{}"), url: url("{{baseUrl}}/api/reset-password") },
    },
    {
      name: "R7 - Verify password state through login",
      event: [
        scriptEvent("prerequest", [
          "const outcome = pm.iterationData.get('outcome');",
          "if (outcome === 'OBSERVE') pm.execution.skipRequest();",
          "const password = pm.iterationData.get('tokenMode') === 'replay' ? 'Consumed123!' : (outcome === 'ACCEPT' ? pm.environment.get('targetNewPassword') : pm.environment.get('resetOldPassword'));",
          "pm.request.body.raw = JSON.stringify({email:pm.environment.get('resetEmail'),password});",
        ]),
        scriptEvent("test", [
          ...commonAssertions,
          "pm.test(`[${pm.iterationData.get('id')}] password state matches the normative oracle`, () => pm.expect(pm.response.code).to.eql(200));",
          "if (pm.iterationData.get('leakCheck')) { let loginJson={}; try{loginJson=pm.response.json();}catch{} pm.test('Login response does not disclose stored secrets', () => { pm.expect(loginJson.user || {}).not.to.have.any.keys('password','reset_token','locked_until'); }); }",
        ]),
      ],
      request: { method: "POST", header: [{ key: "Content-Type", value: "application/json" }], body: jsonBody("{}"), url: url("{{baseUrl}}/api/login") },
    },
  ],
};

const couponFolder = {
  name: "Apply Coupon",
  item: [
    {
      name: "C1 - Register isolated coupon user",
      event: [
        scriptEvent("prerequest", [
          "const safeId=String(pm.iterationData.get('id')).toLowerCase().replace(/[^a-z0-9]+/g,'.');",
          "pm.environment.set('couponEmail',`hw06.${safeId}.${pm.info.iteration}.${Date.now()}@example.com`);",
          "pm.environment.set('couponPassword','Coupon123!');",
        ]),
        scriptEvent("test", [...commonAssertions, "let b={};try{b=pm.response.json();}catch{} pm.environment.set('couponUserId',String(b.id||'')); pm.test('Coupon fixture user registered',()=>pm.expect(pm.response.code).to.be.oneOf([200,201]));"]),
      ],
      request: { method: "POST", header: [{ key: "Content-Type", value: "application/json" }], body: jsonBody('{"name":"HW06 Coupon Fixture","email":"{{couponEmail}}","password":"{{couponPassword}}"}'), url: url("{{baseUrl}}/api/register") },
    },
    {
      name: "C2 - Login isolated coupon user",
      event: [scriptEvent("test", [...commonAssertions, "let b={};try{b=pm.response.json();}catch{} pm.environment.set('couponToken',b.token||''); pm.test('Coupon fixture user logged in',()=>pm.expect(pm.response.code).to.eql(200));"])],
      request: { method: "POST", header: [{ key: "Content-Type", value: "application/json" }], body: jsonBody('{"email":"{{couponEmail}}","password":"{{couponPassword}}"}'), url: url("{{baseUrl}}/api/login") },
    },
    {
      name: "C3 - Optional seed special coupon",
      event: [
        scriptEvent("prerequest", [
          "const mode=pm.iterationData.get('seedCoupon'); if(!mode) pm.execution.skipRequest();",
          "const map={inactive:{code:'INACTIVE10',type:'percent',discount_value:10,min_order_amount:0,expired_at:'2099-12-31',is_active:0,max_uses_per_user:1},over100:{code:'OVER100',type:'percent',discount_value:150,min_order_amount:0,expired_at:'2099-12-31',is_active:1,max_uses_per_user:5},tooBig:{code:'TOOBIG',type:'fixed',discount_value:5000,min_order_amount:0,expired_at:'2099-12-31',is_active:1,max_uses_per_user:5}};",
          "pm.request.body.raw=JSON.stringify(map[mode]);",
        ]),
        scriptEvent("test", [...commonAssertions, "pm.test('Special coupon fixture seeded',()=>pm.expect(pm.response.code).to.eql(200));"]),
      ],
      request: { method: "POST", header: [{ key: "Content-Type", value: "application/json" }], body: jsonBody("{}"), url: fixtureUrl("/fixture/coupon") },
    },
    {
      name: "C4 - Optional seed prior coupon usage",
      event: [
        scriptEvent("prerequest", [
          "const count=Number(pm.iterationData.get('usageCount')||0); if(count===0) pm.execution.skipRequest();",
          "pm.request.body.raw=JSON.stringify({code:pm.iterationData.get('code'),user_id:Number(pm.environment.get('couponUserId')),count});",
        ]),
        scriptEvent("test", [...commonAssertions, "pm.test('Coupon usage fixture seeded',()=>pm.expect(pm.response.code).to.eql(200));"]),
      ],
      request: { method: "POST", header: [{ key: "Content-Type", value: "application/json" }], body: jsonBody("{}"), url: fixtureUrl("/fixture/coupon-usage") },
    },
    {
      name: "C5 - TARGET POST /api/apply-coupon",
      event: [
        scriptEvent("prerequest", [
          "const c=pm.iterationData.toObject(); const self=Number(pm.environment.get('couponUserId'));",
          "pm.request.headers.remove('Authorization');",
          "const auth={valid:`Bearer ${pm.environment.get('couponToken')}`,blank:'Bearer ',malformed:'Bearer abc.def',invalidSignature:`Bearer ${pm.collectionVariables.get('invalidSignatureToken')}`,expired:`Bearer ${pm.collectionVariables.get('expiredUserToken')}`};",
          "if(c.authMode!=='missing') pm.request.headers.add({key:'Authorization',value:auth[c.authMode]||auth.valid});",
          "let code=c.codeMode==='null'?null:(c.codeMode==='array'?['SAVE10']:(c.codeMode==='large'?'A'.repeat(5000):c.code));",
          "let total=c.totalMode==='null'?null:(c.totalMode==='string'?String(c.total):c.total);",
          "let userId=c.userIdMode==='other'?self+999:(c.userIdMode==='sqli'?\"1 OR 1=1\":(c.userIdMode==='string'?String(self):self));",
          "let body={code,total_amount:total,user_id:userId};",
          "if(c.codeMode==='missing') delete body.code; if(c.totalMode==='missing') delete body.total_amount; if(c.userIdMode==='missing') delete body.user_id; if(c.extraProperty) body.admin=true;",
          "pm.environment.set('couponResolvedBody',JSON.stringify(body));",
          "pm.request.body.raw=c.rawBody||JSON.stringify(body);",
        ]),
        scriptEvent("test", [
          ...commonAssertions,
          ...noLeakAssertions,
          "const expected=pm.iterationData.get('outcome'); let b={};try{b=pm.response.json();}catch{}",
          "const hasSuccess=typeof b.discount_amount==='number'&&typeof b.final_amount==='number';",
          "if(expected==='APPLY'){ pm.test(`[${pm.iterationData.get('id')}] coupon applies`,()=>pm.expect(pm.response.code).to.be.within(200,299)); pm.test('Required numeric success fields exist',()=>pm.expect(hasSuccess).to.eql(true)); const ed=pm.iterationData.get('expectedDiscount');const ef=pm.iterationData.get('expectedFinal');if(ed!==undefined)pm.test('discount_amount follows formula',()=>pm.expect(b.discount_amount).to.be.closeTo(Number(ed),0.0001));if(ef!==undefined)pm.test('final_amount follows formula',()=>pm.expect(b.final_amount).to.be.closeTo(Number(ef),0.0001));pm.test('Core formula invariant',()=>pm.expect(b.final_amount).to.be.closeTo(Number(pm.iterationData.get('total'))-b.discount_amount,0.0001));}",
          "if(expected==='REJECT')pm.test(`[${pm.iterationData.get('id')}] coupon is not applied`,()=>pm.expect(hasSuccess).to.eql(false));",
          "if(expected==='SAFE_IDENTITY')pm.test('Body identity cannot produce an unsafe server failure',()=>pm.expect(pm.response.code).to.be.below(500));",
          "const code=pm.iterationData.get('code');const uid=pm.environment.get('couponUserId');pm.sendRequest({url:`http://127.0.0.1:3001/fixture/coupon-usage?code=${encodeURIComponent(code)}&user_id=${uid}`,method:'GET',header:{'X-Student-Id':pm.environment.get('studentId')}},(err,res)=>{if(!err&&pm.iterationData.get('repeatCheck')){const count=res.json().count;pm.test('Apply calculation does not consume usage',()=>pm.expect(count).to.eql(Number(pm.iterationData.get('usageCount')||0)));}});",
          "console.log(`HW06_RESULT|apply-coupon|${pm.iterationData.get('id')}|${expected}|${pm.response.code}|${pm.response.text().slice(0,180)}`);",
        ]),
      ],
      request: { method: "POST", header: [{ key: "Content-Type", value: "application/json" }], body: jsonBody("{}"), url: url("{{baseUrl}}/api/apply-coupon") },
    },
  ],
};

const importFolder = {
  name: "Import Products",
  item: [
    {
      name: "I1 - Login admin fixture",
      event: [scriptEvent("test", [...commonAssertions, "let b={};try{b=pm.response.json();}catch{}pm.environment.set('adminToken',b.token||'');pm.test('Admin login setup succeeded',()=>pm.expect(pm.response.code).to.eql(200));"])],
      request: { method: "POST", header: [{ key: "Content-Type", value: "application/json" }], body: jsonBody('{"email":"{{adminEmail}}","password":"{{adminPassword}}"}'), url: url("{{baseUrl}}/api/login") },
    },
    {
      name: "I2 - Login normal-user fixture",
      event: [scriptEvent("test", [...commonAssertions, "let b={};try{b=pm.response.json();}catch{}pm.environment.set('normalUserToken',b.token||'');pm.test('User login setup succeeded',()=>pm.expect(pm.response.code).to.eql(200));"])],
      request: { method: "POST", header: [{ key: "Content-Type", value: "application/json" }], body: jsonBody('{"email":"{{userEmail}}","password":"{{userPassword}}"}'), url: url("{{baseUrl}}/api/login") },
    },
    {
      name: "I3 - Snapshot product state before target",
      event: [scriptEvent("test", [...commonAssertions, "let b=[];try{b=pm.response.json();}catch{}pm.environment.set('productsBefore',JSON.stringify(b));pm.test('Pre-state snapshot is an array',()=>pm.expect(b).to.be.an('array')); "])],
      request: { method: "GET", header: [], url: url("{{baseUrl}}/api/products") },
    },
    {
      name: "I4 - TARGET POST /api/admin/import-products",
      event: [
        scriptEvent("prerequest", [
          "const c=pm.iterationData.toObject();const suffix=`${c.id}-${pm.info.iteration}-${Date.now()}`;",
          "pm.request.headers.remove('Authorization');const tokens={admin:pm.environment.get('adminToken'),user:pm.environment.get('normalUserToken'),invalidSignature:pm.collectionVariables.get('invalidSignatureToken'),expired:pm.collectionVariables.get('expiredAdminToken'),malformed:'abc.def'};",
          "if(c.authMode!=='missing')pm.request.headers.add({key:'Authorization',value:c.authMode==='blank'?'Bearer ':`Bearer ${tokens[c.authMode]||tokens.admin}`});",
          "const replace=(value)=>{if(typeof value==='string')return value.replaceAll('__CASE__',suffix);if(Array.isArray(value))return value.map(replace);if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,replace(v)]));return value;};",
          "const payload=replace(c.payload||{});const raw=(c.rawBody||JSON.stringify(payload)).replaceAll('__CASE__',suffix);pm.request.body.raw=raw;",
          "const names=Array.isArray(payload.products)?payload.products.filter(Boolean).map(p=>p.name).filter(v=>typeof v==='string'):[];pm.environment.set('expectedImportNames',JSON.stringify(names));",
        ]),
        scriptEvent("test", [
          ...commonAssertions,
          ...noLeakAssertions,
          "const expected=pm.iterationData.get('outcome');let b={};try{b=pm.response.json();}catch{}",
          "if(expected==='COMMIT')pm.test(`[${pm.iterationData.get('id')}] valid batch accepted`,()=>pm.expect(pm.response.code).to.be.within(200,299));",
          "if(['ROLLBACK','REJECT_AT_VALIDATION'].includes(expected))pm.test('Rejected rows have an actionable response',()=>pm.expect(pm.response.text().trim().length).to.be.above(0));",
          "if(expected==='REJECT_BEFORE_PROCESSING')pm.test('Authorization gate rejects request',()=>pm.expect(pm.response.code).to.be.within(400,499));",
          "console.log(`HW06_RESULT|import-products|${pm.iterationData.get('id')}|${expected}|${pm.response.code}|${pm.response.text().slice(0,180)}`);",
        ]),
      ],
      request: { method: "POST", header: [{ key: "Content-Type", value: "application/json" }], body: jsonBody("{}"), url: url("{{baseUrl}}/api/admin/import-products") },
    },
    {
      name: "I5 - Verify atomic database state after target",
      event: [scriptEvent("test", [
        ...commonAssertions,
        "let after=[];try{after=pm.response.json();}catch{}let before=[];try{before=JSON.parse(pm.environment.get('productsBefore')||'[]');}catch{}",
        "const expected=pm.iterationData.get('outcome');const canonical=(rows)=>JSON.stringify([...rows].sort((a,b)=>Number(a.id)-Number(b.id)));",
        "if(expected==='COMMIT'){const delta=Number(pm.iterationData.get('expectedDelta')||0);pm.test(`[${pm.iterationData.get('id')}] all valid rows committed`,()=>pm.expect(after.length-before.length).to.eql(delta));const names=JSON.parse(pm.environment.get('expectedImportNames')||'[]');pm.test('Every expected product name is present',()=>{for(const name of names)pm.expect(after.some(row=>row.name===name)).to.eql(true);});}",
        "if(['ROLLBACK','REJECT_AT_VALIDATION','REJECT_BEFORE_PROCESSING'].includes(expected))pm.test(`[${pm.iterationData.get('id')}] database snapshot is unchanged`,()=>pm.expect(canonical(after)).to.eql(canonical(before)));",
        "console.log(`HW06_STATE|import-products|${pm.iterationData.get('id')}|before=${before.length}|after=${after.length}`);",
      ])],
      request: { method: "GET", header: [], url: url("{{baseUrl}}/api/products") },
    },
  ],
};

const collection = {
  info: {
    _postman_id: "e5f2c574-3cf4-44ad-9061-e90c64328bbb",
    name: "HW06 EShop AI-First API Tests",
    description: "Generated from audited case definitions. The published SUT API remains the test target; localhost fixture endpoints only establish otherwise unreachable preconditions.",
    schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
  },
  event: [scriptEvent("prerequest", collectionPreRequest)],
  variable: [
    { key: "expiredUserToken", value: expiredUserToken },
    { key: "expiredAdminToken", value: expiredAdminToken },
    { key: "invalidSignatureToken", value: invalidSignatureToken },
  ],
  item: [resetFolder, couponFolder, importFolder],
};

await Promise.all([
  fs.writeFile(path.join(postmanDir, "HW06-EShop.postman_collection.json"), JSON.stringify(collection, null, 2)),
  fs.writeFile(path.join(dataDir, "reset-password.json"), JSON.stringify(resetCases, null, 2)),
  fs.writeFile(path.join(dataDir, "apply-coupon.json"), JSON.stringify(couponCases, null, 2)),
  fs.writeFile(path.join(dataDir, "import-products.json"), JSON.stringify(importCases, null, 2)),
  fs.writeFile(path.join(dataDir, "case-counts.json"), JSON.stringify({
    generatedAt: new Date().toISOString(),
    resetPassword: resetCases.length,
    applyCoupon: couponCases.length,
    importProducts: importCases.length,
    total: resetCases.length + couponCases.length + importCases.length,
  }, null, 2)),
]);

console.log(`Generated Postman collection and ${resetCases.length + couponCases.length + importCases.length} executable/audited rows.`);
