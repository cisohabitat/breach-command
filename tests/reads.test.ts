// Everything the interface is allowed to show before and after an action.
import assert from "node:assert/strict";
import { test } from "node:test";
import {getDiscriminatingRead,getHypothesisLedger,getHypothesisStanding,getModifierBreakdown,playTurn,resolveDecision,resolveResponse,resolveCommand,resolveSetPiece,setHypothesis,attacks,hypotheses,getOutcome,getCounterfactuals,newGame,type Game} from "../lib/advanced-game.ts";
import {parseSession,serialiseSession} from "../lib/session.ts";

const baseline=()=>{const g=newGame(0,"operational",()=>0);g.chain=["phish","spray","task","https"];g.established=["endpoint","identity","server","network"];g.injectDeck=[4,7,0,1,2,3,5,6,8];return g;};
let g:Game=baseline();

test("attributes a finding to the source that produced it", () => {
  // A revealed finding names the source that produced it, and the finding itself
  // stays source-neutral so it reads correctly from any of its three sources.
  const soundBase=(()=>{const b=baseline();b.established=[];b.injectDeck=[];return setHypothesis(b,"endpoint");})();
  const sourcedTurn=playTurn(soundBase,"email",18);
  assert.ok(sourcedTurn.turns[0].revealed,"the turn revealed a stage");
  assert.ok(sourcedTurn.turns[0].narrative.startsWith("Email investigation at "),"the report names the procedure and node that produced it");
  assert.equal(sourcedTurn.evidence.at(-1)!.detail,attacks.find(item=>item.id===sourcedTurn.turns[0].revealed)!.evidence,"the stored finding keeps its source fields separate from its body");
  for(const attack of attacks)assert.ok(!/^[A-Z][a-z]+ and [a-z]+ records show/.test(attack.evidence),`${attack.id} states a finding, not a log type`);
});

test("reports how the declared reading is holding up", () => {
  // Repeated negative results against the declared reading are surfaced during
  // play, from the player's own record. It must never consult the hidden chain.
  let standingRun=(()=>{const b=baseline();b.established=[];b.injectDeck=[];return setHypothesis(b,"identity");})();
  assert.equal(getHypothesisStanding(baseline()).level,"none","no declared reading, nothing under test");
  assert.equal(getHypothesisStanding(standingRun).level,"untested","a fresh reading starts untested");
  const identitySources=hypotheses.find(item=>item.id==="identity")!.procedures;
  for(let i=0;i<identitySources.length;i++){
    standingRun=playTurn(standingRun,identitySources[i],2);
    if(standingRun.pendingDecision)standingRun=resolveDecision(standingRun,"observe");
    if(standingRun.pendingCommand)standingRun=resolveCommand(standingRun,"a");
    if(standingRun.pendingSetPiece)standingRun=resolveSetPiece(standingRun,"a");
  }
  const spentStanding=getHypothesisStanding(standingRun);
  assert.equal(spentStanding.spent,identitySources.length,"every source of the reading was spent without result");
  assert.equal(spentStanding.level,"unsupported","a reading whose every source came back empty is poorly supported");
  assert.ok(spentStanding.detail.length>40,"and the reason is stated");
  assert.deepEqual(getHypothesisStanding({...standingRun,chain:["token","role","vault","apikey"]}),spentStanding,"the standing never consults the hidden chain");
  // A confirmation resets the reckoning: the sources spent before it no longer count.
  assert.equal(getHypothesisStanding({...standingRun,turns:standingRun.turns.map((turn,index)=>index===0?{...turn,revealed:"phish"}:turn)}).spent,identitySources.length-1,"only sources spent since the last confirmation count");
});

