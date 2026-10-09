"""Rewrite physical direction properties in app/globals.css as logical ones.

In a left-to-right layout a logical property resolves to the physical one it
replaces, so the page renders identically; a right-to-left locale then needs
a catalogue rather than a restyle. One declaration per line, as the stylesheet
is written. Run: python3 scripts/logical-css.py app/globals.css
"""
import re, sys

path = sys.argv[1]
lines = open(path).read().split("\n")
simple = {
    "margin-left": "margin-inline-start", "margin-right": "margin-inline-end",
    "padding-left": "padding-inline-start", "padding-right": "padding-inline-end",
    "border-left": "border-inline-start", "border-right": "border-inline-end",
    "border-left-color": "border-inline-start-color", "border-right-color": "border-inline-end-color",
    "border-left-width": "border-inline-start-width", "border-right-width": "border-inline-end-width",
    "border-left-style": "border-inline-start-style", "border-right-style": "border-inline-end-style",
    "left": "inset-inline-start", "right": "inset-inline-end",
    "border-top-left-radius": "border-start-start-radius", "border-top-right-radius": "border-start-end-radius",
    "border-bottom-left-radius": "border-end-start-radius", "border-bottom-right-radius": "border-end-end-radius",
}
declaration = re.compile(r"^(\s*)([a-z-]+):(.*?);?\s*$")
out, changed = [], 0
for line in lines:
    m = declaration.match(line)
    if not m or line.rstrip().endswith("{") or "{" in line:
        out.append(line); continue
    indent, prop, value = m.group(1), m.group(2), m.group(3)
    important = ""
    if value.endswith("!important"):
        value, important = value[: -len("!important")].rstrip(), "!important"
    if prop in simple:
        out.append(f"{indent}{simple[prop]}:{value}{important};"); changed += 1; continue
    if prop == "text-align" and value in ("left", "right"):
        out.append(f"{indent}text-align:{'start' if value == 'left' else 'end'}{important};"); changed += 1; continue
    if prop == "float" and value in ("left", "right"):
        out.append(f"{indent}float:{'inline-start' if value == 'left' else 'inline-end'}{important};"); changed += 1; continue
    if prop in ("margin", "padding", "inset"):
        parts = value.split()
        if len(parts) == 4 and parts[1] != parts[3] and "(" not in value:
            top, right, bottom, left = parts
            block = top if top == bottom else f"{top} {bottom}"
            out.append(f"{indent}{prop}-block:{block}{important};")
            out.append(f"{indent}{prop}-inline:{left} {right}{important};"); changed += 1; continue
    if prop == "border-radius":
        parts = value.split()
        if len(parts) == 4 and not (parts[0] == parts[1] and parts[2] == parts[3]) and "/" not in value:
            tl, tr, br, bl = parts
            for name, v in (("start-start", tl), ("start-end", tr), ("end-end", br), ("end-start", bl)):
                out.append(f"{indent}border-{name}-radius:{v}{important};")
            changed += 1; continue
        if len(parts) == 2 and parts[0] != parts[1]:
            tlbr, trbl = parts
            for name, v in (("start-start", tlbr), ("start-end", trbl), ("end-end", tlbr), ("end-start", trbl)):
                out.append(f"{indent}border-{name}-radius:{v}{important};")
            changed += 1; continue
        if len(parts) == 3 and parts[1] != "/":
            tl, trbl, br = parts
            for name, v in (("start-start", tl), ("start-end", trbl), ("end-end", br), ("end-start", trbl)):
                out.append(f"{indent}border-{name}-radius:{v}{important};")
            changed += 1; continue
    out.append(line)
open(path, "w").write("\n".join(out))
print("rewrote", changed, "declarations")
