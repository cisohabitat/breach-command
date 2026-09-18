import assert from "node:assert/strict";
// @ts-expect-error Native Node TypeScript execution requires the source extension.
import {newGame,playTurn,resolveDecision,resolveResponse,resolveCommand,resolveSetPiece,correlateEvidence,setInfrastructureFocus,setHypothesis,setCaseTheory,availableIn,attacks,procedures,scenarios,getSuggestion,difficulties,getOutcome,getCounterfactuals,getDecisionOptions,getAdversaryState,getScoreBreakdown,getTurnLimit,attackVector,type Difficulty,type Game,type GameMode,type SpecialistId} from "../lib/advanced-game.ts";
// @ts-expect-error Native Node TypeScript execution requires the source extension.
import {parseSession,serialiseSession,SESSION_VERSION} from "../lib/session.ts";
// @ts-expect-error Native Node TypeScript execution requires the source extension.
import {modeRandom} from "../lib/command-systems.ts";
// @ts-expect-error Native Node TypeScript execution requires the source extension.
import {decodeChallenge,encodeChallenge,seededChallengeRandom} from "../lib/phase8.ts";
// @ts-expect-error Native Node TypeScript execution requires the source extension.
import {campaignAct,campaignEnding,defaultCampaign,parseCampaign} from "../lib/campaign.ts";
// @ts-expect-error Native Node TypeScript execution requires the source extension.
import {campaignRoutes,incidentVariant,routeForCampaign} from "../lib/phase9.ts";

const baseline=()=>{const g=newGame(0,"operational",()=>0);g.chain=["phish","spray","task","https"];g.established=["endpoint","identity","server","network"];g.injectDeck=[4,7,0,1,2,3,5,6,8];return g;};
let g=baseline();
let n=playTurn(g,"endpoint",8);
assert.equal(n.turns[0].total,11);assert.equal(n.revealed[0],"phish");assert.equal(n.pendingDecision,"phish");assert.equal(g.turns.length,0);assert.equal(availableIn(n,"endpoint"),3);
assert.throws(()=>playTurn(n,"identity",20),/decision/);
assert.equal(getDecisionOptions(n)?.observe.title,"Trace the access path");
n=resolveDecision(n,"observe");assert.equal(n.nextModifier,2);assert.equal(n.impact,30);assert.equal(n.pendingDecision,null);
n=playTurn(n,"dns",9);assert.equal(n.turns[1].total,12);assert.equal(n.nextModifier,0);n=resolveSetPiece(n,"a");assert.throws(()=>playTurn(n,"endpoint",15),/cooling/);
g=baseline();g=setHypothesis(g,"endpoint");g=playTurn(g,"endpoint",7);assert.equal(g.turns[0].planningBonus,1);assert.equal(g.turns[0].total,11);
g=baseline();g=playTurn(g,"endpoint",20);assert.equal(g.turns[0].inject?.reason,"Natural 20");const oldPivot=g.chain[1];g=resolveDecision(g,"act");assert.equal(g.nextModifier,-1);assert.equal(g.impact,18);assert.notEqual(g.chain[1],oldPivot);assert.ok(g.adversaryEvent);
g=baseline();g=playTurn(g,"email",2);g=playTurn(g,"cloud",2);g=resolveSetPiece(g,"a");g=playTurn(g,"dns",2);assert.equal(g.turns[2].inject?.reason,"Three failed rolls");assert.equal(g.failures,0);assert.ok(g.turns[2].adversaryEvent);assert.ok(g.continuity<100);
g=baseline();g.injectDeck=[2];g=playTurn(g,"endpoint",20);assert.equal(availableIn(g,"endpoint"),0,"restoration override");
g=baseline();g.injectDeck=[3];g=playTurn(g,"endpoint",20);assert.equal(g.revealed.length,2);assert.ok(g.pendingDecision);
g=baseline();g.injectDeck=[8];g=playTurn(g,"email",20);assert.equal(g.status,"exercise");
g=baseline();g.revealed=["phish","spray","task"];g=playTurn(g,"network",11);assert.ok(g.pendingDecision);g=resolveDecision(g,"act");assert.equal(g.status,"response");g=resolveResponse(g,"credential");assert.equal(g.status,"response");g=resolveResponse(g,"rebuild");assert.equal(g.status,"won");assert.ok(getOutcome(g).grade);assert.ok(getCounterfactuals(g).length);
g=baseline();for(let i=0;i<14&&g.status==="playing";i++){if(g.pendingSetPiece){g=resolveSetPiece(g,"a");continue;}if(g.pendingCommand){g=resolveCommand(g,"a");continue;}const action=getSuggestion(g);assert.ok(action);g=playTurn(g,action.id,2);}assert.equal(g.status,"lost");
assert.equal(getAdversaryState(newGame(0,"crisis",()=>0)),"Maneuvering");assert.equal(difficulties.crisis.maxTurns,9);
assert.throws(()=>playTurn(baseline(),"unknown",10),/Unknown/);assert.throws(()=>playTurn(baseline(),"endpoint",21),/Invalid/);assert.throws(()=>newGame(-1),/Unknown/);
const ironman=newGame(0,"operational",()=>0,{mode:"ironman",specialist:"forensics"});assert.equal(getTurnLimit(ironman),difficulties.operational.maxTurns-1);
const escalation=newGame(0,"operational",()=>0,{mode:"escalation",specialist:"hunter"});assert.ok(escalation.impact>newGame(0,"operational",()=>0).impact);assert.ok(escalation.objectiveProgress>5);
const dailyA=newGame(4,"operational",modeRandom("daily",4,new Date("2026-09-18T00:00:00Z")),{mode:"daily"});
const dailyB=newGame(4,"operational",modeRandom("daily",4,new Date("2026-09-18T23:59:00Z")),{mode:"daily"});assert.deepEqual(dailyA.chain,dailyB.chain);
let specialistGame=newGame(0,"operational",()=>0,{specialist:"forensics"});specialistGame.chain=["phish","spray","task","https"];specialistGame.established=[];specialistGame=playTurn(specialistGame,"endpoint",8, {scope:"focused",intensity:"exhaustive"});assert.equal(specialistGame.turns[0].specialistBonus,2);assert.ok(specialistGame.specialistFatigue>0);assert.ok(availableIn(specialistGame,"endpoint")>3);

