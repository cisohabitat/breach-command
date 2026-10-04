// Data invariants the authored content has to keep.
import assert from "node:assert/strict";
import { test } from "node:test";
import {newGame,attacks,hypotheses,procedures,responseProfiles,scenarios,infrastructureTopologies,sectorSystems} from "../lib/advanced-game.ts";
import {sectorSetPieces} from "../lib/phase8.ts";
import {hypothesisSources, proceduresFor, sectorProcedures} from "../lib/advanced-game.ts";
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
  // The pool grows as sectors get techniques of their own, so assert the property
  // that matters — every stage draws from a pool of the same size — rather than a
  // count that turns each authored addition into a test edit.
  const perStage=[0,1,2,3].map(stage=>attacks.filter(a=>a.stage===stage).length);
  assert.ok(perStage.every(count=>count>=18),`each stage has at least eighteen techniques, found ${perStage.join(", ")}`);
  assert.equal(new Set(perStage).size,1,`every stage draws from a pool of the same size, found ${perStage.join(", ")}`);
  assert.equal(new Set(attacks.map(a=>a.id)).size,attacks.length,"technique ids are unique");
  const detectSignatures=new Set(attacks.map(a=>[...a.detect].sort().join("+")));
  assert.ok(detectSignatures.size>=40,`expected many distinct detect signatures, found ${detectSignatures.size}`);
  const procedureShare=procedures.map(p=>attacks.filter(a=>a.detect.includes(p.id)).length);
  assert.ok(Math.max(...procedureShare)<=attacks.length*0.4,`no procedure dominates the pool, max ${Math.max(...procedureShare)} of ${attacks.length}`);
  for(const s of scenarios){assert.equal(s.choices.length,4);s.choices.forEach((choices,stage)=>{assert.equal(choices.length,4,`${s.id} stage ${stage} must offer four techniques`);choices.forEach(id=>assert.equal(attacks.find(a=>a.id===id)?.stage,stage,`${s.id}/${id} must belong to stage ${stage}`));});}
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

test("makes the cheap response option a different call in each sector", () => {
  // The assurance shortcut and the patch-in-place recovery used to be identical
  // in all ten profiles — same title, same disruption, confidence, residual and
  // score — with only the description reworded. That is what taught players to
  // reuse one pattern from sector five onward instead of reading the sector.
  for (const [id, phase] of [["accelerate", "assurance"], ["patch", "recovery"]] as const) {
    const options = responseProfiles.map(profile => profile[phase].find(item => item.id === id)!).filter(Boolean);
    assert.equal(options.length, responseProfiles.length, `every sector offers ${id}`);
    const scores = options.map(item => item.score);
    assert.ok(Math.max(...scores) - Math.min(...scores) >= 5, `${id} is worth materially more in some sectors than others`);
    assert.equal(new Set(options.map(item => item.title)).size, responseProfiles.length, `${id} is named for its own sector`);

    // And the labels the player reads before choosing agree with the score, so
    // the warning arrives before the decision rather than in the debrief.
    for (const option of options) {
      const lenient = option.confidence === "Moderate" && option.residual === "Moderate";
      const severe = option.confidence === "Limited" && option.residual === "High";
      if (lenient) assert.ok(option.score >= 9, `${option.title} reads defensible and scores like it`);
      if (severe) assert.ok(option.score <= 6, `${option.title} reads reckless and scores like it`);
    }
  }
});

test("gives each sector a chain it could not lend to another", () => {
  // A chain assembled entirely from the shared pool reads as the sector's
  // vocabulary painted onto a generic incident. Every scenario keeps at least two
  // techniques no other scenario can draw, so moving the chain to another sector
  // would mean changing the technical nouns, not just the briefing.
  const uses: Record<string, number> = {};
  for (const scenario of scenarios) for (const id of scenario.choices.flat()) uses[id] = (uses[id] ?? 0) + 1;
  // Nothing authored may be unreachable. Rewiring a scenario's pool is how a
  // technique quietly stops existing: `ci` sat in the deck for a round with no
  // scenario able to draw it.
  const orphans = attacks.filter(attack => !uses[attack.id]).map(attack => attack.id);
  assert.deepEqual(orphans, [], "every technique is drawn by at least one scenario");

  for (const scenario of scenarios) {
    const exclusive = scenario.choices.flat().filter(id => uses[id] === 1);
    assert.ok(exclusive.length >= 3, `${scenario.sector} keeps techniques of its own (${exclusive.length}: ${exclusive.join(", ") || "none"})`);
  }
});

