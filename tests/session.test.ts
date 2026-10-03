// The saved-session contract: what migrates, and what is refused.
import assert from "node:assert/strict";
import { test } from "node:test";
import {newGame,attacks,procedures,sectorProcedures,scenarios,infrastructureTopologies} from "../lib/advanced-game.ts";
import {parseSession,serialiseSession,sessionFromNewerBuild,SESSION_VERSION} from "../lib/session.ts";
import {clearTelemetry,emptyTelemetry,readTelemetry,recordTelemetry} from "../lib/telemetry.ts";


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
  // A technique's detect list may name the shared procedures or a sector's own
  // one, so validate against both rather than the shared set alone.
  const everyProcedure=new Set([...procedures.map(p=>p.id),...sectorProcedures.map(p=>p.id)]);
  for(const a of attacks){assert.ok(a.detect.length>=3);for(const id of a.detect)assert.ok(everyProcedure.has(id),`${a.id} names a real procedure: ${id}`);}
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

test("refuses names the game does not have and settles a finished save", () => {
  const sound=newGame(0,"operational",()=>0);
  const tampered=(over:Record<string,unknown>,version:unknown=SESSION_VERSION)=>parseSession(JSON.stringify({version,savedAt:new Date().toISOString(),game:{...sound,...over},guided:true,fastResolve:false}));
  assert.equal(tampered({},"99"),null,"a version that is not a number is refused rather than read as current");
  assert.equal(tampered({chain:["phish","spray","task","nonsense"]}),null,"an unknown technique is refused");
  assert.equal(tampered({revealed:["nonsense"]}),null,"a revealed stage must be in the chain");
  assert.equal(tampered({objective:"conquest"}),null,"an unknown objective is refused before a screen looks it up");
  assert.equal(tampered({mode:"arcade"}),null);
  assert.equal(tampered({specialist:"wizard"}),null);
  assert.equal(tampered({status:"won"}),null,"a win needs a confirmed chain and a completed response");
  assert.equal(tampered({status:"response",revealed:[...sound.chain],responseChoices:["a","b","c"]}),null,"a response with nothing left to choose is refused");
  const lostWithDecision=tampered({status:"lost",revealed:[sound.chain[0]],pendingDecision:sound.chain[0]});
  assert.ok(lostWithDecision,"a finished save is still readable");
  assert.equal(lostWithDecision!.game.pendingDecision,null,"but holds no decision nothing will accept");
  assert.ok(parseSession(serialiseSession(sound,true,false)),"an ordinary save still round-trips");
  // A newer build's save is told apart from a damaged one, so it is kept.
  const newer=JSON.stringify({version:SESSION_VERSION+1,savedAt:"",game:sound,guided:true,fastResolve:false});
  assert.equal(parseSession(newer),null);
  assert.equal(sessionFromNewerBuild(newer),true,"a save from a newer build is recognised as one");
  assert.equal(sessionFromNewerBuild("{broken"),false);
  assert.equal(sessionFromNewerBuild(serialiseSession(sound,true,false)),false);
});

test("keeps the local balance record honest", () => {
  // A minimal in-memory store, so the record can be written and read back.
  const store=new Map<string,string>();
  (globalThis as {localStorage?:unknown}).localStorage={getItem:(key:string)=>store.get(key)??null,setItem:(key:string,value:string)=>void store.set(key,value),removeItem:(key:string)=>void store.delete(key)};
  try{
    assert.notEqual(emptyTelemetry(),emptyTelemetry(),"every empty record is a new one");
    recordTelemetry("start",{scenario:3});recordTelemetry("win");recordTelemetry("loss");recordTelemetry("exercise");
    const counted=readTelemetry();
    assert.deepEqual([counted.operationsStarted,counted.operationsFinished,counted.wins,counted.losses,counted.exercises],[1,3,1,1,1],"an exercise is counted apart from a loss");
    clearTelemetry();
    assert.deepEqual(readTelemetry(),emptyTelemetry(),"a cleared record shows nothing, not the totals it had");
    store.set("breach-command.balance","{broken");
    assert.deepEqual(readTelemetry(),emptyTelemetry());
  }finally{
    delete (globalThis as {localStorage?:unknown}).localStorage;
  }
  // With no storage at all the record stays empty rather than accumulating on a shared default.
  recordTelemetry("start",{scenario:1});recordTelemetry("start",{scenario:1});
  assert.deepEqual(readTelemetry(),emptyTelemetry());
});
