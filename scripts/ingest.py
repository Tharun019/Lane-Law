"""
Lane Law AI - ingestion script.

Reads every PDF in data/raw/, splits it into one chunk per Section / Rule,
tags each chunk as two-wheeler / four-wheeler / general, and writes
data/chunks.json for the Next.js app.

Usage:  pip install pypdf
        python scripts/ingest.py
"""
import json
import re
import sys
from pathlib import Path

from pypdf import PdfReader

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "data" / "raw"
OUT = ROOT / "data" / "chunks.json"

# Known documents. Match is on a lowercase substring of the file name.
DOCS = [
    {
        "match": "amendment",
        "doc": "mva2019",
        "title": "Revised penalties under the Motor Vehicles (Amendment) Act, 2019 (MoRTH, via Vikaspedia)",
        "unit": "Row",
        "url": "https://en.vikaspedia.in/viewcontent/social-welfare/social-awareness/consumer-education/safe-driving/revised-penalties-under-amended-motor-vehicles-act",
    },
    {
        "match": "cmvr",
        "doc": "cmvr",
        "title": "Central Motor Vehicles Rules, 1989",
        "unit": "Rule",
        "url": "https://cag.gov.in/uploads/media/Cmvr1989-20200726065919.pdf",
    },
    {
        "match": "rules",
        "doc": "cmvr",
        "title": "Central Motor Vehicles Rules, 1989",
        "unit": "Rule",
        "url": "https://cag.gov.in/uploads/media/Cmvr1989-20200726065919.pdf",
    },
    {
        "match": "regulation",
        "doc": "mvdr2017",
        "title": "Motor Vehicles (Driving) Regulations, 2017",
        "unit": "Regulation",
        "url": "https://keralapolice.gov.in/storage/orders/iaps/cir-15-2018.pdf",
    },
    {
        "match": "act",
        "doc": "mva1988",
        "title": "Motor Vehicles Act, 1988",
        "unit": "Section",
        "url": "https://indiacode.nic.in/bitstream/123456789/19318/1/the_motor_vehicle_act_1988.pdf",
    },
]

# "185. Driving by a drunken person ..." or "194D. Penalty for not wearing ..."
# Number at line start, optional capital-letter suffix, a dot, then a capitalised title.
SECTION_RE = re.compile(
    r"(?m)^\s*(\d{1,3}[A-Z]{0,2})\.\s+([A-Z][^\n]{3,160})"
)

TWO_WHEELER = re.compile(
    r"\b(helmet|headgear|head\s*gear|pillion|motor\s*cycle|motorcycle|two[\s-]*wheeler|"
    r"side\s*car|sidecar|scooter|moped)\b",
    re.I,
)
FOUR_WHEELER = re.compile(
    r"\b(seat\s*belt|safety\s*belt|child\s*restraint|motor\s*car|light\s*motor\s*vehicle|"
    r"four[\s-]*wheeler|air\s*bag|airbag|transport\s*vehicle|goods\s*carriage|"
    r"stage\s*carriage|contract\s*carriage|taxi|cab)\b",
    re.I,
)
# Amendment footnotes in the India Code PDF look like section starts ("3. Inserted, ibid ...")
FOOTNOTE = re.compile(r"^(Cl\.|Cls\.|S\.\s*\d|.*\bby Act\b|.*w\.e\.f|Sub[\s\-.,]|Ins\b|Ins\.|Inserted|Subs|Substituted|Omitted|Added|Renumbered|The words|Clause|Sub-section|Section \d|w\.e\.f|Vide|ibid|S\.O\.|G\.S\.R)", re.I)

PENALTY = re.compile(r"\b(penalt|fine|punish|imprison|rupees)\w*", re.I)


def identify(path: Path) -> dict:
    name = path.name.lower()
    for d in DOCS:
        if d["match"] in name:
            return d
    return {
        "doc": path.stem.lower().replace(" ", "_"),
        "title": path.stem,
        "unit": "Section",
        "url": "",
    }


def extract(path: Path):
    """Return the full text plus a list of (char_offset, page_number)."""
    reader = PdfReader(str(path))
    parts, page_starts, offset = [], [], 0
    for i, page in enumerate(reader.pages, start=1):
        t = page.extract_text() or ""
        t = t.replace("—", " - ").replace("–", "-").replace("\xa0", " ")
        page_starts.append((offset, i))
        parts.append(t)
        offset += len(t) + 1
    return "\n".join(parts), page_starts


def page_at(offset: int, page_starts) -> int:
    page = 1
    for start, p in page_starts:
        if start > offset:
            break
        page = p
    return page


def tag(text: str):
    tags = []
    if TWO_WHEELER.search(text):
        tags.append("two-wheeler")
    if FOUR_WHEELER.search(text):
        tags.append("four-wheeler")
    if not tags:
        tags.append("general")
    return tags


