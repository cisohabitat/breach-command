import assert from "node:assert/strict";
import {getDiscriminatingRead,getHypothesisLedger,getHypothesisStanding,getLossReason,getModifierBreakdown,newGame,playTurn,resolveDecision,resolveResponse,resolveCommand,resolveSetPiece,resolveMapAction,correlateEvidence,setInfrastructureFocus,setHypothesis,setCaseTheory,availableIn,attacks,hypotheses,procedures,scenarios,getSuggestion,nextEvidenceSource,guidanceLevel,responseOptions,responseOptionsFor,responseProfiles,decisionChoices,difficulties,infrastructureTopologies,sectorSystems,getOutcome,getCounterfactuals,getDecisionOptions,getAdversaryState,getAttributionRead,getScoreBreakdown,getTurnLimit,attackVector,type DecisionChoice,type Difficulty,type Game,type GameMode,type SpecialistId} from "../lib/advanced-game.ts";
import {parseSession,serialiseSession,SESSION_VERSION} from "../lib/session.ts";
import {adversaryObjectives,modeRandom} from "../lib/command-systems.ts";
import {decodeChallenge,encodeChallenge,seededChallengeRandom,seededRoll} from "../lib/phase8.ts";
import {campaignAct,campaignEnding,defaultCampaign,parseCampaign,recordCampaignResult} from "../lib/campaign.ts";
import {campaignRoutes,incidentVariant,routeForCampaign} from "../lib/phase9.ts";
import {chooseBotAction,type BotAction} from "../lib/game-bot.ts";

const baseline=()=>{const g=newGame(0,"operational",()=>0);g.chain=["phish","spray","task","https"];g.established=["endpoint","identity","server","network"];g.injectDeck=[4,7,0,1,2,3,5,6,8];return g;};
let g=baseline();
let n=playTurn(g,"endpoint",9);
assert.equal(n.turns[0].total,11);assert.equal(n.revealed[0],"phish");assert.equal(n.pendingDecision,"phish");assert.equal(g.turns.length,0);assert.equal(availableIn(n,"endpoint"),3);
assert.throws(()=>playTurn(n,"identity",20),/decision/);
assert.equal(getDecisionOptions(n)?.observe.title,"Trace the access path");
n=resolveDecision(n,"observe");assert.equal(n.nextModifier,2);assert.equal(n.impact,30);assert.equal(n.pendingDecision,null);
n=playTurn(n,"dns",9);assert.equal(n.turns[1].total,12);assert.equal(n.nextModifier,0);n=resolveSetPiece(n,"a");assert.throws(()=>playTurn(n,"endpoint",15),/cooling/);
g=baseline();g=setHypothesis(g,"endpoint");g=playTurn(g,"endpoint",7);assert.equal(g.turns[0].planningBonus,2);assert.equal(g.turns[0].total,11);
g=baseline();g=playTurn(g,"endpoint",20);assert.equal(g.turns[0].inject?.reason,"Natural 20");const oldPivot=g.chain[1];g=resolveDecision(g,"act");assert.equal(g.nextModifier,-1);assert.equal(g.impact,18);assert.notEqual(g.chain[1],oldPivot);assert.ok(g.adversaryEvent);
g=baseline();g=playTurn(g,"email",2);g=playTurn(g,"cloud",2);g=resolveSetPiece(g,"a");g=playTurn(g,"dns",2);assert.equal(g.turns[2].inject?.reason,"Three failed rolls");assert.equal(g.failures,0);assert.ok(g.turns[2].adversaryEvent);assert.ok(g.continuity<100);
g=baseline();g.injectDeck=[2];g=playTurn(g,"endpoint",20);assert.equal(availableIn(g,"endpoint"),0,"restoration override");
g=baseline();g.injectDeck=[3];g=playTurn(g,"endpoint",20);assert.equal(g.revealed.length,2);assert.ok(g.pendingDecision);
// Standing down as an authorised exercise is a conclusion the investigation
// reaches, not one the deck hands it. Below two confirmed stages the controller
// clears part of the activity and the operation continues.
g=baseline();g.injectDeck=[8];g=playTurn(g,"email",20);
assert.equal(g.status,"playing","an early drill draw does not end the operation");
assert.ok(g.turns[0].inject?.effectLabel.includes("authorised"),"the cleared activity is reported");
const drillControl=playTurn({...baseline(),injectDeck:[0]},"email",20);
const drillCleared=playTurn({...baseline(),injectDeck:[8]},"email",20);
assert.ok(drillCleared.impact<drillControl.impact,"clearing part of the activity relieves business pressure");
g=baseline();g.revealed=["phish","spray"];g.injectDeck=[8];g=playTurn(g,"email",20);
assert.equal(g.status,"exercise","two confirmed stages support the drill conclusion");
assert.ok(g.revealed.length>=2,"a drill only concludes on attributed behaviour");

// A drill is not a defeat. It costs no trust, keeps the streak and leaves no
// unresolved access, while a genuine loss still does all three.
const commandRecord={...defaultCampaign,leadershipTrust:60,readiness:60,streak:3};
const drillOperation={...newGame(0,"operational",()=>0),status:"exercise" as const};
const afterDrill=recordCampaignResult(commandRecord,drillOperation,40);
assert.equal(afterDrill.leadershipTrust,60,"a drill does not cost leadership trust");
assert.equal(afterDrill.streak,3,"a drill does not break the streak");
assert.equal(afterDrill.unresolvedThreads,0,"a drill leaves no unresolved access");
assert.ok(afterDrill.readiness>60,"exercising the process builds readiness");
const afterLoss=recordCampaignResult(commandRecord,{...drillOperation,status:"lost"},40);
assert.ok(afterLoss.leadershipTrust<60&&afterLoss.streak===0&&afterLoss.unresolvedThreads===1,"a defeat still costs trust, the streak and an open thread");

