// Complete playthroughs: every mode, specialist and difficulty terminates.
import assert from "node:assert/strict";
import { test } from "node:test";
import {newGame,playTurn,resolveDecision,resolveResponse,resolveCommand,resolveSetPiece,resolveMapAction,correlateEvidence,setInfrastructureFocus,setHypothesis,setCaseTheory,scenarios,nextEvidenceSource,decisionChoices,difficulties,getTurnLimit,attackVector,getRuledOutRoutes,type DecisionChoice,type Difficulty,type Game,type GameMode,type SpecialistId,getReadingOdds} from "../lib/advanced-game.ts";
import {seededChallengeRandom} from "../lib/phase8.ts";
import {chooseBotAction,type BotAction} from "../lib/game-bot.ts";


test("terminates every simulated operation", () => {
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
});

test("the bot commander revises a reading the record has ruled out", () => {
  // It used to hold the route of its latest find for every remaining turn, which
  // is how it lost to the window with three stages confirmed. Here every
  // technique the identity route could be using at the first stage is ruled out
  // by completed empty checks; the bot's next move is to revise to a route that
  // is still open, read from the visible record alone.
  // Both identity techniques the first stage can use are visible to an identity
  // audit; phishing, on the compromised-host route, is not.
  let game=newGame(0,"operational",()=>0);
  game={...game,injectDeck:[],established:[],chain:["phish","printqueue","task","backup-out"]};
  game=setHypothesis(game,"identity");
  game=playTurn(game,"identity",20);
  assert.equal(game.revealed.length,0,"the audit completed and found nothing");
  const odds=getReadingOdds(game);
  assert.equal(odds.stage,0);
  assert.equal(odds.candidates.identity.open,0,"nothing the identity route could be using is left open");
  const action=chooseBotAction(game);
  assert.equal(action.type,"hypothesis","the bot changes its reading before running another procedure");
  if(action.type==="hypothesis"){
    assert.notEqual(action.hypothesis,"identity");
    assert.ok(odds.candidates[action.hypothesis].open>0,"to a route that is still open");
  }
});

test("never marks the route the hidden stage uses as ruled out", () => {
  // The comparison marks routes the record has excluded. The route the stage
  // under test actually uses can never be among them: a completed check that
  // could see its technique would have found it.
  const apply=(game:Game,action:BotAction):Game=>{
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
      case "procedure":return playTurn(game,action.procedure,undefined,action.plan);
      case "complete":return game;
    }
  };
  let checked=0,marked=0;
  for(let scenario=0;scenario<scenarios.length;scenario++)for(const difficulty of ["training","operational","crisis"] as Difficulty[])for(let run=0;run<4;run++){
    let game=newGame(scenario,difficulty,seededChallengeRandom(700000+scenario*10+run));
    game={...game,seed:700000+scenario*10+run};
    for(let step=0;step<160&&game.status==="playing";step++){
      const ruled=getRuledOutRoutes(game);
      const stage=getReadingOdds(game).stage;
      if(stage!==null){
        assert.ok(!ruled.routes.includes(attackVector(game.chain[stage])),`scenario ${scenario} ${difficulty}: the true route is never ruled out`);
        checked++;marked+=ruled.routes.length;
      }
      game=apply(game,chooseBotAction(game));
    }
  }
  assert.ok(checked>500&&marked>0,"the property was exercised and some routes were marked");
});
