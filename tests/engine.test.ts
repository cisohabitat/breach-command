// Turn resolution, blocking states, end states and the decision layer.
import assert from "node:assert/strict";
import { test } from "node:test";
import {getLossReason,newGame,playTurn,resolveDecision,resolveResponse,resolveCommand,resolveSetPiece,resolveMapAction,correlateEvidence,setInfrastructureFocus,setHypothesis,setCaseTheory,availableIn,scenarios,attacks,getDiscriminatingRead,getHypothesisStanding,getTrainingPrompt,hypothesisSources,procedures,nextEvidenceSource,guidanceLevel,responseOptions,responseOptionsFor,responseProfiles,decisionChoices,difficulties,getDecisionOptions,getAdversaryState,getAttributionRead,getScoreBreakdown,getTurnLimit,cooldownWindow,getObjectiveRead,getBeginnerReview,getMapActionEffect,type Difficulty,type Game,OWN_SOURCE_BONUS} from "../lib/advanced-game.ts";
import {parseSession,serialiseSession,SESSION_VERSION} from "../lib/session.ts";
import {modeRandom} from "../lib/command-systems.ts";
import {decodeChallenge,encodeChallenge,seededChallengeRandom,seededRoll} from "../lib/phase8.ts";
import {incidentVariant} from "../lib/phase9.ts";

const baseline=()=>{const g=newGame(0,"operational",()=>0);g.chain=["phish","spray","task","https"];g.established=["endpoint","identity","server","network"];g.injectDeck=[4,7,0,1,2,3,5,6,8];return g;};
let g:Game=baseline();

test("resolves a turn, its decision and its cooldown", () => {
  let g=baseline();
  let n=playTurn(g,"endpoint",9);
  assert.equal(n.turns[0].total,11);assert.equal(n.revealed[0],"phish");assert.equal(n.pendingDecision,"phish");assert.equal(g.turns.length,0);assert.equal(availableIn(n,"endpoint"),3);
  // The card counts the turns a player must skip, which is the window minus the
  // turn they just spent. The Investigate heading states the same number in
  // words, so these must not drift apart.
  assert.equal(availableIn(n,"endpoint"),cooldownWindow(n)-1,"the count shown is the window minus the turn just spent");
  const trained=(()=>{const b=newGame(0,"training");b.injectDeck=[];return playTurn(b,"endpoint",9);})();
  assert.equal(cooldownWindow(trained),3,"training uses the shorter window");
  assert.equal(availableIn(trained,"endpoint"),2,"which skips two turns, not three");
  assert.throws(()=>playTurn(n,"identity",20),/decision/);
  assert.equal(getDecisionOptions(n)?.observe.title,"Trace the access path");
  n=resolveDecision(n,"observe");assert.equal(n.nextModifier,2);assert.equal(n.impact,30);assert.equal(n.pendingDecision,null);
  n=playTurn(n,"dns",9);assert.equal(n.turns[1].total,12);assert.equal(n.nextModifier,0);n=resolveSetPiece(n,"a");assert.throws(()=>playTurn(n,"endpoint",15),/cooling/);
  g=baseline();g=setHypothesis(g,"endpoint");g=playTurn(g,"endpoint",7);assert.equal(g.turns[0].planningBonus,OWN_SOURCE_BONUS);assert.equal(g.turns[0].total,7+2+OWN_SOURCE_BONUS,"established and own source");
    // This deck opens with an unfavourable card. A natural 20 used to take it and
  // raise business pressure, which is the game contradicting its own loudest
  // signal; it now reaches past it to the relief card behind.
  g=baseline();g=playTurn(g,"endpoint",20);assert.equal(g.turns[0].inject?.reason,"Natural 20");assert.equal(g.turns[0].inject?.effect,"relief","a natural 20 never hands the player a penalty");const oldPivot=g.chain[1];g=resolveDecision(g,"act");assert.equal(g.nextModifier,-1);assert.equal(g.impact,2);assert.notEqual(g.chain[1],oldPivot);assert.ok(g.adversaryEvent);
  g=baseline();g=playTurn(g,"email",2);g=playTurn(g,"cloud",2);g=resolveSetPiece(g,"a");g=playTurn(g,"dns",2);assert.equal(g.turns[2].inject?.reason,"Three failed rolls");assert.equal(g.failures,0);assert.ok(g.turns[2].adversaryEvent);assert.ok(g.continuity<100);
  g=baseline();g.injectDeck=[2];g=playTurn(g,"endpoint",20);assert.equal(availableIn(g,"endpoint"),0,"restoration override");
  // A stage the partner hands over has to leave a finding, or the player holds a
  // confirmed stage they cannot select in the evidence workspace.
  g=baseline();g.injectDeck=[3];g=playTurn(g,"endpoint",20);assert.equal(g.revealed.length,2);assert.ok(g.pendingDecision);
  assert.equal(g.turns[0].inject?.id,"partner","the partner card was the one drawn");
  const partnerFinding=g.evidence.find(item=>item.supports===g.turns[0].injectReveal);
  assert.ok(partnerFinding,"the disclosed stage leaves a correlatable finding");
  assert.equal(partnerFinding!.source,"Partner disclosure","attributed to where it came from");
  assert.equal(g.evidence.filter(item=>item.supports).length,2,"alongside the stage the procedure found");

  // A critical roll is the loudest signal the game sends; what it draws has to
  // agree with it. Deck order puts an unfavourable card first either way.
  const deck=[1,0];
  assert.equal(playTurn((()=>{const b=baseline();b.injectDeck=[...deck];return b;})(),"endpoint",20).turns[0].inject?.effect,"bonus","a natural 20 reaches past the penalty");
  assert.equal(playTurn((()=>{const b=baseline();b.injectDeck=[0,1];return b;})(),"email",1).turns[0].inject?.effect,"penalty","and a natural 1 reaches past the bonus");
  // The authorised stand-down is neither reward nor punishment, and a natural 20
  // must still be able to draw it or the ending all but disappears.
  assert.equal(playTurn((()=>{const b=baseline();b.injectDeck=[8];b.revealed=[b.chain[0],b.chain[1]];return b;})(),"endpoint",20).status,"exercise","a natural 20 can still stand the operation down");
});

