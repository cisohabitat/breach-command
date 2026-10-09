#!/usr/bin/env python3
# Finds CSS that cannot apply: declarations a later rule with the same selector
# overrides in a context that covers them, and rules naming a class that appears
# nowhere in the source. Run `python3 scripts/css-dead.py app/globals.css` to
# count, add --apply to remove; then check the visual baselines, the layout
# sweep and the accessibility audit, which are what make the removal safe.
import re,sys,subprocess,collections
path=sys.argv[1]; apply='--apply' in sys.argv
css=open(path).read()
# Parse into a flat list of blocks with context, keeping the original text spans.
# Supports one level of @media nesting (the file's convention).
tokens=[]  # (kind, start, end, context, selector, body)
i=0; n=len(css); stack=[]
def skip_comment(i):
    j=css.find('*/',i+2); return j+2
rules=[]
pos=0
def parse(start,end,context):
    i=start
    while i<end:
        if css.startswith('/*',i): i=skip_comment(i); continue
        if css[i].isspace(): i+=1; continue
        j=css.find('{',i)
        if j==-1 or j>=end: break
        head=css[i:j].strip()
        # find matching brace
        depth=0;k=j
        while k<end:
            c=css[k]
            if css.startswith('/*',k): k=skip_comment(k); continue
            if c=='{': depth+=1
            elif c=='}':
                depth-=1
                if depth==0: break
            k+=1
        if head.startswith('@media') or head.startswith('@supports'):
            parse(j+1,k,context+(re.sub(r'\s+',' ',head),))
        elif head.startswith('@'):
            pass
        else:
            rules.append(dict(start=i,open=j,close=k,context=context,selector=re.sub(r'\s+',' ',re.sub(r'/\*.*?\*/','',head,flags=re.S)).strip(),body=css[j+1:k]))
        i=k+1
parse(0,n,())
print('rules',len(rules))
# Pass 1: a declaration is dead when, for every selector in its rule's list, a
# later rule naming that same selector sets the same property in a context that
# covers the earlier one (the top level, or the same media query), with at least
# its importance. Equal selectors have equal specificity, so the later wins
# wherever the earlier could apply.
decl_re=re.compile(r'^(\s*)([a-zA-Z-]+|--[\w-]+)\s*:(.*?);\s*$',re.M)
def covers(later_ctx, earlier_ctx):
    return later_ctx==() or later_ctx==earlier_ctx
seen=collections.defaultdict(list)  # (selector component, prop) -> list of (context, important) from later rules
dead=collections.defaultdict(set)
for idx in range(len(rules)-1,-1,-1):
    r=rules[idx]
    comps=[c.strip() for c in r['selector'].split(',') if c.strip()]
    decls=list(decl_re.finditer(r['body']))
    # within one rule, a later duplicate property overrides an earlier one
    lastprop={}
    for m in decls:
        lastprop[m.group(2).lower()]=m
    for m in decls:
        prop=m.group(2).lower(); imp='!important' in m.group(3)
        if lastprop[prop] is not m and (('!important' in lastprop[prop].group(3)) or not imp):
            dead[idx].add(m.start()); continue
        if comps and all(any(covers(ctx,r['context']) and (limp or not imp) for ctx,limp in seen[(c,prop)]) for c in comps):
            dead[idx].add(m.start())
    for m in decls:
        prop=m.group(2).lower(); imp='!important' in m.group(3)
        for c in comps: seen[(c,prop)].append((r['context'],imp))
count=sum(len(v) for v in dead.values()); print('overridden declarations',count)
# Pass 2: selectors naming a class that appears nowhere in source
src=subprocess.run(['bash','-c','cat components/game/*.tsx components/ui/*.tsx app/*.tsx lib/*.ts lib/engine/*.ts hooks/*.ts'],capture_output=True,text=True).stdout
def class_alive(c):
    if re.search(r'(?<![\w-])'+re.escape(c)+r'(?![\w-])',src): return True
    # dynamic: prefix-${...}
    for k in range(len(c)-1,2,-1):
        if c[k-1]=='-' and (c[:k]+'${') in src: return True
    return False
dead_rules=[]
for idx,r in enumerate(rules):
    parts=[p.strip() for p in r['selector'].split(',')]
    alive=[]
    for p in parts:
        classes=re.findall(r'\.([a-zA-Z_][\w-]*)',p)
        if all(class_alive(c) for c in classes): alive.append(p)
    if not alive: dead_rules.append(idx)
    r['alive']=alive
print('rules with no live selector',len(dead_rules))
partial=sum(1 for r in rules if r.get('alive') and len(r['alive'])<len(r['selector'].split(',')))
print('rules with some dead selectors',partial)
if apply:
    out=[];last_end=0
    for idx,r in enumerate(rules):
        out.append(css[last_end:r['start']])
        if idx in dead_rules:
            last_end=r['close']+1
            # swallow trailing newline
            if css[last_end:last_end+1]=='\n': last_end+=1
            continue
        body=r['body']
        if idx in dead:
            lines=[]
            for m in decl_re.finditer(body): pass
            newbody=''; p=0
            for m in decl_re.finditer(body):
                newbody+=body[p:m.start()]
                if m.start() not in dead[idx]: newbody+=m.group(0)
                p=m.end()
            newbody+=body[p:]
            newbody=re.sub(r'\n\s*\n','\n',newbody)
            if not decl_re.search(newbody):
                last_end=r['close']+1
                if css[last_end:last_end+1]=='\n': last_end+=1
                continue
            body=newbody
        sel=r['selector'] if len(r['alive'])==len(r['selector'].split(',')) else ','.join(r['alive'])
        head=css[r['start']:r['open']]
        if sel!=r['selector']: head=sel+' '
        out.append(head+'{'+body+'}')
        last_end=r['close']+1
    out.append(css[last_end:])
    res=''.join(out)
    # drop media blocks left empty
    res=re.sub(r'@media[^{]*\{\s*\}\n?','',res)
    open(path,'w').write(res)
    print('lines',css.count('\n'),'->',res.count('\n'))
