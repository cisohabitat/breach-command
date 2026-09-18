import { Building2, HeartPulse, Factory, Ship, Cloud, Network } from "lucide-react";

export const stages = [
  {name:"Initial compromise",short:"Entry",color:"#ff967d"},
  {name:"Pivot & escalate",short:"Movement",color:"#e8c968"},
  {name:"Persistence",short:"Foothold",color:"#b49cf4"},
  {name:"C2 & exfiltration",short:"Outbound",color:"#75b9e7"},
];

export const procedures = [
  {id:"endpoint",title:"Endpoint analysis",short:"Processes, execution and host alerts",description:"Examine endpoint telemetry for unusual processes, parent-child relationships and changes to the host.",question:"Which process ran, under whose identity, and what changed?"},
  {id:"identity",title:"Identity audit",short:"Sign-ins, permissions and account changes",description:"Correlate authentication records, group membership and account changes across the identity platform.",question:"Are these sign-ins and privileges consistent with normal activity?"},
  {id:"network",title:"Network analysis",short:"Traffic patterns and east-west activity",description:"Review network flows and packet metadata to identify unusual destinations or movement between systems.",question:"Which systems communicated, and does that path make sense?"},
  {id:"firewall",title:"Firewall review",short:"Boundary connections and egress",description:"Inspect firewall sessions, blocked traffic and remote-access connection records at the relevant boundaries.",question:"What crossed the boundary, when, and in which direction?"},
  {id:"email",title:"Email investigation",short:"Messages, links and delivery traces",description:"Review message headers, delivery logs and suspicious attachments associated with the reported activity.",question:"Was a message or link used to establish the first foothold?"},
  {id:"server",title:"Server inspection",short:"Services, jobs and application logs",description:"Inspect server application logs, services and configuration changes for unexpected execution or access.",question:"Which server-side change or request explains the incident?"},
  {id:"cloud",title:"Cloud audit",short:"API activity, tokens and cloud roles",description:"Correlate control-plane audit events, workload identity activity and API permissions in the cloud environment.",question:"Which identity called which API, and from where?"},
  {id:"dns",title:"DNS review",short:"Lookups, new domains and beaconing",description:"Examine resolver records for repetitive lookups, unusual domains and encoded query patterns.",question:"Do the domain queries expose a communication channel?"},
  {id:"hunt",title:"Targeted threat hunt",short:"Cross-source hypothesis testing",description:"Test a specific hypothesis across endpoint and network telemetry to identify behaviour missed by alerts.",question:"What observable behaviour would confirm our current hypothesis?"},
  {id:"forensic",title:"Forensic triage",short:"Disk, memory and execution artefacts",description:"Collect and analyse preserved artefacts from a suspected host, including execution traces and configuration changes.",question:"What durable artefacts reconstruct how access was established or retained?"},
  {id:"intel",title:"Intelligence correlation",short:"Known infrastructure and indicators",description:"Compare observed destinations and suspicious artefacts against available threat intelligence, while checking context.",question:"Does known malicious infrastructure help explain our observations?"},
];