test("earns the drill conclusion rather than drawing it", () => {
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
});

test("gives crisis its own shape", () => {
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
});

test("leaves nothing outstanding when an operation ends", () => {
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
});

test("holds the turn limit, modes, specialists and map actions", () => {
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
});

test("records case theory, variants and hypothesis history", () => {
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
});

test("never mutates the game a transition was given", () => {
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
});

test("teaches the reasoning instead of handing over the answer", () => {
  // The solver stays a simulation tool. No player-facing helper may return it at
  // any difficulty, because following it produced a complete attack chain and a
  // hypothesis score of three out of ten: it taught which button to press.
  const ordinary=baseline();
  assert.equal(getTrainingPrompt(ordinary),null,"normal play receives no training aid");
  assert.equal(getTrainingPrompt(ordinary,true),null,"guided reflection is not the training path");
  assert.equal(guidanceLevel(ordinary,false),"off");
  assert.equal(guidanceLevel(ordinary,true),"reflection");
  assert.ok(nextEvidenceSource(ordinary),"the solver still resolves a source for the simulations");
  const expertGame=newGame(0,"operational",()=>0,{mode:"expert"});
  assert.equal(guidanceLevel(expertGame,true),"off","expert mode never receives guidance");
  assert.equal(getTrainingPrompt(expertGame,true),null);

  const training=newGame(0,"training",()=>0);
  assert.equal(guidanceLevel(training,true),"training");
  assert.equal(getTrainingPrompt(training,false),null,"the aid still requires guidance to be enabled");
  assert.equal(getTrainingPrompt(training,true)?.step,"declare","with no reading recorded it asks for one");

  // Once a reading is declared the aid names that reading's own sources, so it
  // can never contradict the discriminating read shown on the same cards.
  const declared=setHypothesis({...training,chain:["phish","spray","task","https"],established:[]} as Game,"identity");
  const testing=getTrainingPrompt(declared,true)!;
  assert.equal(testing.step,"test");
  // The reading's own sources include this sector's procedure when it tests the
  // same route, so read them from the game rather than the static route list.
  const identitySources=hypothesisSources(g,"identity");
  assert.ok(testing.sources.length>0,"it names sources to try");
  for(const source of testing.sources){
    assert.ok(identitySources.includes(source.id),`${source.id} is one of the declared reading's own sources`);
    assert.equal(getDiscriminatingRead(declared,source.id).level,"high","every suggested source tests the declared reading");
  }
  // Training discloses exactly one thing the player could not derive: the
  // observation pointing at the next unconfirmed stage. Everything else in the
  // prompt is built from declared state, so rewriting the chain moves the clue
  // and nothing besides.
  const rewritten=getTrainingPrompt({...declared,chain:["token","role","vault","apikey"]} as Game,true)!;
  assert.deepEqual({...rewritten,clue:null},{...testing,clue:null},"only the observation depends on the chain");
  assert.ok(testing.clue,"training surfaces the observation behind the next stage");
  assert.notEqual(rewritten.clue,testing.clue,"and it follows the chain it describes");
  for(const prompt of [testing,rewritten]){
    for(const procedure of procedures)assert.ok(!prompt.clue!.includes(procedure.title),`the observation never names ${procedure.title}`);
    for(const attack of attacks)assert.ok(!prompt.clue!.includes(attack.title),`the observation never names ${attack.title}`);
  }
  // Outside training there is no aid at all, so no observation leaks with it.
  const operational=setHypothesis(newGame(0,"operational",()=>0),"identity");
  assert.equal(getTrainingPrompt(operational,true),null,"only the training path receives the observation");

  // When the reading's own sources come back empty, the aid asks for a revision
  // rather than walking the player to the next stage.
  let failing=declared;
  for(const source of identitySources){
    failing=playTurn({...failing,injectDeck:[]},source,20);
    if(failing.pendingDecision)failing=resolveDecision(failing,"observe");
    if(failing.pendingCommand)failing=resolveCommand(failing,"a");
    if(failing.pendingSetPiece)failing=resolveSetPiece(failing,"a");
  }
  const standing=getHypothesisStanding(failing);
  if(standing.level==="weakening"||standing.level==="unsupported"){
    assert.equal(getTrainingPrompt(failing,true)?.step,"revise","a reading its own sources cannot support prompts a revision");
  }
});

