import test from "node:test";
import assert from "node:assert/strict";
import {structuredText} from "../lib/structured-text.ts";

test("splits legacy inline bullets into list items",()=>{
  assert.deepEqual(structuredText("-İlk sorumluluk. -İkinci sorumluluk. -Üçüncü sorumluluk."),{
    kind:"list",items:["İlk sorumluluk.","İkinci sorumluluk.","Üçüncü sorumluluk."]
  });
});

test("keeps normal multiline copy as paragraphs",()=>{
  assert.deepEqual(structuredText("İlk paragraf.\nİkinci paragraf."),{
    kind:"paragraphs",items:["İlk paragraf.","İkinci paragraf."]
  });
});
