// Everything the interface is allowed to show before and after an action.
import assert from "node:assert/strict";
import { test } from "node:test";
import {getScoreRows,getResultSummary,getRuledOutRoutes,correlateEvidence,describeChange,getBeginnerReview,getCoachPrompt,getMapHint,getTrainingPrompt,readyForTheory,readyToCorrelate,resolveMapAction,setCaseTheory,plainLanguage,getDiscriminatingRead,getHypothesisLedger,getHypothesisStanding,getKnownFacts,getModifierBreakdown,getScoreBreakdown,hypothesisSources,playTurn,resolveDecision,resolveResponse,resolveCommand,resolveSetPiece,setHypothesis,attacks,getOutcome,getCounterfactuals,newGame,type Game,scenarioDynamics,getReadingOdds,OWN_SOURCE_BONUS} from "../lib/advanced-game.ts";
import {parseSession,serialiseSession} from "../lib/session.ts";

const baseline=()=>{const g=newGame(0,"operational",()=>0);g.chain=["phish","spray","task","https"];g.established=["endpoint","identity","server","network"];g.injectDeck=[4,7,0,1,2,3,5,6,8];return g;};
let g:Game=baseline();

test("attributes a finding to the source that produced it", () => {
  // A revealed finding names the source that produced it, and the finding itself
  // stays source-neutral so it reads correctly from any of its three sources.
  const soundBase=(()=>{const b=baseline();b.established=[];b.injectDeck=[];return setHypothesis(b,"endpoint");})();
  const sourcedTurn=playTurn(soundBase,"email",18);
  assert.ok(sourcedTurn.turns[0].revealed,"the turn revealed a stage");
  // The finding leads and the attribution follows. "Email investigation at the
  // payment gateway" asserted a location the game had not established — the node
  // is where collection was focused, which is what it now says.
  const narrative=sourcedTurn.turns[0].narrative;
  assert.ok(narrative.startsWith(attacks.find(attack=>attack.id===sourcedTurn.turns[0].revealed)!.evidence),"the finding is stated first, in its own words");
  assert.ok(/Found by email investigation with collection focused on .+\.$/.test(narrative),"then the source and the collection focus, named for what they are");
  assert.ok(!/ at /.test(narrative.split("Found by")[1] ?? ""),"and the node is never presented as the finding's location");
  assert.equal(sourcedTurn.evidence.at(-1)!.detail,attacks.find(item=>item.id===sourcedTurn.turns[0].revealed)!.evidence,"the stored finding keeps its source fields separate from its body");
  for(const attack of attacks)assert.ok(!/^[A-Z][a-z]+ and [a-z]+ records show/.test(attack.evidence),`${attack.id} states a finding, not a log type`);
});