export type Attack = {id:string;stage:number;title:string;detect:string[];clue:string;evidence:string};
export const attacks: Attack[] = [
  {id:"phish",stage:0,title:"Phishing attachment",detect:["email","endpoint","forensic"],clue:"A document opened shortly before the first host anomaly.",evidence:"Message traces and process ancestry link a delivered attachment to the first malicious execution."},
  {id:"vpn",stage:0,title:"Stolen remote-access account",detect:["identity","firewall","network"],clue:"A valid remote session falls outside its owner’s normal pattern.",evidence:"Remote-access records show a valid account used from an unfamiliar source without corresponding user activity."},
  {id:"web",stage:0,title:"Exploited public application",detect:["server","firewall","forensic"],clue:"Unusual application requests precede unexpected server execution.",evidence:"Application logs tie malformed requests to server-side execution at the start of the incident."},
  {id:"token",stage:0,title:"Exposed cloud credential",detect:["cloud","identity","hunt"],clue:"An automation identity is active outside its workload boundary.",evidence:"Cloud audit records show a workload credential used from outside the approved execution environment."},
  {id:"supply",stage:0,title:"Compromised software update",detect:["endpoint","network","intel"],clue:"Several hosts changed soon after a trusted package was deployed.",evidence:"Package telemetry and process records connect a signed update path to malicious execution on multiple hosts."},
  {id:"oauth",stage:0,title:"Malicious application consent",detect:["identity","cloud","email"],clue:"A user-approved application has begun reading data it never accessed before.",evidence:"Consent and API logs show a deceptive application receiving delegated access to the user’s data."},
  {id:"spray",stage:1,title:"Internal password spraying",detect:["identity","network","hunt"],clue:"Scattered authentication failures are followed by a few successes.",evidence:"A single internal source tries common passwords across many accounts, then authenticates successfully."},
  {id:"remote",stage:1,title:"Remote service execution",detect:["endpoint","network","server"],clue:"An ordinary workstation is making unusual administrative connections.",evidence:"Host and traffic records show remote administrative sessions creating processes on additional systems."},
  {id:"role",stage:1,title:"Cloud role escalation",detect:["cloud","identity","hunt"],clue:"A workload begins using resources beyond its normal permission boundary.",evidence:"An over-permissive role relationship lets the compromised identity assume an elevated cloud role."},
  {id:"dump",stage:1,title:"Credential theft from memory",detect:["endpoint","forensic","hunt"],clue:"A process accessed authentication-related memory without a normal reason.",evidence:"Process-access records and memory artefacts show credential material extracted for additional access."},
  {id:"session",stage:1,title:"Session token replay",detect:["identity","cloud","network"],clue:"The same user session appears in two incompatible locations.",evidence:"Token and access records show a captured session replayed to reach additional services."},
  {id:"trust",stage:1,title:"Trusted service abuse",detect:["server","cloud","network"],clue:"A permitted service path is reaching systems outside its normal dependency map.",evidence:"Service and network records show a trusted integration being used to cross into another environment."},
  {id:"task",stage:2,title:"Malicious scheduled task",detect:["endpoint","server","forensic"],clue:"The same unsigned process returns at regular intervals after termination.",evidence:"A newly created scheduled task relaunches the attacker’s payload at fixed intervals."},
  {id:"account",stage:2,title:"Hidden privileged account",detect:["identity","server","hunt"],clue:"An unexplained account appears in a privileged group.",evidence:"Account-creation and group-change records establish an unapproved privileged identity controlled by the attacker."},
  {id:"webshell",stage:2,title:"Web-shell foothold",detect:["server","forensic","endpoint"],clue:"A recently modified server file launches unusual child processes.",evidence:"A server-side file accepts remote commands and keeps access available through the application."},
  {id:"key",stage:2,title:"Additional access key",detect:["cloud","identity","hunt"],clue:"A new programmatic credential lacks a corresponding change record.",evidence:"Cloud control-plane records show a second access key created to preserve attacker access."},
  {id:"service",stage:2,title:"Rogue system service",detect:["endpoint","server","forensic"],clue:"A new service starts before users sign in and survives a reboot.",evidence:"Service configuration and execution artefacts reveal a persistent malicious binary."},
  {id:"federation",stage:2,title:"Federated trust backdoor",detect:["cloud","identity","server"],clue:"Authentication trust settings changed outside the maintenance window.",evidence:"Control-plane history shows a rogue federation relationship created to maintain privileged access."},
  {id:"https",stage:3,title:"Encrypted web exfiltration",detect:["network","firewall","intel"],clue:"A system repeatedly uploads data to a rarely used web destination.",evidence:"Egress records and destination correlation identify sustained uploads to attacker-controlled infrastructure."},
  {id:"dnsout",stage:3,title:"DNS covert channel",detect:["dns","network","hunt"],clue:"Resolver telemetry contains long, repetitive subdomains.",evidence:"High-entropy DNS queries carry encoded data to an externally controlled domain."},
  {id:"storage",stage:3,title:"Cloud storage export",detect:["cloud","network","firewall"],clue:"Bulk object reads coincide with an outbound transfer spike.",evidence:"Object-access and transfer records correlate bulk retrieval with export to an unapproved destination."},
  {id:"beacon",stage:3,title:"Periodic command beacon",detect:["network","dns","intel"],clue:"Short outbound connections repeat at unusually consistent intervals.",evidence:"Time-series analysis identifies a periodic command channel to new external infrastructure."},
  {id:"saas",stage:3,title:"SaaS synchronisation abuse",detect:["cloud","identity","network"],clue:"An approved synchronisation client suddenly moves far more data than usual.",evidence:"Application and identity logs show a legitimate integration used to export protected records."},
  {id:"deadrop",stage:3,title:"Public dead-drop channel",detect:["intel","network","firewall"],clue:"Hosts poll a common public service with an uncommon request pattern.",evidence:"Proxy and intelligence records reveal commands hidden in content on a public platform."},
];

