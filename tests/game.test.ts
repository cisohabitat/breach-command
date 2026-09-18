import assert from "node:assert/strict";
// @ts-expect-error Native Node TypeScript execution requires the source extension.
import {newGame,playTurn,resolveDecision,resolveResponse,availableIn,attacks,procedures,scenarios,getSuggestion,difficulties,getOutcome,type Game} from "../lib/game.ts";

const baseline=()=>{const g=newGame(0,"operational",()=>0);g.chain=["phish","spray","task","https"];g.established=["endpoint","identity","server","network"];g.injectDeck=[4,7,0,1,2,3,5,6,8];return g;};
let g=baseline();
let n=playTurn(g,"endpoint",8);
assert.equal(n.turns[0].total,11);assert.equal(n.revealed[0],"phish");assert.equal(n.pendingDecision,"phish");assert.equal(g.turns.length,0);assert.equal(availableIn(n,"endpoint"),3);
assert.throws(()=>playTurn(n,"identity",20),/decision/);
n=resolveDecision(n,"preserve");assert.equal(n.nextModifier,2);assert.equal(n.impact,31);assert.equal(n.pendingDecision,null);
n=playTurn(n,"dns",9);assert.equal(n.turns[1].total,11);assert.equal(n.nextModifier,0);
assert.throws(()=>playTurn(n,"endpoint",15),/cooling/);
g=baseline();g=playTurn(g,"endpoint",20);assert.equal(g.turns[0].inject?.reason,"Natural 20");g=resolveDecision(g,"disrupt");assert.equal(g.nextModifier,-1);assert.equal(g.impact,19);
g=baseline();g=playTurn(g,"email",2);g=playTurn(g,"cloud",2);g=playTurn(g,"dns",2);assert.equal(g.turns[2].inject?.reason,"Three failed rolls");assert.equal(g.failures,0);
g=baseline();g.injectDeck=[2];g=playTurn(g,"endpoint",20);assert.equal(availableIn(g,"endpoint"),0,"restoration override");
g=baseline();g.injectDeck=[3];g=playTurn(g,"endpoint",20);assert.equal(g.revealed.length,2);assert.ok(g.pendingDecision);
g=baseline();g.injectDeck=[8];g=playTurn(g,"email",20);assert.equal(g.status,"exercise");
g=baseline();g.revealed=["phish","spray","task"];g=playTurn(g,"network",11);assert.equal(g.status,"playing");assert.ok(g.pendingDecision);g=resolveDecision(g,"disrupt");assert.equal(g.status,"response");
g=resolveResponse(g,"credential");assert.equal(g.status,"response");g=resolveResponse(g,"rebuild");assert.equal(g.status,"won");assert.ok(getOutcome(g).grade);
g=baseline();for(let i=0;i<10&&g.status==="playing";i++)g=playTurn(g,["email","cloud","dns","intel"][i%4],2);assert.equal(g.status,"lost");
const crisis=newGame(0,"crisis",()=>0);assert.equal(difficulties[crisis.difficulty].maxTurns,9);assert.equal(crisis.impact,34);
assert.throws(()=>playTurn(baseline(),"unknown",10),/Unknown/);assert.throws(()=>playTurn(baseline(),"endpoint",21),/Invalid/);assert.throws(()=>newGame(-1),/Unknown/);
for(const a of attacks){assert.ok(a.detect.length>=3);for(const id of a.detect)assert.ok(procedures.some(p=>p.id===id));}
for(const s of scenarios){assert.equal(s.choices.length,4);s.choices.forEach((choices,stage)=>choices.forEach(id=>assert.equal(attacks.find(a=>a.id===id)?.stage,stage)));}
const totals={won:0,lost:0,exercise:0};
for(let s=0;s<scenarios.length;s++)for(let attempt=0;attempt<40;attempt++){
  let sim:Game=newGame(s,"training");
  while(sim.status==="playing"){
    if(sim.pendingDecision){sim=resolveDecision(sim,sim.impact>55?"disrupt":"preserve");continue;}
    const action=getSuggestion(sim);assert.ok(action);sim=playTurn(sim,action.id);assert.ok(sim.turns.length<=11);assert.equal(new Set(sim.revealed).size,sim.revealed.length);
  }
  if(sim.status==="response"){sim=resolveResponse(sim,"credential");sim=resolveResponse(sim,"rebuild");}
  totals[sim.status as keyof typeof totals]++;
}
assert.equal(Object.values(totals).reduce((a,b)=>a+b,0),240);
console.log("PASS: uncertainty, difficulty, impact, evidence tradeoffs, response choices, cooldowns, injects, validation and 240 complete simulations.",totals);