test("puts three routes in play at every stage", () => {
  // The readings mark routes no technique at the stage travels by. With two
  // routes in play at most stages and one at six, those marks handed over most
  // of the answer before a single check; every stage now offers at least three.
  for (const scenario of scenarios) scenario.choices.forEach((ids, stage) => {
    const routes = new Set(ids.map(id => attacks.find(attack => attack.id === id)!.vector));
    assert.ok(routes.size >= 3, `${scenario.id} stage ${stage} puts ${routes.size} routes in play`);
  });
  // A technique a sector borrows is seen through shared sources or that sector's
  // own action, never through another sector's, which it does not have.
  const shared = new Set(procedures.map(procedure => procedure.id));
  scenarios.forEach((scenario, index) => {
    for (const id of scenario.choices.flat()) {
      const foreign = attacks.find(attack => attack.id === id)!.detect.filter(source => !shared.has(source) && source !== sectorProcedures[index].id);
      assert.deepEqual(foreign, [], `${scenario.id} draws ${id}, which only another sector's action can see`);
    }
  });
});

test("offers a graduated measure in every sector decision", () => {
  // "Stop it" or "carry on" is not the shape of a real incident decision. Every
  // sector decision carries a narrow middle measure, and it earns its place by
  // costing effort rather than by dominating: it protects less than the decisive
  // option and concedes less than the permissive one.
  for (const piece of sectorSetPieces) {
    const { a, b, c } = piece;
    assert.ok(c.title && c.detail.length > 30, `${piece.id} states what the middle measure actually does`);
    assert.equal(new Set([a.title, b.title, c.title]).size, 3, `${piece.id} offers three distinct measures`);
    assert.ok(c.objective > a.objective, `${piece.id}: the narrow measure slows the adversary less than the decisive one`);
    assert.ok(c.objective < b.objective, `${piece.id}: and more than carrying on regardless`);
    assert.ok(c.sector < a.sector && c.sector > b.sector, `${piece.id}: its sector effect sits between the two`);
    assert.ok(c.continuity >= a.continuity, `${piece.id}: it never costs more service than the decisive option`);
    assert.ok(c.quality >= 4, `${piece.id}: applying a control narrowly is defensible command judgement`);
    // A narrow measure that improved every meter was no decision at all: two
    // laptop playtests took it every time and read it as free.
    assert.ok(c.impact > 0 || c.continuity < 0 || c.sector < 0 || c.objective > 0, `${piece.id}: the narrow measure costs something`);
  }
});

test("gives every sector an investigative action of its own", () => {
  // The eleven shared procedures are right — responders use the same evidence
  // sources everywhere — but each sector also has a reconciliation only its own
  // people would run. It has to be a procedure in every sense: offered in its own
  // scenario, able to find something there, and able to earn the planning bonus.
  assert.equal(sectorProcedures.length, scenarios.length, "one per scenario");
  assert.equal(new Set(sectorProcedures.map(item => item.id)).size, sectorProcedures.length, "with distinct ids");
  const shared = new Set(procedures.map(item => item.id));
  for (const sector of sectorProcedures) assert.ok(!shared.has(sector.id), `${sector.id} is not one of the shared procedures`);

  for (let index = 0; index < scenarios.length; index++) {
    const game = newGame(index, "operational");
    const sector = sectorProcedures[index];
    const offered = proceduresFor(game);
    assert.equal(offered.length, procedures.length + 1, `${scenarios[index].sector} offers the shared set plus its own`);
    assert.ok(offered.some(item => item.id === sector.id), `${scenarios[index].sector} offers ${sector.id}`);
    // Only in its own scenario.
    for (const other of sectorProcedures) {
      if (other.id !== sector.id) assert.ok(!offered.some(item => item.id === other.id), `${sector.id} does not appear outside its sector`);
    }
    // It can expose something in the scenario it belongs to.
    const reachable = scenarios[index].choices.flat().filter(id => attacks.find(attack => attack.id === id)!.detect.includes(sector.id));
    assert.ok(reachable.length >= 1, `${sector.id} can expose a technique this scenario draws`);
    // And declaring its route makes it one of that reading's own sources.
    assert.ok(hypothesisSources(game, sector.vector).includes(sector.id), `${sector.id} earns the planning bonus under ${sector.vector}`);
    for (const route of hypotheses) {
      if (route.id !== sector.vector) assert.ok(!hypothesisSources(game, route.id).includes(sector.id), `${sector.id} only aligns with its own route`);
    }
  }
});

test("states each finding, never the log that held it", () => {
  // "Proxy and intelligence records reveal …" read as wrong when another source
  // found it; eight techniques still led with the records.
  for (const attack of attacks) assert.ok(!/\b(records?|artefacts|history|logs|traces|telemetry|analysis|configuration and [a-z ]+) (show|shows|reveal|reveals|link|links|tie|ties|connect|connects|correlate|correlates|identify|identifies|establish|establishes)\b/i.test(attack.evidence), `${attack.id} states its finding, not its source`);
});