export type Scenario = {id:string;icon:typeof Building2;sector:string;title:string;summary:string;brief:string;scope:string;timeline:string;constraints:string;impact:string;lesson:string;leads:string[];choices:string[][];preferred:[string,string]};
export const scenarios: Scenario[] = [
  {id:"quiet-office",icon:Building2,sector:"ENTERPRISE IT",title:"The quiet intrusion",summary:"An ordinary morning. An unusual sign-in. A foothold hidden in the noise.",brief:"It is 08:40. Two staff report unusual workstation behaviour, while a routine check shows unexpected outbound traffic. Business applications still operate. Determine how access was gained and what followed.",scope:"Employee endpoints, identity services, remote access and internal application servers. Only simulated evidence is used.",timeline:"Reports began this morning. The evidence window covers the preceding 24 hours.",constraints:"Telemetry is incomplete. A successful action is not proof that an attack technique is absent.",impact:"Payroll and shared business applications remain available, but confidence in privileged identities is falling.",lesson:"Could your team connect an endpoint report, an identity event and outbound traffic without treating them as separate incidents?",leads:["Two weak signals overlap: a user complaint and an outbound-traffic anomaly. Neither identifies the entry point.","Authentication, endpoint and egress timestamps do not align cleanly. Establish which record is causal.","The attacker may be using a legitimate identity or a legitimate-looking process. Test one explanation at a time."],choices:[["phish","vpn","oauth"],["spray","dump","session"],["task","account","service"],["https","beacon","saas"]],preferred:["credential","rebuild"]},
  {id:"care-network",icon:HeartPulse,sector:"HEALTHCARE",title:"After the night shift",summary:"Clinical services remain live while unfamiliar activity spreads behind the scenes.",brief:"At a fictional hospital, overnight staff report a sluggish workstation and unfamiliar remote sessions. Patient-facing services remain available. Investigate without assuming shutdown is the safe first action.",scope:"Administrative endpoints, the support gateway, identity services and clinical application servers. Medical devices are outside this attack chain.",timeline:"The first anomalies occurred during the night shift. Records cover that shift and the previous working day.",constraints:"Clinical continuity matters. Isolation can reduce risk but may interrupt time-sensitive work.",impact:"Patient care is continuing. The greatest immediate risk is loss of access to supporting records and scheduling.",lesson:"Who would authorise isolation of a system supporting clinical work, and what evidence would they need?",leads:["A slow endpoint and unfamiliar remote sessions may share a cause, or may be unrelated operational noise.","Support accounts cross several services during the night shift. Some of that activity is expected.","The safest investigative path is not automatically the fastest containment path."],choices:[["phish","vpn","supply"],["remote","spray","session"],["task","account","service"],["https","dnsout","saas"]],preferred:["credential","restore"]},
  {id:"power-support",icon:Factory,sector:"ENERGY / OT SUPPORT",title:"Beyond the gateway",summary:"A supplier session raises questions at the boundary of plant support systems.",brief:"A fictional power operator sees an unusual supplier session to its maintenance environment. A support server later makes unfamiliar connections. Generation remains stable. Reconstruct the support-system compromise.",scope:"Supplier remote access, the maintenance jump host, identity services and support servers. Controllers and safety systems are not in scope.",timeline:"The suspicious session started after the approved maintenance window. Review the next twelve hours.",constraints:"Investigation is read-only. Distinguish a support-system breach from a process-safety event.",impact:"Generation is stable, but support access cannot yet be trusted. A rushed shutdown could introduce its own operational risk.",lesson:"Could you revoke supplier access without losing essential operational support, and who owns that decision?",leads:["A supplier session and server traffic are correlated in time, but not yet proven to share an identity.","The support environment has legitimate remote administration that can resemble lateral movement.","Boundary records are strong; host telemetry on the jump server has gaps."],choices:[["vpn","web","supply"],["remote","dump","trust"],["task","webshell","service"],["beacon","https","deadrop"]],preferred:["monitor","rebuild"]},
  {id:"port-terminal",icon:Ship,sector:"MARITIME",title:"A terminal under watch",summary:"A booking portal anomaly arrives during a busy operating window.",brief:"A fictional container terminal reports unusual requests to its booking portal. Support staff then spot unexplained server activity. Vessel operations continue. Establish the attack chain before the window closes.",scope:"The booking portal, application servers, identity services and business network. Crane control systems are excluded.",timeline:"Portal anomalies began at 05:30, followed by internal activity during the morning shift.",constraints:"Busy operations hide suspicious traffic. Preserve evidence before disruptive changes.",impact:"Bookings continue, but partner data and vessel schedules may be exposed if the portal is not trustworthy.",lesson:"Which partners need early warning if an operational dependency can no longer be trusted?",leads:["A burst of portal requests could be partner traffic, automated abuse or exploitation.","Server activity follows the anomaly, but the available logs cannot yet prove direction of travel.","Partner identities and public application traffic overlap in the same time window."],choices:[["web","vpn","oauth"],["remote","spray","trust"],["webshell","account","federation"],["https","dnsout","deadrop"]],preferred:["isolate","restore"]},
  {id:"cloud-control",icon:Cloud,sector:"CLOUD SERVICES",title:"An identity out of place",summary:"An automation account begins acting beyond its normal workload.",brief:"A fictional cloud provider detects unusual control-plane activity and an egress-cost spike. No scheduled deployment explains either. Investigate the identity, permission path and mechanism maintaining access.",scope:"Workload credentials, access management, control-plane logs and object-storage activity. No real cloud account is connected.",timeline:"The anomaly began several hours after the last approved deployment.",constraints:"Successful API calls can still be malicious. Attribute the caller before assuming the credential’s owner acted.",impact:"Customer workloads are online. Unchecked privilege expansion could expose multiple tenants and increase transfer costs.",lesson:"Could you rotate a compromised workload credential safely and identify every role and key derived from it?",leads:["Valid API calls and higher transfer volume are the only confirmed facts.","The credential owner, execution location and assumed role may be three different things.","A permission change can explain movement, persistence or normal deployment activity."],choices:[["token","oauth"],["role","session","trust"],["key","federation"],["storage","https","saas"]],preferred:["credential","rebuild"]},
  {id:"shared-services",icon:Network,sector:"DIGITAL INFRASTRUCTURE",title:"A trusted connection",summary:"A shared-service identity links an isolated alert to a wider incident.",brief:"A fictional shared-services operator sees an unfamiliar session under a trusted support identity. A dependent application later reports unexpected access. Service remains available, but scope is unclear.",scope:"Remote support, identity services, shared application servers and outbound records. Connected organisations are not directly accessible.",timeline:"Anomalies cluster around the last support window. Begin with the shared service’s own evidence.",constraints:"Do not assume trust extends across every connected service. Separate confirmed evidence from partner reports.",impact:"Dependent organisations still receive service, but each additional minute increases the chance of propagating bad trust decisions.",lesson:"What evidence can you share promptly, and how will you separate confirmed facts from assumptions?",leads:["A trusted identity appears in two environments, but only one side has complete telemetry.","The dependent application report may reveal scope, or may be a separate incident.","Trust relationships make legitimate administration and attacker movement look similar."],choices:[["vpn","phish","supply"],["spray","remote","session"],["account","task","federation"],["beacon","dnsout","deadrop"]],preferred:["credential","patch"]},
];