def clean(text: str) -> str:
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def split_by_section(text, page_starts, meta):
    # Skip preface / objects-and-reasons: start at the LAST "1. Short title" (the first ones are the TOC)
    starts = [m.start() for m in re.finditer(r"(?m)^\s*1\.\s+Short title", text)]
    body_start = starts[-1] if starts else 0
    # A match is a real section boundary only the FIRST time its number appears and when
    # its title is not a footnote. Repeats are page-bottom footnotes; they stay inside
    # the section they appear in.
    seen, matches = set(), []
    for m in SECTION_RE.finditer(text):
        if m.start() < body_start or m.group(1) in seen or FOOTNOTE.match(m.group(2)):
            continue
        seen.add(m.group(1))
        matches.append(m)
    best = {}
    for i, m in enumerate(matches):
        end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
        body = clean(text[m.start():end])
        if len(body) < 40:
            continue
        num = m.group(1)
        chunk = {
            "id": f"{meta['doc']}-{num}",
            "doc": meta["doc"],
            "doc_title": meta["title"],
            "source_url": meta["url"],
            "unit": meta["unit"],
            "number": num,
            "title": re.split(r"\.\s*-|\s-\s|\.-", m.group(2))[0].strip().rstrip(".-: ")[:140],
            "page": page_at(m.start(), page_starts),
            "text": body,
        }
        best[num] = chunk
    out = []
    for ch in best.values():
        out.extend(split_long(ch))
    return out


def split_long(ch, size=2500, overlap=300):
    """Long sections (e.g. Definitions) become several parts that keep the section number."""
    t = ch["text"]
    if len(t) <= size + 500:
        return [ch]
    parts, start, k = [], 0, 0
    header = f"[{ch['unit']} {ch['number']} - {ch['title']}] "
    while start < len(t):
        k += 1
        piece = t[start:start + size]
        part = dict(ch)
        part["id"] = f"{ch['id']}-part{k}"
        part["part"] = k
        part["text"] = piece if k == 1 else header + piece
        parts.append(part)
        start += size - overlap
    return parts


def split_by_window(text, page_starts, meta, size=1500, overlap=250):
    """Fallback for documents without numbered sections."""
    chunks, start, n = [], 0, 0
    while start < len(text):
        piece = clean(text[start:start + size])
        if len(piece) > 100:
            n += 1
            chunks.append({
                "id": f"{meta['doc']}-p{n}",
                "doc": meta["doc"],
                "doc_title": meta["title"],
                "source_url": meta["url"],
                "unit": "Passage",
                "number": str(n),
                "title": piece.split("\n", 1)[0][:100],
                "page": page_at(start, page_starts),
                "text": piece,
            })
        start += size - overlap
    return chunks


def main():
    pdfs = sorted(RAW.glob("*.pdf"))
    if not pdfs:
        sys.exit(f"No PDFs found in {RAW}")
    all_chunks = []
    for pdf in pdfs:
        meta = identify(pdf)
        text, page_starts = extract(pdf)
        if len(text.strip()) < 500:
            print(f"!! {pdf.name}: almost no text - scanned PDF? needs OCR. Skipped.")
            continue
        chunks = split_by_section(text, page_starts, meta)
        if len(chunks) < 10:  # section pattern did not fit this document
            chunks = split_by_window(text, page_starts, meta)
        for c in chunks:
            c["vehicle"] = tag(c["title"] + " " + c["text"])
            c["is_penalty"] = bool(PENALTY.search(c["title"]))
        all_chunks.extend(chunks)
        print(f"{pdf.name}: {len(text):,} chars, {len(page_starts)} pages -> {len(chunks)} chunks [{meta['title']}]")

    # Structured tables transcribed from image-only PDFs (data/structured/*.json)
    for jf in sorted((ROOT / "data" / "structured").glob("*.json")):
        t = json.loads(jf.read_text(encoding="utf-8"))
        for r in t["rows"]:
            parts = [f"Offence: {r['offence']}.", f"Penalty after the Motor Vehicles (Amendment) Act, 2019: {r['penalty']}"]
            if r.get("mva_section"):
                parts.append(f"This amends Section {r['mva_section']} of the Motor Vehicles Act, 1988.")
            if r.get("amend_section"):
                parts.append(f"Listed under Section {r['amend_section']} of the Motor Vehicles (Amendment) Act, 2019.")
            all_chunks.append({
                "id": f"{t['doc']}-r{r['row']}",
                "doc": t["doc"],
                "doc_title": t["doc_title"],
                "source_url": t["source_url"],
                "unit": "Row",
                "number": str(r["row"]),
                "title": r["offence"],
                "page": None,
                "text": " ".join(parts),
                "vehicle": r["vehicle"],
                "is_penalty": True,
                "mva_section": r.get("mva_section"),
                "current": True,
            })
        print(f"{jf.name}: {len(t['rows'])} rows")

    # Link 1988 sections to their 2019 revised penalty, and flag old penalty text
    amended = {c["mva_section"]: c["id"] for c in all_chunks if c.get("mva_section")}
    for c in all_chunks:
        if c["doc"] == "mva1988":
            c["current"] = False  # this PDF is the original 1988 text
            if c["number"] in amended:
                c["amended_by"] = amended[c["number"]]

    OUT.write_text(json.dumps(all_chunks, ensure_ascii=False, indent=1), encoding="utf-8")
    two = sum("two-wheeler" in c["vehicle"] for c in all_chunks)
    four = sum("four-wheeler" in c["vehicle"] for c in all_chunks)
    print(f"\nTotal {len(all_chunks)} chunks -> {OUT}")
    print(f"two-wheeler: {two}  four-wheeler: {four}")


if __name__ == "__main__":
    main()
