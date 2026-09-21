// Complete playthroughs: every mode, specialist and difficulty terminates.
import assert from "node:assert/strict";
import { test } from "node:test";
import {newGame,playTurn,resolveDecision,resolveResponse,resolveCommand,resolveSetPiece,resolveMapAction,correlateEvidence,setInfrastructureFocus,setHypothesis,setCaseTheory,scenarios,nextEvidenceSource,decisionChoices,difficulties,getTurnLimit,attackVector,type DecisionChoice,type Difficulty,type Game,type GameMode,type SpecialistId} from "../lib/advanced-game.ts";
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