export type Difficulty = "training"|"operational"|"crisis";
export const difficulties: Record<Difficulty,{title:string;description:string;threshold:number;maxTurns:number;startImpact:number}> = {
  training:{title:"Training",description:"More time, clearer margin for experimentation.",threshold:10,maxTurns:11,startImpact:14},
  operational:{title:"Operational",description:"Balanced uncertainty, pressure and time.",threshold:11,maxTurns:10,startImpact:22},
  crisis:{title:"Crisis",description:"Tighter rolls, fewer turns and higher starting impact.",threshold:12,maxTurns:9,startImpact:34},
};

const injects = [
  {id:"expert",title:"A specialist joins",text:"A responder helps focus the next investigative plan.",effect:"bonus",effectLabel:"+2 to the next procedure roll."},
  {id:"delay",title:"Access approval delayed",text:"Coordination friction slows the next action while business impact grows.",effect:"penalty",effectLabel:"−2 to the next roll; impact +6."},
  {id:"restored",title:"Collection pipeline restored",text:"A repaired pipeline lets you revisit a used procedure early.",effect:"restore",effectLabel:"One cooling-down procedure becomes available."},
  {id:"partner",title:"Partner shares evidence",text:"A trusted partner supplies a validated finding.",effect:"reveal",effectLabel:"One hidden stage is revealed, if any remain."},
  {id:"press",title:"Leadership wants an update",text:"Leaders ask whether the essential service is safe. Uncertainty carries a cost.",effect:"pressure",effectLabel:"Impact +8."},
  {id:"backup",title:"A useful evidence copy",text:"Retained telemetry improves the next investigation.",effect:"bonus",effectLabel:"+2 to the next procedure roll."},
  {id:"noise",title:"An alert flood",text:"Unrelated alerts reduce analyst attention and delay decisions.",effect:"penalty",effectLabel:"−2 to the next roll; impact +6."},
  {id:"operations",title:"Operations stabilises service",text:"A workaround buys the investigation team time.",effect:"relief",effectLabel:"Impact −8."},
  {id:"exercise",title:"Authorised exercise confirmed",text:"The controller confirms that the activity belongs to an authorised test.",effect:"end",effectLabel:"Exercise ends."},
];