// Crisis is a different operation, not the same one with tighter numbers: fewer
// command actions, an objective clock that is already moving and moves faster,
// and an adversary that re-routes on its own beat without being pressed.
const crisisStart=newGame(0,"crisis",()=>0);
const steadyStart=newGame(0,"operational",()=>0);
assert.equal(crisisStart.mapActionsRemaining,2,"crisis spends one fewer command action");
assert.equal(newGame(0,"crisis",()=>0,{mode:"expert"}).mapActionsRemaining,1,"an expert crisis is tighter again");
assert.equal(steadyStart.mapActionsRemaining,3);
assert.ok(crisisStart.objectiveProgress>steadyStart.objectiveProgress,"the crisis objective clock starts moving");
const crisisTurn=playTurn({...crisisStart,chain:["phish","spray","task","https"],established:[],injectDeck:[]},"dns",2);
const steadyTurn=playTurn({...steadyStart,chain:["phish","spray","task","https"],established:[],injectDeck:[]},"dns",2);
assert.ok(crisisTurn.turns[0].objectiveChange>steadyTurn.turns[0].objectiveChange,"crisis advances the objective faster each turn");
const reroute=(difficulty:Difficulty)=>{
  let sim=newGame(0,difficulty,()=>0);sim.chain=["phish","spray","task","https"];sim.established=[];sim.injectDeck=[];
  const opening=[...sim.chain];
  for(const procedure of ["server","dns"]){if(sim.status!=="playing"||sim.pendingDecision||sim.pendingCommand||sim.pendingSetPiece)break;sim=playTurn(sim,procedure,2);}
  return {changed:JSON.stringify(sim.chain)!==JSON.stringify(opening),event:sim.adversaryEvent};
};
assert.equal(reroute("crisis").changed,true,"the crisis adversary re-routes on its escalation beat");
assert.equal(reroute("operational").changed,false,"ordinary difficulties only re-route when the response presses");

// A finished operation holds nothing outstanding. A turn that both reveals a
// stage and crosses a losing threshold used to end the game with the evidence
// decision still pending, which left the report dialog asking for a choice the
// engine refused and no way to reach the review.
const edge=(over:Partial<Game>)=>{const b=baseline();b.established=["endpoint"];b.injectDeck=[];return playTurn({...b,...over} as Game,"email",18);};
for(const [label,over] of [
  ["the adversary finishes its objective",{objectiveProgress:99}],
  ["business impact reaches its limit",{impact:99}],
  ["the fourth stage lands on the final turn",{revealed:["spray","task","https"],objectiveProgress:99,turnLimit:1}],
  ["the window closes on a reveal",{turnLimit:1}],
] as [string,Partial<Game>][]){
  const ended=edge(over);
  assert.ok(["lost","exercise","won"].includes(ended.status),`${label} ends the operation`);
  assert.equal(ended.pendingDecision,null,`${label} leaves no evidence decision owed`);
  assert.equal(ended.pendingCommand,null,`${label} leaves no command event owed`);
  assert.equal(ended.pendingSetPiece,null,`${label} leaves no sector decision owed`);
  assert.throws(()=>resolveDecision(ended,"observe"),/No evidence decision/,`${label} cannot be resolved further`);
}

// The loss banner names the cause, not the investigation window every time.
assert.equal(getLossReason(edge({objectiveProgress:99})).title,"The adversary completed its objective");
assert.equal(getLossReason(edge({impact:99})).title,"Business impact reached its limit");
assert.equal(getLossReason(edge({turnLimit:1})).title,"The investigation window closed");
assert.ok(getLossReason(edge({turnLimit:1})).detail.includes("1 turn."),"the reason counts turns in plain English");
const continuityLoss={...baseline(),continuity:1,established:[],injectDeck:[]} as Game;
assert.equal(getLossReason(playTurn(continuityLoss,"dns",2)).title,"The essential service stopped");
const sectorLoss={...baseline(),sectorHealth:1,established:[],injectDeck:[]} as Game;
assert.equal(getLossReason(playTurn(sectorLoss,"dns",2)).title,"Sector confidence collapsed");

// A sound action the dice refused does not hand the actor tempo it did not earn.
const soundBase=(()=>{const b=baseline();b.established=[];b.injectDeck=[];return setHypothesis(b,"endpoint");})();
const soundFail=playTurn(soundBase,"endpoint",2);
assert.ok(soundFail.turns[0].planningBonus>0,"the action was aligned with a correct prediction");
assert.equal(soundFail.turns[0].success,false,"and the roll still failed");
assert.equal(soundFail.adversaryTempo,soundBase.adversaryTempo,"a sound but unlucky action does not accelerate the actor");
const looseFail=playTurn({...soundBase,hypothesis:"cloud"} as Game,"endpoint",2);
assert.equal(looseFail.adversaryTempo,soundBase.adversaryTempo+1,"an unaligned failure still does");
assert.ok(soundFail.turns[0].objectiveChange<looseFail.turns[0].objectiveChange,"and the objective barely moves");