g=baseline();g.established=[];g=setInfrastructureFocus(g,"service");g=playTurn(g,"server",10);assert.equal(g.turns[0].modifier,1,"infrastructure focus adds one to aligned procedures");
g=baseline();g=playTurn(g,"email",12);if(g.pendingDecision)g=resolveDecision(g,"observe");g=playTurn(g,"cloud",12);if(g.pendingDecision)g=resolveDecision(g,"observe");assert.ok(g.pendingSetPiece);g=resolveSetPiece(g,"a");assert.equal(g.setPieceHistory.length,1);assert.equal(g.pendingSetPiece,null);
g=baseline();g.evidence=[
  {id:"E1",turn:1,title:"Initial access",source:"Email",system:"User access",confidence:"HIGH",supports:"phish",detail:"A"},
  {id:"E2",turn:2,title:"Movement",source:"Identity",system:"Admin plane",confidence:"HIGH",supports:"spray",detail:"B"},
];
g=correlateEvidence(g,["E1","E2"]);assert.equal(g.correlations[0].valid,true);assert.equal(g.nextModifier,2);
const challenge=encodeChallenge({scenario:4,difficulty:"crisis",mode:"expert",specialist:"identity",seed:74219});assert.deepEqual(decodeChallenge(challenge),{scenario:4,difficulty:"crisis",mode:"expert",specialist:"identity",seed:74219});assert.equal(decodeChallenge(challenge.replace(/\d{2}$/, "00")),null);assert.deepEqual([seededChallengeRandom(7)(10),seededChallengeRandom(7)(10)],[8,8]);
assert.equal(campaignAct(0).number,1);assert.equal(campaignAct(7).number,3);assert.equal(campaignEnding({...defaultCampaign,completed:[0,1,2,3,4,5,6,7,8,9],leadershipTrust:80,readiness:80})?.title,"Collective resilience");
assert.equal(routeForCampaign({...defaultCampaign,completed:[0,1],commandPosture:{observe:4,act:0}}),"watchtower");
assert.equal(campaignRoutes.breakwater.scenarios.length,3);assert.equal(incidentVariant(0,"common-ground",17).id,"0-1");
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
for(const a of attacks){assert.ok(a.detect.length>=3);for(const id of a.detect)assert.ok(procedures.some(p=>p.id===id));}
for(const s of scenarios){assert.equal(s.choices.length,4);s.choices.forEach((choices,stage)=>choices.forEach(id=>assert.equal(attacks.find(a=>a.id===id)?.stage,stage)));}

const totals={won:0,lost:0,exercise:0};
for(const difficulty of Object.keys(difficulties) as Difficulty[])for(let s=0;s<scenarios.length;s++)for(let attempt=0;attempt<30;attempt++){
  let sim:Game=newGame(s,difficulty);
  while(sim.status==="playing"){
    if(sim.pendingDecision){sim=resolveDecision(sim,sim.impact>52?"act":"observe");continue;}
    if(sim.pendingCommand){sim=resolveCommand(sim,sim.impact>55?"a":"b");continue;}
    if(sim.pendingSetPiece){sim=resolveSetPiece(sim,sim.impact>55?"a":"b");continue;}
    const next=sim.chain.find(id=>!sim.revealed.includes(id));if(next)sim=setHypothesis(sim,attackVector(next));
    const action=getSuggestion(sim);assert.ok(action);sim=playTurn(sim,action.id);assert.ok(sim.turns.length<=difficulties[difficulty].maxTurns);assert.equal(new Set(sim.revealed).size,sim.revealed.length);
  }
  if(sim.status==="response"){sim=resolveResponse(sim,"credential");sim=resolveResponse(sim,"rebuild");}
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
    if(sim.pendingDecision){sim=resolveDecision(sim,sim.impact>50?"act":"observe");continue;}
    if(sim.pendingCommand){sim=resolveCommand(sim,sim.impact>55?"a":"b");continue;}
    if(sim.pendingSetPiece){sim=resolveSetPiece(sim,sim.impact>55?"a":"b");continue;}
    const next=sim.chain.find(id=>!sim.revealed.includes(id));if(next)sim=setHypothesis(sim,attackVector(next));
    const action=getSuggestion(sim);assert.ok(action);sim=playTurn(sim,action.id,undefined,{scope:attempt%2?"enterprise":"focused",intensity:attempt%3===0?"exhaustive":"balanced"});
  }
  if(sim.status==="response"){sim=resolveResponse(sim,"credential");sim=resolveResponse(sim,"rebuild");}
  assert.ok(["won","lost","exercise"].includes(sim.status));modeSimulations++;
}
console.log(`PASS: adaptive routes, hypotheses, command events, sector systems, specialists, advanced modes, response tradeoffs, counterfactuals and ${simulationCount+modeSimulations} complete simulations.`,totals);