test("reports how the declared reading is holding up", () => {
  // Repeated negative results against the declared reading are surfaced during
  // play, from the player's own record. It must never consult the hidden chain.
  const identitySources=hypothesisSources(baseline(),"identity");
  // A chain none of this reading's sources can expose, so a completed check
  // against it is a genuine empty result rather than a discovery.
  const blindChain=[0,1,2,3].map(stage=>attacks.find(attack=>attack.stage===stage&&!attack.detect.some(source=>identitySources.includes(source)))!.id);
  let standingRun=(()=>{const b=baseline();b.established=[];b.injectDeck=[];b.chain=blindChain;return setHypothesis(b,"identity");})();
  assert.equal(getHypothesisStanding(baseline()).level,"none","no declared reading, nothing under test");
  assert.equal(getHypothesisStanding(standingRun).level,"untested","a fresh reading starts untested");

  // A roll that failed settles nothing about the source, so it must not count
  // against the reading. Absence is only evidence when the check completed.
  const unlucky=playTurn({...standingRun,injectDeck:[]},identitySources[0],1);
  const unluckyStanding=getHypothesisStanding(unlucky);
  assert.equal(unluckyStanding.spent,0,"a failed roll is not a negative result");
  assert.equal(unluckyStanding.inconclusive,1,"it is reported as inconclusive instead");
  assert.equal(unluckyStanding.level,"untested","and it cannot weaken the reading");
  assert.ok(unluckyStanding.detail.includes("settles nothing"),"the player is told why it does not count");

  for(let i=0;i<identitySources.length;i++){
    standingRun=playTurn({...standingRun,injectDeck:[]},identitySources[i],20);
    if(standingRun.pendingDecision)standingRun=resolveDecision(standingRun,"observe");
    if(standingRun.pendingCommand)standingRun=resolveCommand(standingRun,"a");
    if(standingRun.pendingSetPiece)standingRun=resolveSetPiece(standingRun,"a");
  }
  const spentStanding=getHypothesisStanding(standingRun);
  assert.ok(spentStanding.sources>0,"the reading has techniques it could be using at this stage");
  assert.equal(spentStanding.spent,spentStanding.sources,"completed empty checks ruled out every one of them");
  assert.equal(spentStanding.level,"unsupported","a route with nothing left open is poorly supported");
  assert.ok(spentStanding.detail.length>40,"and the reason is stated");
  assert.deepEqual(getHypothesisStanding({...standingRun,chain:["token","role","vault","apikey"]}),spentStanding,"the standing never consults the hidden chain");
  // Crisis re-routes the stage after the one under test, so evidence about the
  // stage under test survives it...
  const reaction=scenarioDynamics[standingRun.scenario].reaction;
  const last=standingRun.turns.length-1;
  const rerouted={...standingRun,turns:standingRun.turns.map((turn,index)=>index===last?{...turn,success:false,adversaryEvent:`Escalation. ${reaction}`}:turn)};
  assert.equal(getReadingOdds(rerouted).stage,0);
  assert.deepEqual(getReadingOdds(rerouted).ruledOutBy,getReadingOdds({...standingRun,turns:standingRun.turns.map((turn,index)=>index===last?{...turn,success:false}:turn)}).ruledOutBy,"a re-route ahead does not erase what was ruled out here");
  // ...and when that later stage becomes the one under test, what was ruled out
  // about it before the re-route no longer stands. A confirmation alone resets nothing.
  const thenConfirmed=(withReroute:boolean)=>({...standingRun,revealed:[standingRun.chain[0]],turns:standingRun.turns.map((turn,index)=>index===last-1?{...turn,success:false,adversaryEvent:withReroute?`Escalation. ${reaction}`:null}:index===last?{...turn,revealed:standingRun.chain[0]}:turn)});
  assert.equal(getReadingOdds(thenConfirmed(true)).stage,1);
  assert.ok(getReadingOdds(thenConfirmed(false)).ruledOutBy.length>0,"without a re-route, earlier empty checks still rule out techniques at the next stage");
  assert.equal(getReadingOdds(thenConfirmed(true)).ruledOutBy.length,0,"after a re-route that targeted it, they do not");

  // The property the old count lacked: a correct reading survives empty checks
  // from sources that could not have seen its technique. Phishing sits on the
  // compromised-host route and a cloud audit cannot see it, nor any stage here.
  let correct=setHypothesis({...baseline(),injectDeck:[]},"endpoint");
  correct=playTurn(correct,"cloud",20);
  assert.equal(correct.revealed.length,0,"the cloud audit completed and found nothing");
  assert.notEqual(getHypothesisStanding(correct).level,"unsupported","a source that could not see the technique does not count against the right reading");
  assert.ok(getReadingOdds(correct).candidates.endpoint.open>0,"its technique is still open");
});

test("calls a route the incident cannot use at this stage poorly supported", () => {
  // A route none of the incident's techniques at the stage under test travels by
  // cannot explain it. It used to read "untested", and a player held it for a
  // whole Crisis operation waiting for a check that could never come.
  let found=0;
  for(let scenario=0;scenario<10;scenario++){
    for(const difficulty of ["training","crisis"] as const){
      const fresh=newGame(scenario,difficulty,()=>0);
      const odds=getReadingOdds(fresh);
      for(const route of ["identity","endpoint","application","cloud"] as const){
        if(odds.candidates[route].total)continue;
        const standing=getHypothesisStanding(setHypothesis(fresh,route));
        assert.equal(standing.level,"unsupported",`${route} has nothing to test in scenario ${scenario}`);
        assert.ok(!/untested/i.test(standing.label));
        found++;
      }
    }
  }
  assert.ok(found>0,"some opening stage leaves a route with nothing to use");
  // The comparison marks the same routes, from the same public record.
  const fresh=newGame(0,"crisis",()=>0);
  assert.deepEqual(getRuledOutRoutes({...fresh,chain:["token","role","vault","apikey"]}),getRuledOutRoutes(fresh),"it never consults the hidden chain");
});