// A revealed finding names the source that produced it, and the finding itself
// stays source-neutral so it reads correctly from any of its three sources.
const sourcedTurn=playTurn(soundBase,"email",18);
assert.ok(sourcedTurn.turns[0].revealed,"the turn revealed a stage");
assert.ok(sourcedTurn.turns[0].narrative.startsWith("Email investigation at "),"the report names the procedure and node that produced it");
assert.equal(sourcedTurn.evidence.at(-1)!.detail,attacks.find(item=>item.id===sourcedTurn.turns[0].revealed)!.evidence,"the stored finding keeps its source fields separate from its body");
for(const attack of attacks)assert.ok(!/^[A-Z][a-z]+ and [a-z]+ records show/.test(attack.evidence),`${attack.id} states a finding, not a log type`);

// Every assessed objective explains what its outbound stage is for, so a chain
// ending in exfiltration never looks disconnected from the intent behind it.
for(const [id,objective] of Object.entries(adversaryObjectives))assert.ok(objective.outbound.length>=80,`${id} explains its outbound stage`);

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

// Campaign standing changes what an operation has to work with, and a command
// that keeps losing does not reach the same tier as one that keeps winning.
const profile=(over:object)=>newGame(0,"operational",()=>0,{mode:"campaign",...over});
const recruit=profile({campaignTier:0,readiness:50,leadershipTrust:50,unresolvedThreads:0});
const decorated=profile({campaignTier:3,readiness:90,leadershipTrust:90,unresolvedThreads:0});
const struggling=profile({campaignTier:1,readiness:20,leadershipTrust:25,unresolvedThreads:5});
assert.ok(decorated.turnLimit>recruit.turnLimit&&recruit.turnLimit>struggling.turnLimit,"readiness moves the investigation window both ways");
assert.ok(decorated.established.length>recruit.established.length,"seniority establishes more evidence sources");
assert.ok(decorated.mapActionsRemaining>recruit.mapActionsRemaining,"seniority buys a command action");
assert.ok(struggling.mapActionsRemaining<recruit.mapActionsRemaining,"lost leadership trust costs one");
assert.ok(struggling.impact>recruit.impact&&struggling.objectiveProgress>recruit.objectiveProgress,"unresolved access is carried into the next operation");
assert.ok(struggling.adversaryTempo>recruit.adversaryTempo,"past three open threads the actor opens with tempo");
assert.equal(decorated.graceRemaining,1,"rapid coordination absorbs one unlucky action");
assert.equal(recruit.graceRemaining,0);
// The grace is spent once and only on an action that was not already protected.
const graced=playTurn({...decorated,chain:["phish","spray","task","https"],established:[],injectDeck:[],hypothesis:null} as Game,"dns",2);
assert.equal(graced.graceRemaining,0,"the grace is consumed");
assert.equal(graced.adversaryTempo,decorated.adversaryTempo,"and the actor takes no tempo for that action");
const afterGrace=playTurn(graced,"cloud",2);
assert.ok(afterGrace.adversaryTempo>graced.adversaryTempo,"the next unlucky action costs as usual");
// Seniority follows results.
const record={...defaultCampaign,leadershipTrust:60,readiness:60,streak:2};
const base=newGame(0,"operational",()=>0);
const wonXp=recordCampaignResult(record,{...base,status:"won"},70).xp;
const lostXp=recordCampaignResult(record,{...base,status:"lost"},70).xp;
const drillXp=recordCampaignResult(record,{...base,status:"exercise"},70).xp;
assert.ok(wonXp>drillXp&&drillXp>lostXp,"a win outranks a drill, and a drill outranks a defeat");
assert.ok(lostXp>0,"a defeat still teaches something");

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
g=baseline();for(let i=0;i<14&&g.status==="playing";i++){if(g.pendingSetPiece){g=resolveSetPiece(g,"a");continue;}if(g.pendingCommand){g=resolveCommand(g,"a");continue;}const action=nextEvidenceSource(g);assert.ok(action);g=playTurn(g,action.id,2);}assert.equal(g.status,"lost");
assert.equal(getAdversaryState(newGame(0,"crisis",()=>0)),"Maneuvering");assert.equal(difficulties.crisis.maxTurns,9);
assert.throws(()=>playTurn(baseline(),"unknown",10),/Unknown/);assert.throws(()=>playTurn(baseline(),"endpoint",21),/Invalid/);assert.throws(()=>newGame(-1),/Unknown/);
const ironman=newGame(0,"operational",()=>0,{mode:"ironman",specialist:"forensics"});assert.equal(getTurnLimit(ironman),difficulties.operational.maxTurns-1);
const escalation=newGame(0,"operational",()=>0,{mode:"escalation",specialist:"hunter"});assert.ok(escalation.impact>newGame(0,"operational",()=>0).impact);assert.ok(escalation.objectiveProgress>5);
const dailyA=newGame(4,"operational",modeRandom("daily",4,new Date("2026-09-18T00:00:00Z")),{mode:"daily"});
const dailyB=newGame(4,"operational",modeRandom("daily",4,new Date("2026-09-18T23:59:00Z")),{mode:"daily"});assert.deepEqual(dailyA.chain,dailyB.chain);
let specialistGame=newGame(0,"operational",()=>0,{specialist:"forensics"});specialistGame.chain=["phish","spray","task","https"];specialistGame.established=[];specialistGame=playTurn(specialistGame,"endpoint",8, {scope:"focused",intensity:"exhaustive"});assert.equal(specialistGame.turns[0].specialistBonus,1);assert.ok(specialistGame.specialistFatigue>0);assert.ok(availableIn(specialistGame,"endpoint")>3);

