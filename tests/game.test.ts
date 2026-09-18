import assert from 'node:assert/strict';
// @ts-expect-error Native Node TypeScript execution requires the source extension.
import {newGame,playTurn,availableIn,attacks,procedures,scenarios,getSuggestion, type Game} from '../lib/game.ts';

const baseline=()=>{const g=newGame(0,()=>0);g.chain=['phish','spray','task','https'];g.established=['endpoint','identity','server','network'];g.injectDeck=[4,7,0,1,2,3,5,6,8];return g;};
let g=baseline();
let n=playTurn(g,'endpoint',8);
assert.equal(n.turns[0].total,11);assert.equal(n.revealed.length,1);assert.equal(n.revealed[0],'phish');
assert.equal(g.turns.length,0);assert.equal(g.revealed.length,0);assert.equal(availableIn(n,'endpoint'),3);
assert.throws(()=>playTurn(n,'endpoint',15),/cooling/);
n=playTurn(n,'dns',10);assert.equal(availableIn(n,'endpoint'),2);
n=playTurn(n,'cloud',10);assert.equal(availableIn(n,'endpoint'),1);
n=playTurn(n,'email',11);assert.equal(availableIn(n,'endpoint'),0);
assert.equal(n.turns[3].success,true);assert.equal(n.turns[3].revealed,null);assert.equal(n.failures,0);
assert.equal(playTurn(baseline(),'endpoint',17).turns[0].inject,null,'modified 20 must not draw inject');
assert.equal(playTurn(baseline(),'endpoint',20).turns[0].inject?.reason,'Natural 20');
assert.equal(playTurn(baseline(),'endpoint',1).turns[0].success,false);
g=baseline();g=playTurn(g,'endpoint',2);g=playTurn(g,'identity',2);g=playTurn(g,'server',2);
assert.equal(g.turns[2].inject?.reason,'Three failed rolls');assert.equal(g.failures,0);assert.equal(g.injectDeck.length,8);
g=baseline();g.failures=2;g=playTurn(g,'endpoint',1);assert.equal(g.injectDeck.length,8,'overlapping triggers draw once');
g=baseline();g.injectDeck=[0,4];g=playTurn(g,'endpoint',20);assert.equal(g.nextModifier,2);
g=playTurn(g,'identity',6);assert.equal(g.turns[1].total,11);assert.equal(g.nextModifier,0);
g=baseline();g.injectDeck=[2];g=playTurn(g,'endpoint',20);assert.equal(availableIn(g,'endpoint'),0,'restoration override');
g=baseline();g.injectDeck=[3];g=playTurn(g,'endpoint',20);assert.equal(g.revealed.length,2);assert.equal(g.turns[0].injectReveal,'spray');
g=baseline();g.injectDeck=[8];g=playTurn(g,'endpoint',20);assert.equal(g.status,'exercise');assert.throws(()=>playTurn(g,'identity',20),/ended/);
g=baseline();g.revealed=['phish','spray','task'];g.injectDeck=[8];g=playTurn(g,'network',20);assert.equal(g.status,'won','victory takes precedence');
g=baseline();for(let i=0;i<10;i++){g=playTurn(g,['email','cloud','dns','intel'][i%4],11);}assert.equal(g.status,'lost');assert.equal(g.turns.length,10);
g=baseline();g.revealed=['phish','spray','task'];for(let i=0;i<9;i++)g=playTurn(g,['email','cloud','dns','forensic'][i%4],11);g=playTurn(g,'network',11);assert.equal(g.status,'won','turn 10 counts');
assert.throws(()=>playTurn(baseline(),'unknown',10),/Unknown/);assert.throws(()=>playTurn(baseline(),'endpoint',21),/Invalid/);
assert.throws(()=>newGame(-1),/Unknown/);
for(const a of attacks){assert.ok(a.detect.length>=3);for(const id of a.detect)assert.ok(procedures.some(p=>p.id===id));}
const totals={won:0,lost:0,exercise:0};
for(let s=0;s<scenarios.length;s++)for(let attempt=0;attempt<100;attempt++){
  let sim:Game=newGame(s);assert.equal(new Set(sim.established).size,4);sim.chain.forEach((id,stage)=>assert.equal(attacks.find(a=>a.id===id)?.stage,stage));
  while(sim.status==='playing'){const action=getSuggestion(sim);assert.ok(action);sim=playTurn(sim,action.id);assert.ok(sim.turns.length<=10);assert.equal(new Set(sim.revealed).size,sim.revealed.length);}
  totals[sim.status]++;
}
console.log('PASS: setup, thresholds, one-stage reveals, immutability, cooldowns, all inject effects, overlapping triggers, turn-10 results, invalid actions and 600 complete simulated investigations.',totals);
