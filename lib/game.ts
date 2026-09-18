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
  {id:"phish",stage:0,title:"Phishing attachment",detect:["email","endpoint","forensic"],clue:"A user recalls opening an unexpected document shortly before unusual host activity began.",evidence:"Message traces and process ancestry link a delivered attachment to the first malicious execution."},
  {id:"vpn",stage:0,title:"Stolen remote-access account",detect:["identity","firewall","network"],clue:"A remote session began outside the account holder’s normal working pattern.",evidence:"Anomalous remote-access sessions use a valid account from an unfamiliar source, with no corresponding user activity."},
  {id:"web",stage:0,title:"Exploited public application",detect:["server","firewall","forensic"],clue:"The public-facing application logged unusual requests before internal activity changed.",evidence:"Application logs tie malformed requests to unexpected server-side execution at the start of the incident."},
  {id:"token",stage:0,title:"Exposed cloud credential",detect:["cloud","identity","hunt"],clue:"An automation identity is making API calls from a location not associated with its workload.",evidence:"Cloud audit records show a workload credential being used from outside the approved execution environment."},
  {id:"spray",stage:1,title:"Internal password spraying",detect:["identity","network","hunt"],clue:"Multiple accounts show authentication failures, followed by a small number of successful sign-ins.",evidence:"A single internal source attempts a few common passwords across many accounts, then authenticates successfully."},
  {id:"remote",stage:1,title:"Remote service execution",detect:["endpoint","network","server"],clue:"A workstation is initiating administrative connections to servers it does not normally manage.",evidence:"Host and traffic records show remote administrative sessions creating processes on additional systems."},
  {id:"role",stage:1,title:"Cloud role escalation",detect:["cloud","identity","hunt"],clue:"A workload identity suddenly accesses resources outside its usual permission boundary.",evidence:"An over-permissive role relationship allows the compromised identity to assume an elevated cloud role."},
  {id:"dump",stage:1,title:"Credential theft from memory",detect:["endpoint","forensic","hunt"],clue:"A host alert points to unusual access to authentication-related process memory.",evidence:"Process-access records and memory artefacts show credential material being extracted for additional access."},
  {id:"task",stage:2,title:"Malicious scheduled task",detect:["endpoint","server","forensic"],clue:"The same unsigned process returns at regular intervals after it has been stopped.",evidence:"A newly created scheduled task relaunches the attacker’s payload at fixed intervals."},
  {id:"account",stage:2,title:"Hidden privileged account",detect:["identity","server","hunt"],clue:"An unexplained account appears in a privileged group outside the normal approval cycle.",evidence:"Account-creation and group-change records establish an unapproved privileged identity controlled by the attacker."},
  {id:"webshell",stage:2,title:"Web-shell foothold",detect:["server","forensic","endpoint"],clue:"A recently modified server file is receiving requests that launch unusual child processes.",evidence:"A server-side file accepts remote commands and keeps access available through the application."},
  {id:"key",stage:2,title:"Additional access key",detect:["cloud","identity","hunt"],clue:"A new programmatic credential was created without a corresponding change request.",evidence:"Cloud control-plane records show creation of a second access key that preserves the attacker’s access."},
  {id:"https",stage:3,title:"Encrypted web exfiltration",detect:["network","firewall","intel"],clue:"One system repeatedly uploads large amounts of data to a rarely used external web destination.",evidence:"Egress records and destination correlation identify sustained outbound uploads to attacker-controlled infrastructure."},
  {id:"dnsout",stage:3,title:"DNS covert channel",detect:["dns","network","hunt"],clue:"Resolver telemetry contains unusually long subdomains queried at regular intervals.",evidence:"Repeated high-entropy DNS queries carry encoded data to a domain controlled outside the organisation."},
  {id:"storage",stage:3,title:"Cloud storage export",detect:["cloud","network","firewall"],clue:"A workload reads a large volume of objects, followed by a spike in outbound data transfer.",evidence:"Object-access and transfer records correlate bulk retrieval with export to an unapproved storage destination."},
  {id:"beacon",stage:3,title:"Periodic command beacon",detect:["network","dns","intel"],clue:"Short outbound connections repeat at nearly identical intervals, including outside business hours.",evidence:"Time-series analysis identifies a periodic command channel to newly registered external infrastructure."},
];