g=baseline();g.established=[];g=setInfrastructureFocus(g,"service");g=playTurn(g,"server",10);assert.equal(g.turns[0].modifier,1,"infrastructure focus adds one to aligned procedures");
g=baseline();g=resolveMapAction(g,"boundary","monitor");assert.equal(g.nodePosture.boundary,"monitored");assert.equal(g.mapActionsRemaining,2);assert.equal(g.nextModifier,2);g=resolveMapAction(g,"service","isolate");assert.equal(g.nodePosture.service,"isolated");assert.ok(g.continuity<100);
g=baseline();g=playTurn(g,"email",12);if(g.pendingDecision)g=resolveDecision(g,"observe");g=playTurn(g,"cloud",12);if(g.pendingDecision)g=resolveDecision(g,"observe");assert.ok(g.pendingSetPiece);g=resolveSetPiece(g,"a");assert.equal(g.setPieceHistory.length,1);assert.equal(g.pendingSetPiece,null);
g=baseline();g.evidence=[
  {id:"E1",turn:1,title:"Initial access",source:"Email",system:"User access",confidence:"HIGH",supports:"phish",detail:"A"},
  {id:"E2",turn:2,title:"Movement",source:"Identity",system:"Admin plane",confidence:"HIGH",supports:"spray",detail:"B"},
];
g=correlateEvidence(g,["E1","E2"]);assert.equal(g.correlations[0].valid,true);assert.equal(g.nextModifier,2);
g=baseline();g.evidence=[
  {id:"E1",turn:1,title:"Initial access",source:"Email",system:"User access",confidence:"HIGH",supports:"phish",detail:"A"},
  {id:"E2",turn:2,title:"Unrelated exception",source:"Cloud",system:"Admin plane",confidence:"MODERATE",supports:null,detail:"B"},
];
g=correlateEvidence(g,["E1","E2"],"causal");assert.equal(g.correlations[0].correct,false);assert.equal(g.impact,26);
assert.equal(getAttributionRead(baseline()).title,"Unknown operator");
const attributed=baseline();attributed.revealed=[...attributed.chain];assert.equal(getAttributionRead(attributed).confidence,"ATTRIBUTED");
const challenge=encodeChallenge({scenario:4,difficulty:"crisis",mode:"expert",specialist:"identity",seed:74219});assert.deepEqual(decodeChallenge(challenge),{scenario:4,difficulty:"crisis",mode:"expert",specialist:"identity",seed:74219});assert.equal(decodeChallenge(challenge.replace(/\d{2}$/, "00")),null);assert.deepEqual([seededChallengeRandom(7)(10),seededChallengeRandom(7)(10)],[8,8]);
assert.equal(campaignAct(0).number,1);assert.equal(campaignAct(7).number,3);assert.equal(campaignEnding({...defaultCampaign,completed:[0,1,2,3,4,5,6,7,8,9],leadershipTrust:80,readiness:80})?.title,"Collective resilience");
assert.equal(routeForCampaign({...defaultCampaign,completed:[0,1],commandPosture:{observe:4,act:0}}),"watchtower");
assert.equal(campaignRoutes.breakwater.scenarios.length,3);assert.equal(incidentVariant(0,"common-ground",17).id,"0-2");
assert.deepEqual(parseCampaign("{}").specialistBonds,{});assert.deepEqual(parseCampaign("{}").routeHistory,[]);

g=baseline();g=setCaseTheory(g,"espionage");assert.equal(g.caseTheory,"espionage");assert.equal(g.caseTheoryHistory.length,1);
const variant=incidentVariant(3,"breakwater",42);g=newGame(3,"operational",()=>0,{campaignRoute:"breakwater",variant});assert.equal(g.variant.id,variant.id);assert.equal(g.campaignRoute,"breakwater");assert.ok(g.continuity<100);

g=baseline();
g=setHypothesis(g,"endpoint");
g=setHypothesis(g,"identity");
g=setHypothesis(g,"cloud");
assert.equal(g.hypothesisHistory.length,1,"only the final hypothesis for a turn is recorded");
assert.equal(g.hypothesisHistory[0].id,"cloud");
const scoreBefore=getScoreBreakdown(g).hypothesis;
for(let i=0;i<20;i++)g=setHypothesis(g,i%2?"identity":"cloud");
assert.equal(g.hypothesisHistory.length,1,"hypothesis switching cannot inflate history");
assert.equal(getScoreBreakdown(g).hypothesis,scoreBefore,"hypothesis switching cannot inflate score");

g=baseline();
g=setHypothesis(g,"endpoint");
g=playTurn(g,"endpoint",8);
const saved=parseSession(serialiseSession(g,true,true));
assert.ok(saved);
assert.equal(saved?.version,SESSION_VERSION);
assert.equal(saved?.game.turns.length,1);
assert.equal(saved?.fastResolve,true);
assert.equal(parseSession("{\"version\":2,\"game\":{}}"),null);
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

// Expanded technique pool: seventy-two original techniques, eighteen per stage,
// with detectable signatures spread so no single procedure dominates.
assert.ok(attacks.length>=72,`expected at least 72 techniques, found ${attacks.length}`);
assert.deepEqual([0,1,2,3].map(stage=>attacks.filter(a=>a.stage===stage).length),[18,18,18,18],"eighteen techniques per stage");
assert.equal(new Set(attacks.map(a=>a.id)).size,attacks.length,"technique ids are unique");
const detectSignatures=new Set(attacks.map(a=>[...a.detect].sort().join("+")));
assert.ok(detectSignatures.size>=40,`expected many distinct detect signatures, found ${detectSignatures.size}`);
const procedureShare=procedures.map(p=>attacks.filter(a=>a.detect.includes(p.id)).length);
assert.ok(Math.max(...procedureShare)<=attacks.length*0.4,`no procedure dominates the pool, max ${Math.max(...procedureShare)} of ${attacks.length}`);
for(const s of scenarios){assert.equal(s.choices.length,4);s.choices.forEach((choices,stage)=>{assert.equal(choices.length,3,`${s.id} stage ${stage} must offer three techniques`);choices.forEach(id=>assert.equal(attacks.find(a=>a.id===id)?.stage,stage,`${s.id}/${id} must belong to stage ${stage}`));});}
for(let stage=0;stage<4;stage++)for(let i=0;i<scenarios.length;i++)for(let j=i+1;j<scenarios.length;j++)assert.ok(scenarios[i].choices[stage].filter(id=>scenarios[j].choices[stage].includes(id)).length<=1,`scenarios ${i}/${j} stage ${stage} must not share more than one technique`);

