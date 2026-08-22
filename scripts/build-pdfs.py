from pathlib import Path
import html
import re

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    PageTemplate,
    Paragraph,
    PageBreak,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "outputs" / "hw06"
OUTPUT.mkdir(parents=True, exist_ok=True)

font_regular = Path("C:/Windows/Fonts/arial.ttf")
font_bold = Path("C:/Windows/Fonts/arialbd.ttf")
font_mono = Path("C:/Windows/Fonts/consola.ttf")
pdfmetrics.registerFont(TTFont("HWArial", str(font_regular)))
pdfmetrics.registerFont(TTFont("HWArial-Bold", str(font_bold)))
pdfmetrics.registerFont(TTFont("HWMono", str(font_mono)))

NAVY = colors.HexColor("#12324A")
TEAL = colors.HexColor("#0F766E")
PALE = colors.HexColor("#E6F4F1")
LINE = colors.HexColor("#D0D5DD")
GRAY = colors.HexColor("#667085")


class NumberedDocTemplate(BaseDocTemplate):
    def __init__(self, filename, title):
        super().__init__(
            filename,
            pagesize=A4,
            rightMargin=16 * mm,
            leftMargin=16 * mm,
            topMargin=18 * mm,
            bottomMargin=17 * mm,
            title=title,
            author="Nguyễn Đình Thái Hưng — 23127373",
        )
        frame = Frame(self.leftMargin, self.bottomMargin, self.width, self.height, id="body")
        self.addPageTemplates(PageTemplate(id="all", frames=[frame], onPage=self._page))

    def _page(self, canvas, doc):
        canvas.saveState()
        canvas.setFont("HWArial", 8)
        canvas.setFillColor(GRAY)
        canvas.drawString(16 * mm, 9 * mm, "HW06 AI-First API Testing • 23127373")
        canvas.drawRightString(A4[0] - 16 * mm, 9 * mm, f"Page {doc.page}")
        canvas.setStrokeColor(LINE)
        canvas.line(16 * mm, 12 * mm, A4[0] - 16 * mm, 12 * mm)
        canvas.restoreState()


base = getSampleStyleSheet()
styles = {
    "h1": ParagraphStyle("H1", parent=base["Heading1"], fontName="HWArial-Bold", fontSize=19, leading=23, textColor=NAVY, spaceAfter=10),
    "h2": ParagraphStyle("H2", parent=base["Heading2"], fontName="HWArial-Bold", fontSize=13, leading=16, textColor=TEAL, spaceBefore=10, spaceAfter=6),
    "h3": ParagraphStyle("H3", parent=base["Heading3"], fontName="HWArial-Bold", fontSize=10.5, leading=13, textColor=NAVY, spaceBefore=7, spaceAfter=4),
    "body": ParagraphStyle("Body", parent=base["BodyText"], fontName="HWArial", fontSize=8.5, leading=12, textColor=colors.HexColor("#1D2939"), spaceAfter=5, splitLongWords=True),
    "bullet": ParagraphStyle("Bullet", parent=base["BodyText"], fontName="HWArial", fontSize=8.3, leading=11.5, leftIndent=10, firstLineIndent=-7, bulletIndent=2, spaceAfter=3, splitLongWords=True),
    "code": ParagraphStyle("Code", parent=base["Code"], fontName="HWMono", fontSize=6.1, leading=7.7, leftIndent=5, rightIndent=5, backColor=colors.HexColor("#F2F4F7"), borderColor=LINE, borderWidth=0.4, borderPadding=4, spaceAfter=1.5, splitLongWords=True),
    "note": ParagraphStyle("Note", parent=base["BodyText"], fontName="HWArial", fontSize=8, leading=11, textColor=GRAY, backColor=colors.HexColor("#F8FAFC"), borderColor=LINE, borderWidth=0.5, borderPadding=6),
}


def inline(text):
    text = re.sub(r"!\[([^]]*)\]\([^)]*\)", r"\1", text)
    text = re.sub(r"\[([^]]+)\]\([^)]*\)", r"\1", text)
    escaped = html.escape(text, quote=False)
    escaped = re.sub(r"\*\*([^*]+)\*\*", r"<b>\1</b>", escaped)
    escaped = re.sub(r"`([^`]+)`", r"<font name='HWMono'>\1</font>", escaped)
    return escaped


