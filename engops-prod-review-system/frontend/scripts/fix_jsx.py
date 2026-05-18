from pathlib import Path

DIV = "div"
TD = "td"

gp = Path(__file__).resolve().parent.parent / "src/pages/ai-evaluation/GeneratePanel.tsx"
lines = gp.read_text(encoding="utf-8").splitlines()
for i, line in enumerate(lines):
    if "{e.email}" in line and "<td>" in line:
        lines[i] = (
            "              <td><strong>{e.employeeName}</strong>"
            f"<{DIV} style={{ fontSize: 11, color: \"var(--text3)\" }}>{{e.email}}</{DIV}>"
            f"</{TD}>"
        )
gp.write_text("\n".join(lines) + "\n", encoding="utf-8")
print("GeneratePanel OK")

ap = Path(__file__).resolve().parent.parent / "src/pages/ai-evaluation/AllocationPanel.tsx"
t = ap.read_text(encoding="utf-8")
bad = f"<{DIV}<strong>"
good = f"<{DIV}><strong>"
if bad in t:
    ap.write_text(t.replace(bad, good), encoding="utf-8")
    print("AllocationPanel fixed")
else:
    print("AllocationPanel already OK")