// Each scenario owns a distinct infrastructure topology: node count, edge set and
// critical-node rule all vary, and every referenced node exists.
const topologyShapes=infrastructureTopologies.map(t=>`${t.nodes.map(n=>n.id).join(">")}|${t.edges.map(e=>`${e.from}-${e.to}`).join(">")}`);
assert.equal(new Set(topologyShapes).size,infrastructureTopologies.length,"every scenario has a distinct topology shape");
assert.ok(new Set(infrastructureTopologies.map(t=>t.nodes.length)).size>=3,"topologies vary in node count");
assert.ok(new Set(infrastructureTopologies.map(t=>t.critical)).size>=6,"the critical node differs across scenarios");
for(const t of infrastructureTopologies){assert.ok(t.nodes.length>=4);assert.ok(t.nodes.some(n=>n.id===t.critical),"critical node must exist on the map");assert.ok(t.criticalRule.length>=30,"the critical-node rule must be described");t.edges.forEach(e=>{assert.ok(t.nodes.some(n=>n.id===e.from)&&t.nodes.some(n=>n.id===e.to));});}

// Sector systems differ mechanically, not just cosmetically.
assert.ok(new Set(sectorSystems.map(s=>s.baseLoss)).size>=4,`expected at least four base losses, found ${new Set(sectorSystems.map(s=>s.baseLoss)).size}`);
const mechanicProfiles=sectorSystems.map(s=>[s.baseLoss,s.tempoWeight,s.revealRelief,s.failureCost,s.exposureBias,s.boundaryRelief,s.lateBias,s.enterpriseBias,s.focusedBias,s.enterpriseObjective,s.commsRecovery,s.exhaustiveContinuity,s.containmentCost,s.monitoringRecovery].join(","));
assert.equal(new Set(mechanicProfiles).size,sectorSystems.length,"each sector combines a distinct mechanic profile");
for(const s of sectorSystems){assert.ok(s.rule.length>=40,"sector rule must describe real behaviour");assert.ok(s.transmissions.length>=2);}

// Determinism: a challenge seed reproduces configuration and random sequence.
const seedA=newGame(6,"crisis",seededChallengeRandom(90210),{mode:"daily"});
const seedB=newGame(6,"crisis",seededChallengeRandom(90210),{mode:"daily"});
assert.deepEqual(seedA.chain,seedB.chain);assert.equal(seedA.adversaryProfile,seedB.adversaryProfile);assert.deepEqual(seedA.injectDeck,seedB.injectDeck);
assert.deepEqual(Object.keys(seedA.nodePosture).sort(),infrastructureTopologies[6].nodes.map(n=>n.id).sort(),"posture is keyed to the scenario topology");

// A restored session is re-keyed to the incident's own topology, and legacy node
// ids degrade safely to a normal posture.
const legacyGame={...newGame(4,"operational",()=>0)};
legacyGame.focusedNode="admin";
legacyGame.nodePosture=Object.fromEntries(["user","boundary","service","admin","data"].map(node=>[node,"normal"]));
const restored=parseSession(JSON.stringify({version:8,savedAt:new Date().toISOString(),game:legacyGame,guided:true,fastResolve:false}));
assert.ok(restored);
assert.deepEqual(Object.keys(restored!.game.nodePosture).sort(),infrastructureTopologies[4].nodes.map(n=>n.id).sort(),"restored posture matches the cloud topology");
assert.ok(infrastructureTopologies[4].nodes.some(n=>n.id===restored!.game.focusedNode),"restored focus lands on a real node");

// Immutability: a transition never mutates the game it was given, and sector
// mechanics move sector health by the sector's own terms.
const immutableBaseline=baseline();
const immutableKey=Object.keys(immutableBaseline.nodePosture)[0];
const snapshotImpact=immutableBaseline.impact,snapshotSector=immutableBaseline.sectorHealth,snapshotActions=immutableBaseline.mapActionsRemaining;
const isolated=resolveMapAction(immutableBaseline,immutableKey,"isolate");
assert.equal(immutableBaseline.mapActionsRemaining,snapshotActions,"map action does not mutate the source");
assert.equal(immutableBaseline.impact,snapshotImpact);
assert.equal(immutableBaseline.nodePosture[immutableKey],"normal");
assert.ok(isolated.sectorHealth<=snapshotSector);

// playTurn is the transition that touches the most collections, so it is held to
// the same standard as the rest: the game it is handed comes back untouched.
const turnSource=baseline();
const turnSnapshot=JSON.stringify(turnSource);
const turnResult=playTurn(turnSource,"endpoint",9);
assert.equal(JSON.stringify(turnSource),turnSnapshot,"playTurn must not mutate the game it was given");
assert.notEqual(turnResult.sectorHistory,turnSource.sectorHistory,"the sector history is cloned, not shared");
assert.equal(turnSource.sectorHistory.length,0,"the source keeps its own sector history");