export const scenarios = [
  {id:"quiet-office",icon:Building2,sector:"ENTERPRISE IT",title:"The quiet intrusion",summary:"An ordinary morning. An unusual sign-in. A foothold hidden in the noise.",brief:"It is 08:40. The service desk has received two reports of unusual workstation behaviour. A routine network check also shows unexpected outbound traffic. Business applications are still operating. Determine how access was gained and what followed.",scope:"Employee endpoints, identity services, remote access and the internal application servers. Only simulated evidence is used.",timeline:"Reports began this morning; the evidence window covers the preceding 24 hours.",constraints:"Some telemetry is incomplete. Established runbooks have a +3 advantage. Use procedures to test hypotheses rather than assume that an alert proves compromise.",lesson:"Could your team connect an endpoint report, an identity event and outbound traffic without treating them as separate incidents?",choices:[["phish","vpn"],["spray","dump"],["task","account"],["https","beacon"]]},
  {id:"care-network",icon:HeartPulse,sector:"HEALTHCARE",title:"After the night shift",summary:"Clinical services remain live while unfamiliar activity spreads behind the scenes.",brief:"At a fictional hospital, overnight support staff report a sluggish workstation and unfamiliar remote sessions. Patient-facing services remain available. Investigate without assuming that a shutdown is a safe first action.",scope:"Administrative endpoints, the support gateway, identity services and clinical application servers. Medical devices are outside this simulated attack chain.",timeline:"The first anomalies occurred during the night shift. Records cover that shift and the previous working day.",constraints:"Clinical service continuity matters. Card actions are investigative only; disruptive containment would need a separate operational decision.",lesson:"Who would authorise isolation of a system supporting clinical work, and what evidence would they need?",choices:[["phish","vpn"],["remote","spray"],["task","account"],["https","dnsout"]]},
  {id:"power-support",icon:Factory,sector:"ENERGY / OT SUPPORT",title:"Beyond the gateway",summary:"A supplier session raises questions at the boundary of plant support systems.",brief:"A fictional power operator sees an unusual supplier session to its maintenance environment. A support server later starts making unfamiliar connections. Generation remains stable. Reconstruct the support-system compromise, not the operation of plant equipment.",scope:"Supplier remote access, the maintenance jump host, identity services and support servers. The simulation does not assert that controllers or safety systems have been compromised.",timeline:"The suspicious session started after the approved maintenance window. Review the subsequent twelve hours.",constraints:"Read-only investigation is assumed. No active scanning or control-system commands are performed. Distinguish a support-system breach from a process-safety event.",lesson:"Could you revoke supplier access without losing essential operational support, and who owns that decision?",choices:[["vpn","web"],["remote","dump"],["task","webshell"],["beacon","https"]]},
  {id:"port-terminal",icon:Ship,sector:"MARITIME",title:"A terminal under watch",summary:"A booking portal anomaly reaches the team during a busy operating window.",brief:"A fictional container terminal reports unusual requests to its booking portal. Support staff then spot unexplained server activity. Vessel operations continue. Establish the attack chain before the investigation window closes.",scope:"The booking portal, application servers, identity services and supporting business network. Crane control systems are not part of this simulated chain.",timeline:"Portal anomalies began at 05:30, followed by internal activity during the morning shift.",constraints:"Busy operations can hide suspicious traffic. Distinguish valid partner sessions from attacker activity, and preserve evidence before disruptive changes.",lesson:"Which port and terminal partners would need early warning if an operational dependency could no longer be trusted?",choices:[["web","vpn"],["remote","spray"],["webshell","account"],["https","dnsout"]]},
  {id:"cloud-control",icon:Cloud,sector:"CLOUD SERVICES",title:"An identity out of place",summary:"An automation account begins acting beyond its normal workload.",brief:"A fictional cloud service provider detects unusual control-plane activity and an egress-cost spike. No scheduled deployment explains either. Investigate the identity, its permission path and any mechanism maintaining access.",scope:"Workload credentials, cloud access management, control-plane audit logs and object-storage activity. No real cloud account is connected.",timeline:"The anomaly began several hours after the last approved deployment. Audit and traffic records cover that interval.",constraints:"Successful API calls can still be malicious. Investigate who used the credential, which permissions they assumed and whether additional access was created.",lesson:"Could you rotate a compromised workload credential safely and identify every role and key derived from it?",choices:[["token"],["role"],["key"],["storage","https"]]},
  {id:"shared-services",icon:Network,sector:"DIGITAL INFRASTRUCTURE",title:"A trusted connection",summary:"A shared-service identity links an isolated alert to a wider incident.",brief:"A fictional shared-services operator sees an unfamiliar session under a trusted support identity. A dependent application later reports unexpected access. Service remains available, but the potential scope is unclear.",scope:"Remote support, identity services, shared application servers and outbound records. Other organisations’ environments are not directly accessible.",timeline:"Anomalies cluster around the last support window. Begin with the shared service’s own evidence.",constraints:"Do not assume trust extends across every connected service. Findings establish this incident’s chain, not the security of dependent organisations.",lesson:"What evidence could you share promptly with dependent organisations, and how would you separate confirmed facts from assumptions?",choices:[["vpn","phish"],["spray","remote"],["account","task"],["beacon","dnsout"]]},
];

