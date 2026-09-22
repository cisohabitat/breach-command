// Data invariants the authored content has to keep.
import assert from "node:assert/strict";
import { test } from "node:test";
import {newGame,attacks,hypotheses,procedures,scenarios,infrastructureTopologies,sectorSystems} from "../lib/advanced-game.ts";
import {adversaryObjectives} from "../lib/command-systems.ts";
import {seededChallengeRandom} from "../lib/phase8.ts";


test("explains what each objective's outbound stage is for", () => {
  // Every assessed objective explains what its outbound stage is for, so a chain
  // ending in exfiltration never looks disconnected from the intent behind it.
  for(const [id,objective] of Object.entries(adversaryObjectives))assert.ok(objective.outbound.length>=80,`${id} explains its outbound stage`);
});

test("keeps the technique pool and topologies distinct", () => {
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
});

test("keeps every procedure inside the reasoning system", () => {
  // DNS review and Email investigation were listed by no route at all, so two of
  // the eleven procedures could never earn the planning bonus and only ever
  // turned up stages as windfalls. A player has no way to read that as anything
  // but the game contradicting itself.
  const listed = new Set(hypotheses.flatMap(item => item.procedures));
  const orphans = procedures.filter(item => !listed.has(item.id)).map(item => item.id);
  assert.deepEqual(orphans, [], "every procedure is predicted by at least one reading");

  // And a route only lists sources that mostly detect its own techniques. A route
  // list built from broad sources stops discriminating, which is the whole point
  // of declaring one.
  for (const hypothesis of hypotheses) {
    let own = 0;
    let all = 0;
    for (const attack of attacks) for (const source of attack.detect) if (hypothesis.procedures.includes(source)) { all++; if (attack.vector === hypothesis.id) own++; }
    assert.ok(own / all >= 0.3, `${hypothesis.id} predicts sources that mostly detect its own route (${Math.round(own / all * 100)}%)`);
  }

  // Every technique stays reachable through its own route, so no stage can only
  // ever be found by accident.
  for (const attack of attacks) {
    const route = hypotheses.find(item => item.id === attack.vector)!;
    assert.ok(attack.detect.some(source => route.procedures.includes(source)), `${attack.id} can be found by reasoning, not only by luck`);
  }
});