test("shows the modifier it will resolve with", () => {
  // The modifier the player is shown before committing is the same computation the
  // roll resolves with, minus the one term that must stay hidden.
  const previewBase=(()=>{const b=baseline();b.established=["endpoint"];b.nextModifier=1;return b;})();
  for(const plan of [{scope:"focused",intensity:"balanced"},{scope:"enterprise",intensity:"exhaustive"},{scope:"focused",intensity:"rapid"}] as const){
    for(const procedure of ["endpoint","identity","dns"]){
      const preview=getModifierBreakdown(previewBase,procedure,plan);
      const resolved=playTurn(previewBase,procedure,10,plan).turns[0];
      assert.equal(preview.total,resolved.modifier-resolved.planningBonus,`${procedure}/${plan.scope}/${plan.intensity} preview matches resolution`);
      assert.ok(!preview.parts.some(part=>/hypothesis/i.test(part.label)),"the planning bonus is never shown before the roll");
    }
  }
  // Every term the resolution can apply is named in the preview.
  assert.deepEqual(getModifierBreakdown(previewBase,"endpoint").parts.map(part=>part.label),
    ["Established","Carried","Specialist","Focus","Focused","Balanced","Expert mode"]);
  assert.equal(getModifierBreakdown({...previewBase,mode:"expert"},"identity").parts.find(part=>part.label==="Expert mode")?.value,-1);

  // The pre-action read is built from declared state only. Rewriting the hidden
  // chain underneath it must not change a single word of it.
  const readBase=(()=>{const b=baseline();return setHypothesis(b,"identity");})();
  const readA=getDiscriminatingRead(readBase,"identity");
  const readB=getDiscriminatingRead({...readBase,chain:["token","role","vault","apikey"]},"identity");
  assert.deepEqual(readA,readB,"the read never consults the hidden chain");
  assert.equal(readA.level,"high","a source the declared hypothesis predicts tests that hypothesis");
  assert.equal(getDiscriminatingRead(readBase,"server").level,"moderate","a source it does not predict collects without testing");
  assert.equal(getDiscriminatingRead(baseline(),"identity").level,"broad","with no hypothesis declared nothing is under test");
  const spentRun=playTurn(readBase,"dns",2);
  assert.equal(getDiscriminatingRead(spentRun,"dns").spent,1,"a source spent without exposing a stage is counted");

  // The planning bonus and the hypothesis score answer to the same fact, so a turn
  // that earned the bonus can never be scored as a wrong prediction.
  let ledgerRun=baseline();ledgerRun.established=[];ledgerRun=setHypothesis(ledgerRun,"endpoint");
  ledgerRun=playTurn(ledgerRun,"email",12);
  if(ledgerRun.pendingDecision)ledgerRun=resolveDecision(ledgerRun,"observe");
  for(const turn of ledgerRun.turns)if(turn.planningBonus>0)assert.equal(turn.hypothesisMatched,true,"the planning bonus implies a matched prediction");
  const ledger=getHypothesisLedger(ledgerRun);
  assert.equal(ledger.length,ledgerRun.turns.length,"the ledger accounts for every turn");
  assert.ok(ledger.every(row=>row.verdict.length>20),"every turn is given a reason");
  assert.equal(ledger[0].matched,ledgerRun.turns[0].hypothesisMatched);
  assert.equal(ledger[0].discriminating,ledgerRun.turns[0].discriminating);
  // A restored session keeps the ledger intact.
  const ledgerSaved=parseSession(serialiseSession(ledgerRun,true,false));
  assert.equal(ledgerSaved?.game.turns[0].hypothesisTarget,ledgerRun.turns[0].hypothesisTarget,"the hypothesis test survives a save");
  assert.equal(ledgerSaved?.game.turns[0].hypothesisMatched,ledgerRun.turns[0].hypothesisMatched);
  // A save written before these fields existed degrades to an unscored turn.
  const legacyTurn=parseSession(JSON.stringify({version:11,savedAt:new Date().toISOString(),game:{...ledgerRun,turns:ledgerRun.turns.map(turn=>{const legacy={...turn} as Record<string,unknown>;delete legacy.hypothesisTarget;delete legacy.hypothesisMatched;delete legacy.discriminating;return legacy;})},guided:true,fastResolve:false}));
  assert.equal(legacyTurn?.game.turns[0].hypothesisTarget,null,"a legacy turn carries no hypothesis test");
  assert.equal(legacyTurn?.game.turns[0].hypothesisMatched,false);
  g=baseline();g.revealed=["phish","spray","task"];g=playTurn(g,"network",11);assert.ok(g.pendingDecision);g=resolveDecision(g,"act");assert.equal(g.status,"response");g=resolveResponse(g,"credential");assert.equal(g.status,"response");g=resolveResponse(g,"verify");assert.equal(g.status,"response");g=resolveResponse(g,"rebuild");assert.equal(g.status,"won");assert.ok(getOutcome(g).grade);assert.ok(getCounterfactuals(g).length);
});