test("moves each decision verb by its own terms", () => {
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
});

test("ends the operation whichever step takes a meter to its limit", () => {
  // Map actions, correlations and the response move meters too. Each used to
  // leave a meter at its limit with the operation still running, and a later
  // correct correlation could take a lost operation back.
  const isolated=resolveMapAction({...baseline(),sectorHealth:4},"service","isolate");
  assert.equal(isolated.status,"lost","isolating the critical node with no sector margin left loses");
  assert.equal(getLossReason(isolated).title,"Sector confidence collapsed");
  assert.equal(getLossReason(isolated).cause,"sector","the cause is named without comparing titles");
  const midway={...baseline(),objectiveProgress:50};
  const effect=getMapActionEffect(midway,"service","isolate");
  const paid=resolveMapAction(midway,"service","isolate");
  assert.deepEqual([paid.impact-midway.impact,paid.continuity-midway.continuity,paid.sectorHealth-midway.sectorHealth,paid.objectiveProgress-midway.objectiveProgress],[effect.impact,effect.continuity,effect.sector,effect.objective],"the cost shown is the cost paid");
  const unrelated=(over:Partial<Game>)=>({...baseline(),evidence:[
    {id:"E1-dns",turn:1,title:"DNS exception",source:"DNS review",system:"Edge",confidence:"MODERATE",supports:null,detail:""},
    {id:"E2-email",turn:2,title:"Email exception",source:"Email investigation",system:"Edge",confidence:"MODERATE",supports:null,detail:""},
  ],...over} as Game);
  const wrong=correlateEvidence(unrelated({objectiveProgress:98}),["E1-dns","E2-email"],"causal");
  assert.equal(wrong.status,"lost","a wrong causal call at 98 completes the objective");
  assert.equal(wrong.objectiveProgress,100);
  assert.throws(()=>correlateEvidence(wrong,["E1-dns","E2-email"],"coincidental"),/pending decision|correlated/,"and a lost operation cannot be correlated back");
  const respondTo=(over:Partial<Game>)=>({...baseline(),revealed:[...baseline().chain],status:"response",...over} as Game);
  const drained=resolveResponse(respondTo({continuity:5}),"isolate");
  assert.equal(drained.status,"lost","a response option that spends the last of the service loses");
  assert.equal(getLossReason(drained).title,"The essential service stopped");
  assert.ok(!/response cost more/.test(getBeginnerReview(drained).gap),"an unfinished response is not judged on its cost");
  const won=resolveResponse(resolveResponse(resolveResponse(respondTo({}),"credential"),"verify"),"rebuild");
  assert.equal(won.status,"won");assert.equal(won.pendingDecision,null);
  const lostEarly=playTurn({...baseline(),turnLimit:1,injectDeck:[]},"email",2);
  assert.equal(lostEarly.status,"lost");
  assert.ok(!/response cost more/.test(getBeginnerReview(lostEarly).gap),"a run that never reached the response is not told its response cost too much");
  assert.ok(/lost/.test(getBeginnerReview(lostEarly).gap),"and is told what ended it rather than that nothing stands out");
});