type Inject = typeof injects[number] & {reason:string};
export type Turn = {number:number;procedure:string;raw:number;modifier:number;total:number;success:boolean;revealed:string|null;narrative:string;inject:Inject|null;injectReveal:string|null;impactChange:number};
export type DecisionRecord = {stage:string;choice:"preserve"|"disrupt";title:string;effect:string};
export type GameStatus = "playing"|"response"|"won"|"lost"|"exercise";
export type Game = {scenario:number;difficulty:Difficulty;chain:string[];revealed:string[];established:string[];lastUsed:Record<string,number>;turns:Turn[];failures:number;nextModifier:number;injectDeck:number[];status:GameStatus;impact:number;pendingDecision:string|null;decisions:DecisionRecord[];responseChoices:string[];responseScore:number;continuity:number};

export const responseOptions = {
  containment:[
    {id:"isolate",title:"Isolate affected systems",description:"Cuts attacker access quickly, but may interrupt service.",impact:-24,continuity:-14,score:12},
    {id:"credential",title:"Revoke identities and sessions",description:"Constrains identity-led movement with moderate operational disruption.",impact:-17,continuity:-5,score:11},
    {id:"monitor",title:"Monitor while mapping scope",description:"Preserves visibility and continuity, but allows risk to persist.",impact:5,continuity:5,score:9},
  ],
  recovery:[
    {id:"rebuild",title:"Rebuild from trusted baseline",description:"Highest confidence, longest service interruption.",impact:-18,continuity:-13,score:14},
    {id:"restore",title:"Restore validated backups",description:"Faster recovery if backup integrity is sound.",impact:-12,continuity:2,score:11},
    {id:"patch",title:"Patch in place and monitor",description:"Fastest return, with more residual uncertainty.",impact:-6,continuity:8,score:7},
  ],
};

export function randomInt(max:number) {if(typeof crypto!=="undefined"&&crypto.getRandomValues){const limit=Math.floor(0x100000000/max)*max;const value=new Uint32Array(1);do{crypto.getRandomValues(value)}while(value[0]>=limit);return value[0]%max;}return Math.floor(Math.random()*max);}
function shuffle<T>(array:T[],random=(max:number)=>randomInt(max)){const result=[...array];for(let i=result.length-1;i>0;i--){const j=random(i+1);[result[i],result[j]]=[result[j],result[i]];}return result;}
const clamp=(n:number)=>Math.max(0,Math.min(100,n));

