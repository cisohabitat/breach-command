import assert from "node:assert/strict";
// @ts-expect-error Native Node TypeScript execution requires the source extension.
import {newGame,playTurn,resolveDecision,resolveResponse,resolveCommand,resolveSetPiece,resolveMapAction,correlateEvidence,setInfrastructureFocus,setHypothesis,setCaseTheory,availableIn,attacks,procedures,scenarios,getSuggestion,difficulties,infrastructureTopologies,sectorSystems,getOutcome,getCounterfactuals,getDecisionOptions,getAdversaryState,getAttributionRead,getScoreBreakdown,getTurnLimit,attackVector,type Difficulty,type Game,type GameMode,type SpecialistId} from "../lib/advanced-game.ts";
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
g=baseline();g.injectDeck=[8];g=playTurn(g,"email",20);assert.equal(g.status,"exercise");
g=baseline();g.revealed=["phish","spray","task"];g=playTurn(g,"network",11);assert.ok(g.pendingDecision);g=resolveDecision(g,"act");assert.equal(g.status,"response");g=resolveResponse(g,"credential");assert.equal(g.status,"response");g=resolveResponse(g,"verify");assert.equal(g.status,"response");g=resolveResponse(g,"rebuild");assert.equal(g.status,"won");assert.ok(getOutcome(g).grade);assert.ok(getCounterfactuals(g).length);
g=baseline();for(let i=0;i<14&&g.status==="playing";i++){if(g.pendingSetPiece){g=resolveSetPiece(g,"a");continue;}if(g.pendingCommand){g=resolveCommand(g,"a");continue;}const action=getSuggestion(g);assert.ok(action);g=playTurn(g,action.id,2);}assert.equal(g.status,"lost");
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
  if(sim.status==="response"){sim=resolveResponse(sim,"credential");sim=resolveResponse(sim,"verify");sim=resolveResponse(sim,"rebuild");}
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
  if(sim.status==="response"){sim=resolveResponse(sim,"credential");sim=resolveResponse(sim,"verify");sim=resolveResponse(sim,"rebuild");}
  assert.ok(["won","lost","exercise"].includes(sim.status));modeSimulations++;
}
console.log(`PASS: adaptive routes, hypotheses, command events, sector systems, specialists, advanced modes, response tradeoffs, counterfactuals and ${simulationCount+modeSimulations} complete simulations.`,totals);