test("keeps the deck, the grace and the decisions honest", () => {
  // With no favourable or neutral card left, a natural 20 draws nothing rather
  // than a penalty, and a natural 1 with no unfavourable card draws no gift.
  const twenty=playTurn({...baseline(),injectDeck:[1,4,6]},"email",20);
  assert.equal(twenty.turns[0].inject,null,"a natural 20 never hands over a penalty");
  assert.equal(twenty.injectDeck.length,3,"and the deck keeps its cards");
  const one=playTurn({...baseline(),injectDeck:[0,2,3]},"email",1);
  assert.equal(one.turns[0].inject,null,"a natural 1 never hands over a gift");
  // The exercise card on the turn the chain completes has nothing to stand down.
  const complete=playTurn({...baseline(),revealed:["phish","spray","task"],injectDeck:[8]},"network",20);
  assert.equal(complete.revealed.length,4);
  assert.equal(complete.status,"playing","the operation goes on to its decision and response");
  assert.ok(!/Exercise ends/.test(complete.turns[0].inject!.effectLabel),"and the card does not claim it ended");
  assert.equal(resolveDecision(complete,"contain").status,"response");
  // A sound failure is protected without the grace, so the grace is kept for the
  // failure that needs it, and the sound one hands the actor no extra progress.
  const sound=playTurn({...setHypothesis(baseline(),"endpoint"),graceRemaining:1,injectDeck:[]},"endpoint",2);
  assert.equal(sound.turns[0].planningBonus,OWN_SOURCE_BONUS);assert.equal(sound.turns[0].success,false);
  assert.equal(sound.graceRemaining,1,"a protected failure does not spend the grace");
  assert.equal(sound.adversaryTempo,0,"and hands over no tempo");
  const absorbed=playTurn({...setHypothesis(baseline(),"cloud"),graceRemaining:1,injectDeck:[]},"endpoint",2);
  assert.equal(absorbed.graceRemaining,0,"an unsound failure is what the grace absorbs");
  assert.equal(absorbed.turns[0].objectiveChange-sound.turns[0].objectiveChange,4,"the sound failure adds nothing to the actor's objective beyond its ordinary advance");
  // Whether that protection applied depends on the hidden route, so the words
  // cannot differ: a sound failure reads exactly as an unprotected one.
  const unprotected=playTurn({...setHypothesis(baseline(),"cloud"),graceRemaining:0,injectDeck:[]},"endpoint",2);
  assert.equal(sound.turns[0].narrative,unprotected.turns[0].narrative,"a protected failure is not announced");
  assert.ok(!/right one|reasoning held/i.test(sound.turns[0].narrative),"and never says the route was right");
  // The partner can disclose a stage on the same turn a procedure finds one. Each
  // gets its own decision, one after the other.
  let both=playTurn({...baseline(),injectDeck:[3]},"endpoint",20);
  assert.equal(both.revealed.length,2);
  const [found,disclosed]=[both.turns[0].revealed,both.turns[0].injectReveal];
  assert.equal(both.pendingDecision,found);
  both=resolveDecision(both,"observe");
  assert.equal(both.pendingDecision,disclosed,"the disclosed stage is decided next");
  both=resolveDecision(both,"contain");
  assert.equal(both.pendingDecision,null);
  assert.deepEqual(both.decisions.map(item=>item.stage),[found,disclosed]);
  // The assessed objective waits for two confirmed stages, however many turns pass.
  const slow={...baseline(),turns:Array.from({length:6},(_,index)=>({...playTurn(baseline(),"email",2).turns[0],number:index+1}))} as Game;
  assert.equal(getObjectiveRead(slow).title,"Objective unconfirmed","turns alone do not disclose the objective");
});
