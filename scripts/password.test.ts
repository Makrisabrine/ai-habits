// npx tsx scripts/password.test.ts
import assert from "node:assert/strict";
import { passwordError } from "../lib/password";

assert.equal(passwordError("Abcdef1!"), null);
assert.match(passwordError("abc")!, /8 caractères/);
assert.match(passwordError("abcdefg1!")!, /majuscule/);
assert.match(passwordError("ABCDEFG1!")!, /minuscule/);
assert.match(passwordError("Abcdefgh!")!, /chiffre/);
assert.match(passwordError("Abcdefg12")!, /spécial/);
console.log("password rules ok");