def markdown_table(lines, width):
    rows = []
    for line in lines:
        cells = [cell.strip() for cell in line.strip().strip("|").split("|")]
        if all(re.fullmatch(r":?-{3,}:?", cell or "") for cell in cells):
            continue
        rows.append([Paragraph(inline(cell), styles["body"]) for cell in cells])
    if not rows:
        return None
    columns = max(len(row) for row in rows)
    for row in rows:
        row.extend([Paragraph("", styles["body"])] * (columns - len(row)))
    col_widths = [width / columns] * columns
    table = Table(rows, colWidths=col_widths, repeatRows=1, hAlign="LEFT")
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), TEAL),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "HWArial-Bold"),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, PALE]),
        ("GRID", (0, 0), (-1, -1), 0.35, LINE),
        ("LEFTPADDING", (0, 0), (-1, -1), 3),
        ("RIGHTPADDING", (0, 0), (-1, -1), 3),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
    ]))
    return table


def markdown_story(markdown, doc_width):
    lines = markdown.splitlines()
    story = []
    i = 0
    in_code = False
    while i < len(lines):
        raw = lines[i]
        stripped = raw.strip()
        if stripped.startswith("```"):
            in_code = not in_code
            i += 1
            continue
        if in_code:
            if stripped:
                story.append(Paragraph(html.escape(raw).replace(" ", "&nbsp;"), styles["code"]))
            else:
                story.append(Spacer(1, 2))
            i += 1
            continue
        if not stripped:
            story.append(Spacer(1, 3))
            i += 1
            continue
        if stripped.startswith("|") and i + 1 < len(lines) and lines[i + 1].strip().startswith("|"):
            table_lines = []
            while i < len(lines) and lines[i].strip().startswith("|"):
                table_lines.append(lines[i])
                i += 1
            table = markdown_table(table_lines, doc_width)
            if table:
                story.extend([table, Spacer(1, 6)])
            continue
        if stripped.startswith("### "):
            story.append(Paragraph(inline(stripped[4:]), styles["h3"]))
            i += 1
            continue
        if stripped.startswith("## "):
            story.append(Paragraph(inline(stripped[3:]), styles["h2"]))
            i += 1
            continue
        if stripped.startswith("# "):
            if story:
                story.append(PageBreak())
            story.append(Paragraph(inline(stripped[2:]), styles["h1"]))
            i += 1
            continue
        if re.match(r"^[-*] \[[ xX]\] ", stripped):
            checked = "☑" if stripped[3].lower() == "x" else "☐"
            story.append(Paragraph(inline(f"{checked} {stripped[6:]}"), styles["bullet"]))
            i += 1
            continue
        if stripped.startswith(("- ", "* ")):
            story.append(Paragraph(inline(f"• {stripped[2:]}"), styles["bullet"]))
            i += 1
            continue
        if re.match(r"^\d+\. ", stripped):
            story.append(Paragraph(inline(stripped), styles["bullet"]))
            i += 1
            continue
        paragraph = [stripped]
        i += 1
        while i < len(lines):
            candidate = lines[i].strip()
            if not candidate or candidate.startswith(("#", "|", "```", "- ", "* ")) or re.match(r"^\d+\. ", candidate):
                break
            paragraph.append(candidate)
            i += 1
        story.append(Paragraph(inline(" ".join(paragraph)), styles["body"]))
    return story


def build(source, destination, title):
    markdown = source.read_text(encoding="utf-8")
    doc = NumberedDocTemplate(str(destination), title)
    story = markdown_story(markdown, doc.width)
    doc.build(story)


build(ROOT / "reports" / "main-report.md", OUTPUT / "HW06_Main_Report.pdf", "HW06 AI-First API Testing Report")
build(ROOT / "reports" / "ai-audit.md", OUTPUT / "HW06_AI_Audit_Report.pdf", "HW06 AI Audit Report")
print(f"Created {OUTPUT / 'HW06_Main_Report.pdf'}")
print(f"Created {OUTPUT / 'HW06_AI_Audit_Report.pdf'}")