const injects = [
  {id:"expert",title:"A specialist joins",text:"An experienced responder helps focus your next investigative plan.",effect:"bonus",effectLabel:"+2 to the next procedure roll only."},
  {id:"delay",title:"Access approval delayed",text:"An evidence source needs additional approval. Coordination friction slows the next action.",effect:"penalty",effectLabel:"−2 to the next procedure roll only."},
  {id:"restored",title:"Collection pipeline restored",text:"A repaired pipeline lets you revisit a previously used procedure ahead of schedule.",effect:"restore",effectLabel:"One cooling-down procedure becomes available."},
  {id:"partner",title:"Partner shares evidence",text:"A trusted partner sends a validated finding that fills a gap in the attack chain.",effect:"reveal",effectLabel:"One additional hidden stage is revealed, if any remain."},
  {id:"press",title:"Leadership wants an update",text:"The executive team asks whether the essential service is safe. Separate facts, suspicions and unverified assumptions.",effect:"none",effectLabel:"Discussion event. No change to turns or modifiers."},
  {id:"backup",title:"A useful evidence copy",text:"A retained copy of telemetry becomes available and improves the next investigation.",effect:"bonus",effectLabel:"+2 to the next procedure roll only."},
  {id:"noise",title:"An alert flood",text:"Unrelated alerts overwhelm the triage queue. The next action has less analyst attention.",effect:"penalty",effectLabel:"−2 to the next procedure roll only."},
  {id:"operations",title:"Operations requests reassurance",text:"Operations asks if normal activity can continue. Finding a technique does not establish safe continued operation.",effect:"none",effectLabel:"Discussion event. No change to turns or modifiers."},
  {id:"exercise",title:"Authorised exercise confirmed",text:"The controller confirms that this activity belongs to an authorised test. The investigation closes and all stages are available in the debrief.",effect:"end",effectLabel:"Exercise ends. This is not counted as a four-stage victory."},
];
type Inject = typeof injects[number] & {reason:string};
export type Turn = {number:number;procedure:string;raw:number;modifier:number;total:number;success:boolean;revealed:string|null;narrative:string;inject:Inject|null;injectReveal:string|null};
export type Game = {scenario:number;chain:string[];revealed:string[];established:string[];lastUsed:Record<string,number>;turns:Turn[];failures:number;nextModifier:number;injectDeck:number[];status:"playing"|"won"|"lost"|"exercise"};
export function randomInt(max:number) {
  if (typeof crypto!=="undefined" && crypto.getRandomValues) {
    const limit=Math.floor(0x100000000/max)*max;const value=new Uint32Array(1);
    do {crypto.getRandomValues(value)} while(value[0]>=limit);
    return value[0]%max;
  }
  return Math.floor(Math.random()*max);
}
function shuffle<T>(array:T[], random=(max:number)=>randomInt(max)) {const result=[...array];for(let i=result.length-1;i>0;i--){const j=random(i+1);[result[i],result[j]]=[result[j],result[i]];}return result;}
export function newGame(scenario:number, random=(max:number)=>randomInt(max)):Game {
  if (!Number.isInteger(scenario)||!scenarios[scenario]) throw new Error("Unknown incident");
  return {scenario,chain:scenarios[scenario].choices.map(options=>options[random(options.length)]),revealed:[],established:shuffle(procedures.map(p=>p.id),random).slice(0,4),lastUsed:{},turns:[],failures:0,nextModifier:0,injectDeck:shuffle(injects.map((_,i)=>i),random),status:"playing"};
}
export function availableIn(game:Game, id:string) {return game.lastUsed[id]===undefined?0:Math.max(0,game.lastUsed[id]+4-(game.turns.length+1));}
export function getLead(game:Game) {const id=game.chain.find(id=>!game.revealed.includes(id));return id?attacks.find(a=>a.id===id)!.clue:"All four stages are identified. Containment and recovery still require separate decisions.";}
export function getSuggestion(game:Game) {const next=game.chain.filter(id=>!game.revealed.includes(id)).map(id=>attacks.find(a=>a.id===id)!);for(const a of next){const candidates=a.detect.filter(id=>!availableIn(game,id));candidates.sort((a,b)=>Number(game.established.includes(b))-Number(game.established.includes(a)));if(candidates.length)return procedures.find(p=>p.id===candidates[0]);}return procedures.find(p=>!availableIn(game,p.id));}
export function playTurn(game:Game, procedure:string, forcedRoll?:number):Game {
  if(game.status!=="playing")throw new Error("This investigation has ended.");
  if(!procedures.some(p=>p.id===procedure))throw new Error("Unknown procedure.");
  if(availableIn(game,procedure)>0)throw new Error("This procedure is cooling down.");
  const raw=forcedRoll??randomInt(20)+1;
  if(!Number.isInteger(raw)||raw<1||raw>20)throw new Error("Invalid d20 roll.");
  const g:Game={...game,revealed:[...game.revealed],lastUsed:{...game.lastUsed},turns:[...game.turns],injectDeck:[...game.injectDeck]};
  const number=g.turns.length+1;const modifier=(g.established.includes(procedure)?3:0)+g.nextModifier;const total=raw+modifier;const success=total>=11;g.nextModifier=0;
  const match=success?g.chain.find(id=>!g.revealed.includes(id)&&attacks.find(a=>a.id===id)!.detect.includes(procedure)):null;
  const revealed=match??null;
  let narrative=success?"The collection completed, but it did not identify another technique in this incident. Revisit the lead or try a different evidence source.":["Required telemetry was incomplete. The team cannot draw a defensible conclusion from this attempt.","Evidence could not be collected in the available window. Access and coordination delays prevented a usable result.","The returned data was too noisy to support a finding. Refine the hypothesis while this procedure is unavailable."][number%3];
  if(revealed){g.revealed.push(revealed);narrative=attacks.find(a=>a.id===revealed)!.evidence;}
  g.lastUsed[procedure]=number;g.failures=success?0:g.failures+1;
  let inject:Inject|null=null;let injectReveal:string|null=null;let exerciseEnd=false;
  if(raw===1||raw===20||g.failures>=3){
    const reason=raw===1?"Natural 1":raw===20?"Natural 20":"Three failed rolls";
    if(g.failures>=3)g.failures=0;
    if(!g.injectDeck.length)g.injectDeck=shuffle(injects.map((_,i)=>i));
    inject={...injects[g.injectDeck.shift()!],reason};
    if(inject.effect==="bonus")g.nextModifier=2;
    if(inject.effect==="penalty")g.nextModifier=-2;
    if(inject.effect==="restore"){
      const cooling=Object.keys(g.lastUsed).filter(id=>g.lastUsed[id]+4>number+1).sort((a,b)=>g.lastUsed[a]-g.lastUsed[b]);
      if(cooling.length){delete g.lastUsed[cooling[0]];inject.effectLabel=`${procedures.find(p=>p.id===cooling[0])!.title} is available again.`;}else inject.effectLabel="No procedures are cooling down; no change.";
    }
    if(inject.effect==="reveal") {injectReveal=g.chain.find(id=>!g.revealed.includes(id))??null;if(injectReveal){g.revealed.push(injectReveal);inject.effectLabel=`Additional discovery: ${attacks.find(a=>a.id===injectReveal)!.title}.`;}else inject.effectLabel="All stages have already been revealed.";}
    if(inject.effect==="end")exerciseEnd=true;
  }
  g.turns.push({number,procedure,raw,modifier,total,success,revealed,narrative,inject,injectReveal});
  if(g.revealed.length===4)g.status="won";else if(exerciseEnd)g.status="exercise";else if(number>=10)g.status="lost";
  return g;
}