test("asks for a comparison once two findings have confirmed stages", () => {
  // Correlation sits below the map, and no playtest found it unprompted. The
  // prompt appears once there is something worth comparing: two checks that
  // settled nothing say nothing about causation.
  const finding=(id:string,supports:string|null)=>({id,turn:1,title:id,source:"Identity",system:"Admin plane",confidence:"HIGH" as const,supports,detail:"x"});
  const empty={...setHypothesis(baseline(),"identity"),evidence:[finding("E1",null),finding("E2",null)]};
  assert.equal(readyToCorrelate(empty),false,"two empty results are not worth comparing");
  assert.ok(!/compare them/.test(getCoachPrompt(empty,true)));
  const two={...empty,evidence:[finding("E1","phish"),finding("E2","spray")]};
  assert.equal(readyToCorrelate(two),true);
  assert.ok(/compare them/.test(getCoachPrompt(two,true)),"the captain asks for the comparison at any guided difficulty");
  assert.equal(readyToCorrelate(correlateEvidence(two,["E1","E2"],"causal")),false,"and stops once one has been tested");
});

test("offers the case theory and the map when they can help, and not before", () => {
  // Both sit in the reference column and no playtest used either unprompted.
  const declared=setHypothesis(baseline(),"identity");
  assert.equal(readyForTheory(declared),false,"with nothing confirmed the objective cannot be assessed");
  const twoStages={...declared,revealed:declared.chain.slice(0,2)};
  assert.equal(readyForTheory(twoStages),true,"two confirmed stages make it assessable");
  assert.ok(/case theory/.test(getCoachPrompt(twoStages,true)));
  assert.equal(getTrainingPrompt({...twoStages,difficulty:"training"},true)?.step,"theory","Training names the step");
  assert.equal(readyForTheory(setCaseTheory(twoStages,"exfiltration")),false,"and stops once a theory is recorded");
  assert.ok(!/exfiltration|data theft/i.test(getCoachPrompt(twoStages,true)),"the prompt never names the objective");

  // The map is offered early, once, and only while actions remain.
  assert.equal(getMapHint(declared),null,"not on the first turn, before anything has happened");
  const early={...declared,turns:[0,1].map(index=>({...playTurn(declared,"endpoint",2).turns[0],number:index+1}))} as Game;
  assert.ok(/takes no turn/.test(getMapHint(early) ?? ""),"by the second turn the player is told the map costs no turn");
  const node=Object.keys(early.nodePosture)[0];
  assert.equal(getMapHint(resolveMapAction(early,node,"monitor")),null,"a player who has used it is not asked again");
  assert.equal(getMapHint({...early,mapActionsRemaining:0}),null,"nor one with nothing left to spend");
  const late={...early,turns:Array.from({length:5},(_,index)=>({...early.turns[0],number:index+1}))} as Game;
  assert.equal(getMapHint(late),null,"and the offer lapses after the opening turns");
});

