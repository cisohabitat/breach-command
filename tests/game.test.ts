import assert from "node:assert/strict";
// @ts-expect-error Native Node TypeScript execution requires the source extension.
import {newGame,playTurn,resolveDecision,resolveResponse,setHypothesis,availableIn,attacks,procedures,scenarios,getSuggestion,difficulties,getOutcome,getCounterfactuals,getDecisionOptions,getAdversaryState,attackVector,type Difficulty,type Game} from "../lib/advanced-game.ts";

const baseline=()=>{const g=newGame(0,"operational",()=>0);g.chain=["phish","spray","task","https"];g.established=["endpoint","identity","server","network"];g.injectDeck=[4,7,0,1,2,3,5,6,8];return g;};
let g=baseline();
let n=playTurn(g,"endpoint",8);
assert.equal(n.turns[0].total,11);assert.equal(n.revealed[0],"phish");assert.equal(n.pendingDecision,"phish");assert.equal(g.turns.length,0);assert.equal(availableIn(n,"endpoint"),3);
assert.throws(()=>playTurn(n,"identity",20),/decision/);
assert.equal(getDecisionOptions(n)?.observe.title,"Trace the access path");
n=resolveDecision(n,"observe");assert.equal(n.nextModifier,2);assert.equal(n.impact,30);assert.equal(n.pendingDecision,null);
n=playTurn(n,"dns",9);assert.equal(n.turns[1].total,11);assert.equal(n.nextModifier,0);assert.throws(()=>playTurn(n,"endpoint",15),/cooling/);
g=baseline();g=setHypothesis(g,"endpoint");g=playTurn(g,"endpoint",7);assert.equal(g.turns[0].planningBonus,1);assert.equal(g.turns[0].total,11);
g=baseline();g=playTurn(g,"endpoint",20);assert.equal(g.turns[0].inject?.reason,"Natural 20");const oldPivot=g.chain[1];g=resolveDecision(g,"act");assert.equal(g.nextModifier,-1);assert.equal(g.impact,18);assert.notEqual(g.chain[1],oldPivot);assert.ok(g.adversaryEvent);
g=baseline();g=playTurn(g,"email",2);g=playTurn(g,"cloud",2);g=playTurn(g,"dns",2);assert.equal(g.turns[2].inject?.reason,"Three failed rolls");assert.equal(g.failures,0);assert.ok(g.turns[2].adversaryEvent);assert.ok(g.continuity<100);
g=baseline();g.injectDeck=[2];g=playTurn(g,"endpoint",20);assert.equal(availableIn(g,"endpoint"),0,"restoration override");
g=baseline();g.injectDeck=[3];g=playTurn(g,"endpoint",20);assert.equal(g.revealed.length,2);assert.ok(g.pendingDecision);
g=baseline();g.injectDeck=[8];g=playTurn(g,"email",20);assert.equal(g.status,"exercise");
g=baseline();g.revealed=["phish","spray","task"];g=playTurn(g,"network",11);assert.ok(g.pendingDecision);g=resolveDecision(g,"act");assert.equal(g.status,"response");g=resolveResponse(g,"credential");assert.equal(g.status,"response");g=resolveResponse(g,"rebuild");assert.equal(g.status,"won");assert.ok(getOutcome(g).grade);assert.ok(getCounterfactuals(g).length);
g=baseline();for(let i=0;i<10&&g.status==="playing";i++)g=playTurn(g,["email","cloud","dns","intel"][i%4],2);assert.equal(g.status,"lost");
assert.equal(getAdversaryState(newGame(0,"crisis",()=>0)),"Maneuvering");assert.equal(difficulties.crisis.maxTurns,9);
assert.throws(()=>playTurn(baseline(),"unknown",10),/Unknown/);assert.throws(()=>playTurn(baseline(),"endpoint",21),/Invalid/);assert.throws(()=>newGame(-1),/Unknown/);
for(const a of attacks){assert.ok(a.detect.length>=3);for(const id of a.detect)assert.ok(procedures.some(p=>p.id===id));}
for(const s of scenarios){assert.equal(s.choices.length,4);s.choices.forEach((choices,stage)=>choices.forEach(id=>assert.equal(attacks.find(a=>a.id===id)?.stage,stage)));}

const totals={won:0,lost:0,exercise:0};
for(const difficulty of Object.keys(difficulties) as Difficulty[])for(let s=0;s<scenarios.length;s++)for(let attempt=0;attempt<30;attempt++){
  let sim:Game=newGame(s,difficulty);
  while(sim.status==="playing"){
    if(sim.pendingDecision){sim=resolveDecision(sim,sim.impact>52?"act":"observe");continue;}
    const next=sim.chain.find(id=>!sim.revealed.includes(id));if(next)sim=setHypothesis(sim,attackVector(next));
    const action=getSuggestion(sim);assert.ok(action);sim=playTurn(sim,action.id);assert.ok(sim.turns.length<=difficulties[difficulty].maxTurns);assert.equal(new Set(sim.revealed).size,sim.revealed.length);
  }
  if(sim.status==="response"){sim=resolveResponse(sim,"credential");sim=resolveResponse(sim,"rebuild");}
  totals[sim.status as keyof typeof totals]++;
}
assert.equal(Object.values(totals).reduce((a,b)=>a+b,0),540);
console.log("PASS: adaptive routes, hypotheses, sector pressure, contextual decisions, hidden response tradeoffs, counterfactuals and 540 complete simulations.",totals);