// A seeded operation reproduces its whole roll sequence, not only its setup, so
// a challenge code replays the same incident on any device.
const seededA=newGame(2,"operational",seededChallengeRandom(4242),{mode:"daily",seed:4242});
const seededB=newGame(2,"operational",seededChallengeRandom(4242),{mode:"daily",seed:4242});
assert.equal(seededA.seed,4242);
const rollsOf=(start:Game)=>{let sim=start;const rolls:number[]=[];for(let i=0;i<3&&sim.status==="playing";i++){if(sim.pendingDecision){sim=resolveDecision(sim,"observe");continue;}if(sim.pendingCommand){sim=resolveCommand(sim,"a");continue;}if(sim.pendingSetPiece){sim=resolveSetPiece(sim,"a");continue;}const action=nextEvidenceSource(sim);assert.ok(action);sim=playTurn(sim,action.id);rolls.push(sim.turns.at(-1)!.raw);}return rolls;};
assert.deepEqual(rollsOf(seededA),rollsOf(seededB),"the same seed reproduces the same roll sequence");
assert.notDeepEqual(rollsOf(seededA),rollsOf(newGame(2,"operational",seededChallengeRandom(9999),{mode:"daily",seed:9999})),"a different seed produces a different sequence");
assert.equal(newGame(2,"operational",()=>0).seed,null,"ordinary campaign play stays unseeded");
assert.deepEqual([seededRoll(7,0),seededRoll(7,1),seededRoll(7,0)],[seededRoll(7,0),seededRoll(7,1),seededRoll(7,0)]);
for(let i=0;i<40;i++){const roll=seededRoll(31337,i);assert.ok(Number.isInteger(roll)&&roll>=1&&roll<=20,`seeded roll ${roll} is a d20 result`);}
// A restored seeded session resumes on the roll it would have produced.
const seededResume=parseSession(serialiseSession(playTurn(seededA,nextEvidenceSource(seededA)!.id),true,false));
assert.equal(seededResume?.game.seed,4242,"the seed survives a save and restore");

// The campaign route only shapes a campaign. Every other mode starts from the
// mode's own terms, with no route bonus applied.
assert.equal(newGame(0,"operational",()=>0,{mode:"daily",campaignRoute:"common-ground",variant:{id:"0-x",title:"t",briefing:"b",modifier:"m",impact:0,continuity:-10,objective:0}}).continuity,90,"a non-campaign operation gets no route continuity");
assert.equal(newGame(0,"operational",()=>0,{mode:"campaign",campaignRoute:"common-ground",variant:{id:"0-x",title:"t",briefing:"b",modifier:"m",impact:0,continuity:-10,objective:0}}).continuity,93,"a campaign operation keeps the common-ground reserve");

// The engine's solver stays behind an explicit guidance gate. Normal play and
// expert operations never receive the optimal move; only the training path does.
// The balance simulations below call nextEvidenceSource directly.
const ordinary=baseline();
assert.equal(getSuggestion(ordinary),null,"normal play must not be handed the next evidence source");
assert.equal(getSuggestion(ordinary,true),null,"guided reflection prompts without revealing the answer");
assert.equal(guidanceLevel(ordinary,false),"off");
assert.equal(guidanceLevel(ordinary,true),"reflection");
assert.ok(nextEvidenceSource(ordinary),"the underlying solver still resolves an evidence source");
const trainingGame=newGame(0,"training",()=>0);
assert.equal(guidanceLevel(trainingGame,true),"training");
assert.ok(getSuggestion(trainingGame,true),"the training path receives the suggested evidence source");
assert.equal(getSuggestion(trainingGame,false),null,"the training aid still requires guidance to be enabled");
const expertGame=newGame(0,"operational",()=>0,{mode:"expert"});
assert.equal(guidanceLevel(expertGame,true),"off","expert mode never receives guidance");
assert.equal(getSuggestion(expertGame,true),null);