export function newGame(scenario:number,difficulty:Difficulty="operational",random=(max:number)=>randomInt(max)):Game {
  if(!Number.isInteger(scenario)||!scenarios[scenario])throw new Error("Unknown incident");
  if(!difficulties[difficulty])throw new Error("Unknown difficulty");
  return {scenario,difficulty,chain:scenarios[scenario].choices.map(options=>options[random(options.length)]),revealed:[],established:shuffle(procedures.map(p=>p.id),random).slice(0,4),lastUsed:{},turns:[],failures:0,nextModifier:0,injectDeck:shuffle(injects.map((_,i)=>i),random),status:"playing",impact:difficulties[difficulty].startImpact,pendingDecision:null,decisions:[],responseChoices:[],responseScore:0,continuity:100};
}

export function availableIn(game:Game,id:string){return game.lastUsed[id]===undefined?0:Math.max(0,game.lastUsed[id]+4-(game.turns.length+1));}
export function getLead(game:Game){const s=scenarios[game.scenario];const index=Math.min(s.leads.length-1,Math.floor(game.turns.length/3));return s.leads[index];}
export function getCoachPrompt(game:Game){
  if(game.pendingDecision)return "Decide whether immediate disruption or better evidence matters more at this moment.";
  if(game.impact>=70)return "Impact is high. Prefer actions that can confirm the most dangerous live hypothesis, not the easiest data source.";
  if(!game.revealed.length)return "Name two plausible entry paths. Choose evidence that separates them instead of chasing the loudest alert.";
  if(game.turns.some(t=>t.success&&!t.revealed))return "A successful check found no matching stage. Update the hypothesis before selecting another source.";
  return "Use the confirmed stage to predict what the attacker needed next, then test that prediction.";
}
export function getSuggestion(game:Game){const hidden=game.chain.filter(id=>!game.revealed.includes(id)).map(id=>attacks.find(a=>a.id===id)!);for(const a of hidden){const candidates=a.detect.filter(id=>!availableIn(game,id));candidates.sort((a,b)=>Number(game.established.includes(b))-Number(game.established.includes(a)));if(candidates.length)return procedures.find(p=>p.id===candidates[0]);}return procedures.find(p=>!availableIn(game,p.id));}

export function playTurn(game:Game,procedure:string,forcedRoll?:number):Game {
  if(game.status!=="playing")throw new Error("This investigation has ended.");
  if(game.pendingDecision)throw new Error("Resolve the evidence decision first.");
  if(!procedures.some(p=>p.id===procedure))throw new Error("Unknown procedure.");
  if(availableIn(game,procedure)>0)throw new Error("This procedure is cooling down.");
  const raw=forcedRoll??randomInt(20)+1;if(!Number.isInteger(raw)||raw<1||raw>20)throw new Error("Invalid d20 roll.");
  const g:Game={...game,revealed:[...game.revealed],lastUsed:{...game.lastUsed},turns:[...game.turns],injectDeck:[...game.injectDeck],decisions:[...game.decisions],responseChoices:[...game.responseChoices]};
  const config=difficulties[g.difficulty];const number=g.turns.length+1;const modifier=(g.established.includes(procedure)?3:0)+g.nextModifier;const total=raw+modifier;const success=total>=config.threshold;g.nextModifier=0;
  const match=success?g.chain.find(id=>!g.revealed.includes(id)&&attacks.find(a=>a.id===id)!.detect.includes(procedure)):undefined;
  let revealed:string|null=null;let narrative="";let impactChange=success?3:10;
  if(match){revealed=match;g.revealed.push(match);g.pendingDecision=match;impactChange=1;narrative=attacks.find(a=>a.id===match)!.evidence;}
  else if(success)narrative="The procedure completed successfully, but the evidence does not support an undiscovered stage. Reassess the hypothesis.";
  else narrative="The action did not produce reliable evidence. The attacker gains time while the team reorients.";
  g.lastUsed[procedure]=number;g.failures=success?0:g.failures+1;
  let inject:Inject|null=null;let injectReveal:string|null=null;let exerciseEnd=false;
  const reason=raw===1?"Natural 1":raw===20?"Natural 20":g.failures>=3?"Three failed rolls":null;
  if(reason&&g.injectDeck.length){const index=g.injectDeck.shift()!;inject={...injects[index],reason};if(g.failures>=3)g.failures=0;
    if(inject.effect==="bonus")g.nextModifier=2;
    if(inject.effect==="penalty"){g.nextModifier=-2;impactChange+=6;}
    if(inject.effect==="pressure")impactChange+=8;
    if(inject.effect==="relief")impactChange-=8;
    if(inject.effect==="restore"){const cooling=Object.keys(g.lastUsed).filter(id=>g.lastUsed[id]+4>number+1).sort((a,b)=>g.lastUsed[a]-g.lastUsed[b]);if(cooling.length){delete g.lastUsed[cooling[0]];inject.effectLabel=`${procedures.find(p=>p.id===cooling[0])!.title} is available again.`;}else inject.effectLabel="No procedures are cooling down; no change.";}
    if(inject.effect==="reveal"){injectReveal=g.chain.find(id=>!g.revealed.includes(id))??null;if(injectReveal){g.revealed.push(injectReveal);g.pendingDecision=g.pendingDecision??injectReveal;inject.effectLabel=`Additional discovery: ${attacks.find(a=>a.id===injectReveal)!.title}.`;}else inject.effectLabel="All stages are already revealed.";}
    if(inject.effect==="end")exerciseEnd=true;
  }
  g.impact=clamp(g.impact+impactChange);
  g.turns.push({number,procedure,raw,modifier,total,success,revealed,narrative,inject,injectReveal,impactChange});
  if(g.impact>=100)g.status="lost";else if(exerciseEnd&&g.revealed.length<4)g.status="exercise";else if(number>=config.maxTurns&&g.revealed.length<4)g.status="lost";
  return g;
}

