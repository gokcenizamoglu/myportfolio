import test from "node:test";
import assert from "node:assert/strict";
import {hasCriticalPublicationIssues,healthStatus,type HealthIssue} from "../lib/content-health.ts";

const critical:HealthIssue={code:"missing_core",severity:"critical",kind:"projects",message:"Eksik"};
const warning:HealthIssue={code:"missing_en",severity:"warning",kind:"projects",message:"Eksik"};

test("health score labels use stable thresholds",()=>{
  assert.equal(healthStatus(85),"İçerik iyi durumda");
  assert.equal(healthStatus(60),"Bazı alanlar tamamlanmalı");
  assert.equal(healthStatus(59),"Yayın öncesi düzenleme gerekiyor");
});

test("publication warning only appears for visible content with critical issues",()=>{
  assert.equal(hasCriticalPublicationIssues(true,[critical]),true);
  assert.equal(hasCriticalPublicationIssues(false,[critical]),false);
  assert.equal(hasCriticalPublicationIssues(true,[warning]),false);
});