// Five decision verbs: each moves impact, continuity, sector condition, objective
// progress and adversary tempo by its own terms.
const verbBase=(over:Partial<Game>={})=>({...baseline(),pendingDecision:"phish",...over});
const observeVerb=resolveDecision(verbBase(),"observe");
assert.equal(observeVerb.decisions[0].choice,"observe");
assert.deepEqual([observeVerb.impact,observeVerb.continuity,observeVerb.adversaryTempo,observeVerb.sectorHealth,observeVerb.objectiveProgress,observeVerb.nextModifier],[29,100,1,100,11,2]);
assert.equal(observeVerb.decisions[0].quality,5);
assert.deepEqual([observeVerb.decisions[0].impactChange,observeVerb.decisions[0].continuityChange,observeVerb.decisions[0].tempoChange,observeVerb.decisions[0].sectorChange,observeVerb.decisions[0].objectiveChange],[7,0,1,0,6]);
const actVerb=resolveDecision(verbBase({adversaryTempo:1}),"act");
assert.equal(actVerb.decisions[0].choice,"act");
assert.deepEqual([actVerb.impact,actVerb.continuity,actVerb.adversaryTempo,actVerb.sectorHealth,actVerb.objectiveProgress,actVerb.nextModifier],[9,96,0,98,0,-1]);
assert.equal(actVerb.decisions[0].quality,3);
assert.deepEqual([actVerb.decisions[0].impactChange,actVerb.decisions[0].tempoChange,actVerb.decisions[0].sectorChange,actVerb.decisions[0].objectiveChange],[-13,-1,-2,-5]);
assert.ok(actVerb.decisions[0].adaptedTo,"act presses the actor hard enough to force a route change");
const attributeVerb=resolveDecision(verbBase(),"attribute");
assert.equal(attributeVerb.decisions[0].choice,"attribute");
assert.deepEqual([attributeVerb.impact,attributeVerb.continuity,attributeVerb.adversaryTempo,attributeVerb.sectorHealth,attributeVerb.objectiveProgress,attributeVerb.nextModifier],[25,100,0,99,1,3]);
assert.equal(attributeVerb.decisions[0].quality,4);
assert.equal(attributeVerb.decisions[0].adaptedTo,null,"attribution does not force a route change");
assert.deepEqual([attributeVerb.decisions[0].impactChange,attributeVerb.decisions[0].tempoChange,attributeVerb.decisions[0].sectorChange,attributeVerb.decisions[0].objectiveChange],[3,0,-1,-4]);
const containVerb=resolveDecision(verbBase({sectorHealth:60}),"contain");
assert.equal(containVerb.decisions[0].choice,"contain");
assert.deepEqual([containVerb.impact,containVerb.continuity,containVerb.adversaryTempo,containVerb.sectorHealth,containVerb.objectiveProgress],[12,97,0,63,0]);
assert.equal(containVerb.decisions[0].quality,4,"contain scores well when the sector is the binding constraint");
assert.deepEqual([containVerb.decisions[0].sectorChange,containVerb.decisions[0].continuityChange,containVerb.decisions[0].tempoChange],[3,-3,0]);
const notifyVerb=resolveDecision(verbBase({continuity:60}),"notify");
assert.equal(notifyVerb.decisions[0].choice,"notify");
assert.deepEqual([notifyVerb.impact,notifyVerb.continuity,notifyVerb.adversaryTempo,notifyVerb.sectorHealth,notifyVerb.objectiveProgress,notifyVerb.nextModifier],[24,63,1,97,10,1]);
assert.equal(notifyVerb.decisions[0].quality,4,"notify scores well when continuity is the binding constraint");
assert.deepEqual([notifyVerb.decisions[0].continuityChange,notifyVerb.decisions[0].sectorChange,notifyVerb.decisions[0].tempoChange,notifyVerb.decisions[0].objectiveChange],[3,-3,1,5]);
const verbOptions=getDecisionOptions(verbBase());
assert.ok(verbOptions);
assert.deepEqual(verbOptions.options.map(option=>option.id),decisionChoices,"every decision verb is offered");
assert.equal(new Set(verbOptions.options.map(option=>option.title)).size,decisionChoices.length,"each verb has its own title and description");

// Response options are authored per scenario, and the sequence stays strict:
// containment, then assurance, then recovery.
assert.equal(responseProfiles.length,scenarios.length,"every incident has its own response profile");
assert.deepEqual(responseOptions.containment,responseOptionsFor(newGame(0,"operational",()=>0)).containment,"the legacy export mirrors incident one");
const responseSignatures=scenarios.map((scenario,index)=>{
  const profile=responseOptionsFor(newGame(index,"operational",()=>0));
  assert.ok(profile.constraint.length>=40,`${scenario.id} names its sector constraint`);
  assert.deepEqual(profile.containment.map(option=>option.id),["isolate","credential","monitor"],`${scenario.id} containment options`);
  assert.deepEqual(profile.assurance.map(option=>option.id),["verify","preserve","accelerate"],`${scenario.id} assurance options`);
  assert.deepEqual(profile.recovery.map(option=>option.id),["rebuild","restore","patch"],`${scenario.id} recovery options`);
  return [...profile.containment,...profile.assurance,...profile.recovery].map(option=>`${option.title}|${option.impact}|${option.continuity}|${option.score}`).join(">");
});
assert.equal(new Set(responseSignatures).size,scenarios.length,"every sector has a distinct response set");
const clearing=responseOptionsFor(newGame(9,"operational",()=>0));
assert.notDeepEqual(clearing.containment,responseOptionsFor(newGame(0,"operational",()=>0)).containment,"the same verb costs different service in different sectors");
const responseRun=newGame(9,"operational",()=>0);responseRun.revealed=[...responseRun.chain];responseRun.status="response";
const contained=resolveResponse(responseRun,"credential");
assert.deepEqual([contained.impact,contained.continuity,contained.status],[4,95,"response"],"the clearing sector's own containment numbers apply");
assert.throws(()=>resolveResponse(contained,"rebuild"),/Unknown/,"the assurance gate cannot be skipped");
const assured=resolveResponse(contained,"verify");
assert.equal(assured.status,"response");
assert.equal(assured.impact,0);
const recovered=resolveResponse(assured,"rebuild");
assert.equal(recovered.status,"won");
assert.equal(recovered.continuity,77);

const verbTally:Record<DecisionChoice,number>={observe:0,act:0,attribute:0,contain:0,notify:0};
const simDecision=(g:Game,attempt:number):DecisionChoice=>{
  if(attempt%4===0)return decisionChoices[(g.turns.length+g.decisions.length)%decisionChoices.length];
  if(g.impact>=55||g.adversaryTempo>=2)return g.sectorHealth<=70?"contain":"act";
  if(g.continuity<=65)return "notify";
  if(g.adversaryTempo<=1&&g.revealed.length<3)return "attribute";
  return "observe";
};

