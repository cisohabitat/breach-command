// The saved-session contract: what migrates, and what is refused.
import assert from "node:assert/strict";
import { test } from "node:test";
import {newGame,attacks,procedures,scenarios,infrastructureTopologies} from "../lib/advanced-game.ts";
import {parseSession,SESSION_VERSION} from "../lib/session.ts";


test("refuses a save that no playthrough could produce", () => {
  // A save is plain text on the device: anything that could not have come out of
  // a real playthrough is refused rather than migrated into the engine.
  const sound=newGame(0,"operational",()=>0);
  const tampered=(over:Record<string,unknown>)=>parseSession(JSON.stringify({version:SESSION_VERSION,savedAt:new Date().toISOString(),game:{...sound,...over},guided:true,fastResolve:false}));
  assert.equal(tampered({status:"response",revealed:[]}),null,"the response phase cannot be entered with stages unrevealed");
  assert.equal(tampered({status:"transcendent"}),null,"an unknown status is refused");
  assert.equal(tampered({revealed:"all"}),null,"a malformed reveal list is refused");
  assert.equal(parseSession(JSON.stringify({version:SESSION_VERSION+1,savedAt:"",game:sound,guided:true,fastResolve:false})),null,"a save from a newer build is refused");
  assert.equal(tampered({impact:"lots"})?.game.impact,0,"a non-numeric meter falls back to its default");
  assert.equal(tampered({continuity:null})?.game.continuity,100);
  assert.equal(tampered({impact:9999})?.game.impact,100,"a restored meter stays inside its documented range");
  for(const a of attacks){assert.ok(a.detect.length>=3);for(const id of a.detect)assert.ok(procedures.some(p=>p.id===id));}
  for(const s of scenarios){assert.equal(s.choices.length,4);s.choices.forEach((choices,stage)=>choices.forEach(id=>assert.equal(attacks.find(a=>a.id===id)?.stage,stage)));}
});

test("re-keys a restored session to its own topology", () => {
  // A restored session is re-keyed to the incident's own topology, and legacy node
  // ids degrade safely to a normal posture.
  const legacyGame={...newGame(4,"operational",()=>0)};
  legacyGame.focusedNode="admin";
  legacyGame.nodePosture=Object.fromEntries(["user","boundary","service","admin","data"].map(node=>[node,"normal"]));
  const restored=parseSession(JSON.stringify({version:8,savedAt:new Date().toISOString(),game:legacyGame,guided:true,fastResolve:false}));
  assert.ok(restored);
  assert.deepEqual(Object.keys(restored!.game.nodePosture).sort(),infrastructureTopologies[4].nodes.map(n=>n.id).sort(),"restored posture matches the cloud topology");
  assert.ok(infrastructureTopologies[4].nodes.some(n=>n.id===restored!.game.focusedNode),"restored focus lands on a real node");
});
