#!/usr/bin/env python3
# Compares two recordings of tests/e2e/computed-styles.spec.ts: for each screen,
# the elements whose computed style, ::before or ::after differs, and how.
#   python3 scripts/compare-styles.py <before> <after>
import sys, os, json, gzip
a, b = sys.argv[1], sys.argv[2]
bad = 0; shown = 0
for name in sorted(os.listdir(a)):
    x = json.load(gzip.open(os.path.join(a, name))); y = json.load(gzip.open(os.path.join(b, name)))
    if len(x["elems"]) != len(y["elems"]): print(name, "element count", len(x["elems"]), len(y["elems"])); bad += 1; continue
    diffs = []
    for ex, ey in zip(x["elems"], y["elems"]):
        if ex[0] != ey[0]: diffs.append((ex[0], "key", ey[0])); continue
        for slot, label in ((1, ""), (2, "::before"), (3, "::after")):
            sx, sy = x["table"][ex[slot]], y["table"][ey[slot]]
            if sx != sy:
                px = dict(p.split(":", 1) for p in sx.split(chr(10)) if p); py = dict(p.split(":", 1) for p in sy.split(chr(10)) if p)
                diffs.append((ex[0] + label, {k: (px.get(k), py.get(k)) for k in set(px) | set(py) if px.get(k) != py.get(k)}))
    if diffs:
        bad += 1; print(name, len(diffs), "elements differ")
        for d in diffs[:3]:
            if shown < 25: print("   ", d[0][-120:], str(d[1:])[:300]); shown += 1
print("different:", bad, "of", len(os.listdir(a)))