const totals={won:0,lost:0,exercise:0};
for(const difficulty of Object.keys(difficulties) as Difficulty[])for(let s=0;s<scenarios.length;s++)for(let attempt=0;attempt<30;attempt++){
  let sim:Game=newGame(s,difficulty);
  while(sim.status==="playing"){
    if(sim.pendingDecision){const verb=simDecision(sim,attempt);verbTally[verb]+=1;sim=resolveDecision(sim,verb);continue;}
    if(sim.pendingCommand){sim=resolveCommand(sim,sim.impact>55?"a":"b");continue;}
    if(sim.pendingSetPiece){sim=resolveSetPiece(sim,sim.impact>55?"a":"b");continue;}
    const next=sim.chain.find(id=>!sim.revealed.includes(id));if(next)sim=setHypothesis(sim,attackVector(next));
    const action=nextEvidenceSource(sim);assert.ok(action);sim=playTurn(sim,action.id);assert.ok(sim.turns.length<=difficulties[difficulty].maxTurns);assert.equal(new Set(sim.revealed).size,sim.revealed.length);
  }
  if(sim.status==="response"){sim=resolveResponse(sim,"credential");sim=resolveResponse(sim,"verify");sim=resolveResponse(sim,"rebuild");}
  assert.equal(sim.pendingDecision,null,"a finished operation owes no evidence decision");
  assert.equal(sim.pendingCommand,null,"a finished operation owes no command event");
  assert.equal(sim.pendingSetPiece,null,"a finished operation owes no sector decision");
  totals[sim.status as keyof typeof totals]++;
}
const simulationCount=Object.keys(difficulties).length*scenarios.length*30;
assert.equal(Object.values(totals).reduce((a,b)=>a+b,0),simulationCount);
const modes=Object.keys({campaign:1,daily:1,ironman:1,escalation:1,expert:1}) as GameMode[];
const specialistIds=["hunter","forensics","identity","ot","continuity","communications"] as SpecialistId[];
let modeSimulations=0;
for(const mode of modes)for(let s=0;s<scenarios.length;s++)for(let attempt=0;attempt<6;attempt++){
  let sim:Game=newGame(s,"operational",undefined,{mode,specialist:specialistIds[(s+attempt)%specialistIds.length],campaignTier:attempt%4,inheritedFatigue:attempt%3,readiness:50+attempt*5,leadershipTrust:45+attempt*6});
  while(sim.status==="playing"){
    if(sim.pendingDecision){const verb=simDecision(sim,attempt);verbTally[verb]+=1;sim=resolveDecision(sim,verb);continue;}
    if(sim.pendingCommand){sim=resolveCommand(sim,sim.impact>55?"a":"b");continue;}
    if(sim.pendingSetPiece){sim=resolveSetPiece(sim,sim.impact>55?"a":"b");continue;}
    const next=sim.chain.find(id=>!sim.revealed.includes(id));if(next)sim=setHypothesis(sim,attackVector(next));
    const action=nextEvidenceSource(sim);assert.ok(action);sim=playTurn(sim,action.id,undefined,{scope:attempt%2?"enterprise":"focused",intensity:attempt%3===0?"exhaustive":"balanced"});
  }
  if(sim.status==="response"){sim=resolveResponse(sim,"credential");sim=resolveResponse(sim,"verify");sim=resolveResponse(sim,"rebuild");}
  assert.ok(["won","lost","exercise"].includes(sim.status));modeSimulations++;
}
for(const verb of decisionChoices)assert.ok(verbTally[verb]>0,`simulations exercise the ${verb} decision verb`);

const applyBotAction=(game:Game,action:BotAction)=>{
  switch(action.type){
    case "decision":return resolveDecision(game,action.choice);
    case "command":return resolveCommand(game,action.choice);
    case "set-piece":return resolveSetPiece(game,action.choice);
    case "response":return resolveResponse(game,action.choice);
    case "hypothesis":return setHypothesis(game,action.hypothesis);
    case "case-theory":return setCaseTheory(game,action.objective);
    case "correlate":return correlateEvidence(game,action.evidence,action.assessment);
    case "focus":return setInfrastructureFocus(game,action.nodeId);
    case "map":return resolveMapAction(game,action.nodeId,action.action);
    case "procedure":return playTurn(game,action.procedure,18,action.plan);
    case "complete":return game;
  }
};
const botActionTypes=new Set<BotAction["type"]>();
let botSimulations=0;
for(let scenario=0;scenario<scenarios.length;scenario++)for(const difficulty of ["training","operational","crisis"] as Difficulty[]){
  let botGame=newGame(scenario,difficulty,seededChallengeRandom(500000+scenario),{specialist:specialistIds[scenario%specialistIds.length]});
  for(let step=0;step<160&&!(["won","lost","exercise"] as string[]).includes(botGame.status);step++){
    const action=chooseBotAction(botGame);
    assert.notEqual(action.type,"complete","bot always has a move before the operation ends");
    botActionTypes.add(action.type);
    botGame=applyBotAction(botGame,action);
  }
  assert.ok(["won","lost","exercise"].includes(botGame.status),`bot terminates ${scenarios[scenario].id} on ${difficulty}`);
  assert.ok(botGame.turns.length<=getTurnLimit(botGame),"bot respects the investigation turn limit");
  botSimulations++;
}
for(const action of ["procedure","hypothesis","decision","set-piece","response"] as const)assert.ok(botActionTypes.has(action),`bot simulations exercise ${action}`);
console.log(`PASS: adaptive routes, hypotheses, command events, sector systems, specialists, advanced modes, five decision verbs, per-sector response sets, counterfactuals, a visible-evidence bot and ${simulationCount+modeSimulations+botSimulations} complete simulations.`,totals,verbTally);
