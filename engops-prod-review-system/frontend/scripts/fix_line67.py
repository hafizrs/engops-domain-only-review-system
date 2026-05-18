from pathlib import Path

p = Path(__file__).resolve().parent.parent / "src/pages/ai-evaluation/GeneratePanel.tsx"
lines = p.read_text(encoding="utf-8").splitlines()
d, t = "motionDiv", "td"
d, t = "div", "td"
lines[66] = (
    "              <td><strong>{e.employeeName}</strong>"
    + f"<{d} style={{{{ fontSize: 11, color: 'var(--text3)' }}}}>{{e.email}}</{d}>"
    + f"</{t}>"
)
p.write_text("\n".join(lines) + "\n", encoding="utf-8")
print("fixed:", lines[66])