test("shows the modifier it will resolve with", () => {
  // The modifier the player is shown before committing is the computation the roll
  // resolves with — all of it. Nothing hidden is added afterwards.
  const previewBase=(()=>{const b=baseline();b.established=["endpoint"];b.nextModifier=1;return b;})();
  for(const plan of [{scope:"focused",intensity:"balanced"},{scope:"enterprise",intensity:"exhaustive"},{scope:"focused",intensity:"rapid"}] as const){
    for(const procedure of ["endpoint","identity","dns"]){
      const preview=getModifierBreakdown(previewBase,procedure,plan);
      const resolved=playTurn(previewBase,procedure,10,plan).turns[0];
      assert.equal(preview.total,resolved.modifier,`${procedure}/${plan.scope}/${plan.intensity} preview matches resolution`);
      assert.equal(preview.parts.find(part=>part.label==="Own source")?.value,resolved.planningBonus,"the planning bonus is the previewed own-source part");
    }
  }
  // Every term the resolution can apply is named in the preview.
  assert.deepEqual(getModifierBreakdown(previewBase,"endpoint").parts.map(part=>part.label),
    ["Established","Own source","Carried","Persistence","Specialist","Focus","Focused","Balanced","Expert mode"]);
  // The own-source bonus follows the declared reading, not the hidden route, so
  // it reads the same whatever the chain is.
  const declared=setHypothesis(previewBase,"identity");
  assert.equal(getModifierBreakdown(declared,"identity").parts.find(part=>part.label==="Own source")?.value,OWN_SOURCE_BONUS,"a declared reading's own source earns the bonus");
  assert.equal(getModifierBreakdown(declared,"endpoint").parts.find(part=>part.label==="Own source")?.value,0,"a source it does not predict does not");
  assert.deepEqual(getModifierBreakdown({...declared,chain:["token","role","vault","apikey"]},"identity"),getModifierBreakdown(declared,"identity"),"and the preview never consults the hidden chain");
  assert.equal(getModifierBreakdown({...previewBase,mode:"expert"},"identity").parts.find(part=>part.label==="Expert mode")?.value,-1);

  // Two failed rolls in a row is variance. The bonus that answers it is read from
  // the player's own record, shown before the action, and gone once one lands.
  const persistence=(game:Game)=>getModifierBreakdown(game,"endpoint").parts.find(part=>part.label==="Persistence")!.value;
  const sample=playTurn(previewBase,"identity",10).turns[0];
  const failed=(number:number,success:boolean)=>({...sample,number,success});
  assert.equal(persistence(previewBase),0,"no failures, no bonus");
  assert.equal(persistence({...previewBase,turns:[failed(1,false)]}),0,"one failure is not yet a run");
  assert.equal(persistence({...previewBase,turns:[failed(1,false),failed(2,false)]}),2,"two in a row earns it");
  assert.equal(persistence({...previewBase,turns:[failed(1,false),failed(2,false),failed(3,true)]}),0,"a success clears it");
  assert.equal(persistence({...previewBase,turns:[failed(1,true),failed(2,false),failed(3,false)]}),2,"and it counts back only to the last success");

  // The pre-action read is built from declared state only. Rewriting the hidden
  // chain underneath it must not change a single word of it.
  const readBase=(()=>{const b=baseline();return setHypothesis(b,"identity");})();
  const readA=getDiscriminatingRead(readBase,"identity");
  const readB=getDiscriminatingRead({...readBase,chain:["token","role","vault","apikey"]},"identity");
  assert.deepEqual(readA,readB,"the read never consults the hidden chain");
  assert.equal(readA.level,"high","a source the declared hypothesis predicts tests that hypothesis");
  assert.equal(getDiscriminatingRead(readBase,"server").level,"moderate","a source it does not predict collects without testing");
  assert.equal(getDiscriminatingRead(baseline(),"identity").level,"broad","with no hypothesis declared nothing is under test");
  const checkedRun=playTurn({...readBase,injectDeck:[]},"dns",20);
  assert.equal(getDiscriminatingRead(checkedRun,"dns").spent,1,"a completed check that found nothing is counted");
  assert.equal(getDiscriminatingRead(checkedRun,"dns").inconclusive,0);
  const failedRun=playTurn({...readBase,injectDeck:[]},"dns",1);
  assert.equal(getDiscriminatingRead(failedRun,"dns").spent,0,"a failed roll is not a result");
  assert.equal(getDiscriminatingRead(failedRun,"dns").inconclusive,1,"it is reported as an inconclusive attempt");
  assert.ok(getDiscriminatingRead(failedRun,"dns").detail.includes("settles nothing"));

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

test("speaks plainly to a player who is new to the subject", () => {
  // A bare signed number leaves a beginner guessing which way is good.
  assert.equal(describeChange("impact", 4), "Impact +4 worse");
  assert.equal(describeChange("continuity", 4), "Continuity +4 better");
  assert.equal(describeChange("sector", -4), "Sector confidence −4 worse");
  assert.equal(describeChange("objective", -2), "Actor progress −2 better");
  assert.equal(describeChange("impact", 0), "Impact unchanged");
  for (const meter of ["impact", "continuity", "sector", "objective"]) {
    for (const value of [-3, 3]) {
      const text = describeChange(meter, value);
      assert.ok(/better|worse/.test(text), `${meter} ${value} says which way it goes`);
    }
  }

  // Every term a playtest reported needing translated has a translation, and
  // none of them explains the term with itself.
  assert.ok(Object.keys(plainLanguage).length >= 10);
  for (const [term, meaning] of Object.entries(plainLanguage) as [string, string][]) {
    assert.ok(meaning.length > 30, `${term} is actually explained`);
    assert.ok(!meaning.toLowerCase().startsWith(term.toLowerCase()), `${term} is not defined by restating itself`);
  }

  // The review leads with four plain sentences, and it names the gap the player
  // actually left rather than the first one in the list.
  const run = baseline();
  run.evidence = [
    { id: "E1", turn: 1, title: "Initial access", source: "Email", system: "User access", confidence: "HIGH", supports: "phish", detail: "A" },
    { id: "E2", turn: 2, title: "Movement", source: "Identity", system: "Admin plane", confidence: "HIGH", supports: "spray", detail: "B" },
  ];
  const uncorrelated = getBeginnerReview(run);
  for (const line of [uncorrelated.strength, uncorrelated.gap, uncorrelated.concept, uncorrelated.next]) {
    assert.ok(line.length > 30, "every line says something");
  }
  assert.ok(/never tested how any two/.test(uncorrelated.gap), "it names the correlation that was never tested");
  const correlated = getBeginnerReview(correlateEvidence(run, ["E1", "E2"], "causal"));
  assert.notEqual(correlated.gap, uncorrelated.gap, "and moves on once the player has done it");

  // A run can pick good sources and still label the route wrong. Telling that
  // player nothing stands out contradicts the score they are about to read.
  // A completed response and a tested correlation, so the branches ahead of the
  // hypothesis reading are all satisfied and it is the reading being judged.
  const clean = (() => {
    const b = baseline();
    b.correlations = [{ id: "C1", turn: 2, evidence: ["E1", "E2"], assessment: "causal", correct: true, verdict: "x" }] as never;
    b.responseScore = 50;
    return b;
  })();
  const oneTurn = playTurn(baseline(), "endpoint", 20).turns[0];
  const graded = (matched: boolean[]) => getBeginnerReview({
    ...clean,
    turns: matched.map((hypothesisMatched, index) => ({
      ...oneTurn, number: index + 1, hypothesis: "identity", hypothesisTarget: "phish", hypothesisMatched, success: true, revealed: "phish",
    })),
  });
  assert.ok(/only 3 of 5 turns/.test(graded([true, true, true, false, false]).gap), "a partly correct reading is named, not waved through");
  assert.ok(/separate skills/.test(graded([true, true, true, false, false]).concept), "and the two skills are told apart");
  assert.ok(/Nothing stands out/.test(graded([true, true, true]).gap), "while a clean record still gets the all-clear");
});

test("restates what the player has been told without adding to it", () => {
  // Operational takes the training aid away, so this panel is all a newcomer has
  // in front of them. It may only repeat the briefing and their own findings.
  const start = baseline();
  const opening = getKnownFacts(start);
  assert.ok(opening.timeline.length > 10, "the incident timeline is restated");
  assert.equal(opening.observations.length, 1, "observations arrive at the pace the captain releases them");
  assert.deepEqual(opening.confirmed, [], "and nothing is confirmed before a stage is found");
  assert.equal(opening.unverified, null, "the unverified signal waits until the captain offers it");
  assert.deepEqual(getKnownFacts({ ...start, chain: ["token", "role", "vault", "apikey"] }), opening, "it never consults the hidden chain");

  const found = playTurn((() => { const b = baseline(); b.injectDeck = []; return b; })(), "endpoint", 20);
  const after = getKnownFacts(found);
  assert.deepEqual(after.confirmed, [attacks.find(attack => attack.id === found.revealed[0])!.title], "a confirmed stage is named once it is revealed");
  for (const title of after.confirmed) {
    assert.ok(found.revealed.some(id => attacks.find(attack => attack.id === id)!.title === title), "and only stages the player has revealed appear");
  }
});

test("explains a score the player can check against what they saw", () => {
  // A source shared between routes can expose a stage further along than the one
  // under test. That is a find, not a correct prediction, and the record has to
  // say which it was or "no credit" reads as arbitrary.
  const run = (() => { const b = baseline(); b.established = []; b.injectDeck = []; return setHypothesis(b, "identity"); })();
  const windfall = playTurn(run, "identity", 20);
  assert.equal(windfall.turns[0].revealed, "spray", "identity exposed the movement stage");
  assert.notEqual(windfall.turns[0].revealed, windfall.turns[0].hypothesisTarget, "which was not the stage under test");
  assert.equal(windfall.turns[0].windfall, true, "so the turn is recorded as a windfall");
  const row = getHypothesisLedger(windfall)[0];
  assert.ok(row.actualRoute, "the ledger names the route the stage under test actually used");
  assert.ok(row.verdict.includes(row.actualRoute!.toLowerCase()), "and says it in the verdict");
  assert.ok(row.verdict.includes("further along the chain"), "and does not leave the find unexplained");
  assert.equal(row.found, "Internal password spraying");

  // An ordinary turn is not a windfall, and a miss names both routes so the
  // player can see what they got wrong.
  const direct = playTurn(run, "email", 20);
  assert.equal(direct.turns[0].windfall, false);
  const miss = playTurn(setHypothesis(run, "cloud"), "email", 20);
  const missRow = getHypothesisLedger(miss)[0];
  assert.ok(!missRow.matched);
  assert.ok(missRow.verdict.includes("not cloud control-plane abuse"), "the verdict names the prediction that failed");

  // The correlation result states why a sequence is causal. Naming the two
  // systems taught that sharing a node is the reason, which it is not.
  const withEvidence = { ...baseline(), evidence: [
    { id: "E1", turn: 1, title: "Initial access", source: "Email", system: "User access", confidence: "HIGH" as const, supports: "phish", detail: "A" },
    { id: "E2", turn: 2, title: "Movement", source: "Identity", system: "User access", confidence: "HIGH" as const, supports: "spray", detail: "B" },
  ] };
  const causal = correlateEvidence(withEvidence, ["E1", "E2"], "causal").correlations[0];
  assert.equal(causal.correct, true);
  assert.ok(/consecutive stages/.test(causal.finding), "it names stage adjacency as the basis");
  assert.ok(!/across User access and User access/.test(causal.finding), "and never offers the shared system as the reason");

  const unrelated = { ...baseline(), evidence: [
    { id: "E1", turn: 1, title: "Initial access", source: "Email", system: "User access", confidence: "HIGH" as const, supports: "phish", detail: "A" },
    { id: "E2", turn: 2, title: "Noise", source: "Cloud", system: "User access", confidence: "LOW" as const, supports: null, detail: "B" },
  ] };
  const wrong = correlateEvidence(unrelated, ["E1", "E2"], "causal").correlations[0];
  assert.equal(wrong.correct, false);
  assert.ok(/not thereby related/.test(wrong.finding), "a wrong causal call is told why timing and location are not enough");

  assert.ok(plainLanguage["evidence boundary"], "the vocabulary a playtest asked about is translated");
  assert.ok(/consecutive stages|same route/.test(plainLanguage["causal sequence"]), "and the causal rule is stated in the glossary too");
});

test("credits a reading that was wrong but properly tested", () => {
  // Scoring only exact matches made a careful player and a guesser indistinguish-
  // able: measured over 800 operations, sound play and random play both landed
  // around three out of ten while perfect knowledge scored ten. Ruling a reading
  // out is the loop this game teaches, so it earns half a turn's credit.
  const base = (() => { const b = baseline(); b.established = []; b.injectDeck = []; b.chain = ["phish", "spray", "task", "https"]; return b; })();
  const sample = playTurn(base, "endpoint", 20).turns[0];
  const turn = (fields: Partial<typeof sample>) => ({ ...sample, hypothesisTarget: "phish", revealed: null, injectReveal: null, ...fields });
  const score = (turns: typeof sample[]) => getScoreBreakdown({ ...base, turns }).hypothesis;

  const identitySource = hypothesisSources(base, "identity")[0];
  const soundNegative = turn({ hypothesis: "identity", hypothesisMatched: false, success: true, procedure: identitySource });
  const matched = turn({ hypothesis: "endpoint", hypothesisMatched: true, success: true, procedure: "endpoint" });

  assert.equal(score([matched, matched]), 10, "a reading that matched every turn still scores full marks");
  assert.equal(score([soundNegative, matched]), 8, "ruling one reading out and then matching beats matching alone once");
  assert.equal(score([soundNegative, soundNegative]), 3, "but the same reading ruled out twice is credited once");
  assert.equal(score([turn({ hypothesis: "identity", hypothesisMatched: false, success: false, procedure: identitySource })]), 0, "a failed roll settles nothing, so it earns nothing");
  assert.equal(score([turn({ hypothesis: "identity", hypothesisMatched: false, success: true, procedure: "server" })]), 0, "and a source the reading does not predict cannot rule it out");
});

test("pays no credit for testing a reading the record had already excluded", () => {
  // Half credit rewards ruling a reading out. A reading the record had already
  // excluded teaches nothing when tested again, and paying for it let a player
  // cycling readings at random collect credit a sound one did not.
  const start=()=>({...newGame(0,"operational",()=>0),injectDeck:[],established:[],chain:["phish","printqueue","task","backup-out"]});
  const run=(firstSource:string)=>{
    let game=setHypothesis(start(),"application");
    game=playTurn(game,firstSource,20);
    game=setHypothesis(game,"identity");
    game=playTurn(game,"change-review",20);
    assert.equal(game.revealed.length,0,"both checks completed and found nothing");
    return game;
  };
  // Neither first check is one of the application reading's own sources, so
  // neither earns anything itself. An identity audit rules out both identity
  // techniques the first stage could use; a cloud audit rules out neither.
  const excluded=run("identity");
  const open=run("cloud");
  assert.equal(getReadingOdds({...excluded,turns:excluded.turns.slice(0,1),hypothesis:"identity"}).candidates.identity.open,0,"after the audit nothing on the identity route is open");
  assert.ok(getReadingOdds({...open,turns:open.turns.slice(0,1),hypothesis:"identity"}).candidates.identity.open>0,"after the DNS review it still is");
  assert.equal(getScoreBreakdown(excluded).hypothesis,0,"testing an already excluded reading earns nothing");
  assert.ok(getScoreBreakdown(open).hypothesis>0,"testing one still open earns the half credit");
});

test("sums up a result without spoiling the operation", () => {
  // The shareable result carries counts and the challenge code, never a
  // technique, so a friend can play the same code without being told the answer.
  let run=setHypothesis({...baseline(),injectDeck:[]},"identity");
  run=playTurn(run,"identity",20);
  const lost={...run,status:"lost" as const,objectiveProgress:100};
  const lines=getResultSummary(lost);
  assert.ok(/The quiet intrusion/.test(lines[0]),"it names the operation");
  assert.ok(/Operation lost/.test(lines[1])&&/1 of 4 stages confirmed in 1 turn\b/.test(lines[1]),"and what happened, in counts");
  for(const id of lost.chain){
    const title=attacks.find(attack=>attack.id===id)!.title;
    assert.ok(!lines.join(" ").includes(title),`it never names ${title}`);
  }
  assert.equal(lines.length,2,"an ordinary operation has no code to share");
  const seeded=getResultSummary({...lost,seed:4242});
  assert.ok(/BC-\d+-\d+-\d+-\d+-4242-\d{2}/.test(seeded[2]),"a reproducible one carries its challenge code");
});

test("explains each part of the score in the player's own numbers", () => {
  // A bare "7/25" read as a verdict with no way to do better.
  let run=setHypothesis({...baseline(),injectDeck:[]},"identity");
  for(const id of ["identity","firewall","cloud","hunt","email","network"]){
    run=playTurn({...run,impact:20,objectiveProgress:10},id,2);
    if(run.pendingSetPiece)run=resolveSetPiece(run,"b");
    if(run.pendingCommand)run=resolveCommand(run,"b");
  }
  const rows=getScoreRows(run);
  const breakdown=getScoreBreakdown(run);
  assert.equal(rows.reduce((sum,row)=>sum+row.value,0),breakdown.total,"the rows add up to the score");
  assert.equal(rows.reduce((sum,row)=>sum+row.maximum,0),100);
  assert.ok(rows.find(row=>row.label==="Investigation")!.rule.includes("You took 6 turns"),"the turn rule uses the player's count");
  assert.ok(/not reached/.test(rows.find(row=>row.label==="Containment & recovery")!.rule),"an unreached response says why it scored nothing");
});
