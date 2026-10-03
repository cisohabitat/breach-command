// Persistent progression: standing, seniority, routes and endings.
import assert from "node:assert/strict";
import { test } from "node:test";
import {SPECIALIST_EXHAUSTED_AT,newGame,playTurn,type Game} from "../lib/advanced-game.ts";
import {campaignAct,campaignEnding,campaignReadable,defaultCampaign,parseCampaign,recordCampaignResult} from "../lib/campaign.ts";
import {campaignRoutes,incidentVariant,routeForCampaign} from "../lib/phase9.ts";


test("records a drill as something other than a defeat", () => {
  // A drill is not a defeat. It costs no trust, keeps the streak and leaves no
  // unresolved access, while a genuine loss still does all three.
  const commandRecord={...defaultCampaign,leadershipTrust:60,readiness:60,streak:3};
  const drillOperation={...newGame(0,"operational",()=>0),status:"exercise" as const};
  const afterDrill=recordCampaignResult(commandRecord,drillOperation,40);
  assert.equal(afterDrill.leadershipTrust,60,"a drill does not cost leadership trust");
  assert.equal(afterDrill.streak,3,"a drill does not break the streak");
  assert.equal(afterDrill.unresolvedThreads,0,"a drill leaves no unresolved access");
  assert.ok(afterDrill.readiness>60,"exercising the process builds readiness");
  const afterLoss=recordCampaignResult(commandRecord,{...drillOperation,status:"lost"},40);
  assert.ok(afterLoss.leadershipTrust<60&&afterLoss.streak===0&&afterLoss.unresolvedThreads===1,"a defeat still costs trust, the streak and an open thread");
  assert.ok(afterDrill.completed.includes(drillOperation.scenario),"a drill the investigation earned clears the case");
  assert.ok(!afterLoss.completed.includes(drillOperation.scenario),"a defeat leaves the case open");
});

test("lets campaign standing change the operation", () => {
  // Campaign standing changes what an operation has to work with, and a command
  // that keeps losing does not reach the same tier as one that keeps winning.
  const profile=(over:object)=>newGame(0,"operational",()=>0,{mode:"campaign",...over});
  const recruit=profile({campaignTier:0,readiness:50,leadershipTrust:50,unresolvedThreads:0});
  const decorated=profile({campaignTier:3,readiness:90,leadershipTrust:90,unresolvedThreads:0});
  const struggling=profile({campaignTier:1,readiness:20,leadershipTrust:25,unresolvedThreads:5});
  assert.ok(decorated.turnLimit>recruit.turnLimit&&recruit.turnLimit>struggling.turnLimit,"readiness moves the investigation window both ways");
  assert.ok(decorated.established.length>recruit.established.length,"seniority establishes more evidence sources");
  assert.ok(decorated.mapActionsRemaining>recruit.mapActionsRemaining,"seniority buys a command action");
  assert.ok(struggling.mapActionsRemaining<recruit.mapActionsRemaining,"lost leadership trust costs one");
  assert.ok(struggling.impact>recruit.impact&&struggling.objectiveProgress>recruit.objectiveProgress,"unresolved access is carried into the next operation");
  assert.ok(struggling.adversaryTempo>recruit.adversaryTempo,"past three open threads the actor opens with tempo");
  assert.equal(decorated.graceRemaining,1,"rapid coordination absorbs one unlucky action");
  assert.equal(recruit.graceRemaining,0);
  // The grace is spent once and only on an action that was not already protected.
  const graced=playTurn({...decorated,chain:["phish","spray","task","https"],established:[],injectDeck:[],hypothesis:null} as Game,"dns",2);
  assert.equal(graced.graceRemaining,0,"the grace is consumed");
  assert.equal(graced.adversaryTempo,decorated.adversaryTempo,"and the actor takes no tempo for that action");
  const afterGrace=playTurn(graced,"cloud",2);
  assert.ok(afterGrace.adversaryTempo>graced.adversaryTempo,"the next unlucky action costs as usual");
  // Seniority follows results.
  const record={...defaultCampaign,leadershipTrust:60,readiness:60,streak:2};
  const base=newGame(0,"operational",()=>0);
  const wonXp=recordCampaignResult(record,{...base,status:"won"},70).xp;
  const lostXp=recordCampaignResult(record,{...base,status:"lost"},70).xp;
  const drillXp=recordCampaignResult(record,{...base,status:"exercise"},70).xp;
  assert.ok(wonXp>drillXp&&drillXp>lostXp,"a win outranks a drill, and a drill outranks a defeat");
  assert.ok(lostXp>0,"a defeat still teaches something");
});

test("tracks acts, routes and campaign endings", () => {
  assert.equal(campaignAct(0).number,1);assert.equal(campaignAct(7).number,3);assert.equal(campaignEnding({...defaultCampaign,completed:[0,1,2,3,4,5,6,7,8,9],leadershipTrust:80,readiness:80})?.title,"Collective resilience");
  assert.equal(routeForCampaign({...defaultCampaign,completed:[0,1],commandPosture:{observe:4,act:0}}),"watchtower");
  assert.equal(campaignRoutes.breakwater.scenarios.length,3);assert.equal(incidentVariant(0,"common-ground",17).id,"0-2");
  assert.deepEqual(parseCampaign("{}").specialistBonds,{});assert.deepEqual(parseCampaign("{}").routeHistory,[]);
});

test("tells a damaged campaign record from a missing one", () => {
  // parseCampaign falls back to a new campaign either way, so the player is only
  // told their progress was unreadable when there was a record to read.
  assert.equal(campaignReadable(JSON.stringify(defaultCampaign)),true);
  assert.equal(campaignReadable("{}"),true,"an old record missing fields is still a record");
  for(const damaged of ["{broken","null","[]","42"])assert.equal(campaignReadable(damaged),false,`${damaged} is not a campaign`);
  assert.deepEqual(parseCampaign("null"),defaultCampaign);
});

test("rests the team between operations", () => {
  // Without rest, a player who kept the default specialist started every
  // operation after the first at five of six, where the bonus no longer applies.
  const game={...newGame(0,"operational",()=>0,{specialist:"hunter"}),status:"won" as const,specialistFatigue:5};
  const before={...defaultCampaign,specialistFatigue:{hunter:2,forensics:4}};
  const after=recordCampaignResult(before,game,80);
  assert.equal(after.specialistFatigue.hunter,4,"the deployed specialist recovers a point");
  assert.ok(after.specialistFatigue.hunter<SPECIALIST_EXHAUSTED_AT,"and is fit to earn the bonus again");
  assert.equal(after.specialistFatigue.forensics,2,"a benched specialist recovers two");
});

test("lets wins earn back trust that losses take away", () => {
  // At the old rate a typical win returned three points against a loss's eight,
  // and a quarter of completed campaigns ended on fractured trust.
  const won={...newGame(0,"operational",()=>0),status:"won" as const};
  const lost={...newGame(0,"operational",()=>0),status:"lost" as const};
  const start={...defaultCampaign,leadershipTrust:40};
  assert.equal(recordCampaignResult(start,won,73).leadershipTrust,44,"a typical win earns four");
  assert.equal(recordCampaignResult(start,won,52).leadershipTrust,41,"even a scrappy win earns one");
  assert.equal(recordCampaignResult(start,lost,30).leadershipTrust,32,"a loss still costs eight");
});