export function resolveDecision(game:Game,choice:"preserve"|"disrupt"):Game {
  if(game.status!=="playing"||!game.pendingDecision)throw new Error("No evidence decision is pending.");
  const g:Game={...game,decisions:[...game.decisions]};const attack=attacks.find(a=>a.id===g.pendingDecision)!;
  if(choice==="preserve"){g.nextModifier=Math.max(g.nextModifier,2);g.impact=clamp(g.impact+8);g.decisions.push({stage:g.pendingDecision,choice,title:"Preserve and observe",effect:"Next roll +2; impact +8"});}
  else{g.nextModifier=Math.min(g.nextModifier,-1);g.impact=clamp(g.impact-12);g.decisions.push({stage:g.pendingDecision,choice,title:"Disrupt immediately",effect:"Impact −12; next roll −1"});}
  g.pendingDecision=null;
  if(g.impact>=100)g.status="lost";else if(g.revealed.length===4)g.status="response";
  return g;
}

export function resolveResponse(game:Game,choice:string):Game {
  if(game.status!=="response")throw new Error("The response phase is not active.");
  const phase=game.responseChoices.length===0?"containment":"recovery";const option=responseOptions[phase].find(o=>o.id===choice);if(!option)throw new Error("Unknown response choice.");
  const g:Game={...game,responseChoices:[...game.responseChoices,choice]};const preferred=scenarios[g.scenario].preferred[g.responseChoices.length-1]===choice;
  g.impact=clamp(g.impact+option.impact);g.continuity=clamp(g.continuity+option.continuity);g.responseScore+=option.score+(preferred?6:0);
  if(g.responseChoices.length===2)g.status="won";
  return g;
}

export function getOutcome(game:Game){const investigation=Math.max(0,44-game.turns.length*2-game.impact/5);const total=Math.round(investigation+game.responseScore+game.continuity/5);if(total>=72)return {grade:"A",title:"Controlled recovery",detail:"You balanced evidence, disruption and service continuity with strong operational judgement."};if(total>=58)return {grade:"B",title:"Stable, with residual risk",detail:"The incident is contained, but the debrief identifies avoidable exposure or disruption."};if(total>=42)return {grade:"C",title:"Costly stabilisation",detail:"Services are recovering, but uncertainty and operational cost remain high."};return {grade:"D",title:"Fragile recovery",detail:"The immediate crisis passed, but the response left significant residual risk."};}
