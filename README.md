# Lane Law AI

**Know the law before the challan.** A Retrieval-Augmented Generation (RAG) app that explains Indian traffic law to riders and drivers. It answers **only** from official documents, shows the exact section behind every answer, and says **"I don't know"** when the documents don't cover a question.

Built for the GAT Dept. of AIML Hack Hour *"From Text to Insight — Ask Your Documents"*, 22 Oct 2026.

## The problem
- **User:** two-wheeler and car drivers in Bengaluru, especially new licence holders.
- **Problem:** the Motor Vehicles Act is a 233-page legal text, so people rely on hearsay. Many still quote fines that changed in 2019; drunk driving, for example, went from ₹2,000 to ₹10,000.
- **Value over manual search:** describe your situation in plain words and get the matching sections, current fines, the official process and next steps, each one cited.

## Features
- **Profile ("account")** with licence class, age group and vehicles (insurance and PUC dates). It's stored only in the browser (localStorage); no Aadhaar or licence numbers are collected.
- **Situation analysis:** pick what happened, describe it, and get a report covering situation understanding, what the law says, penalties that may apply, how the government handles it, a reality check, a next-steps checklist, documents to keep, what the documents *don't* answer, and official portal links. Every legal point is cited.
- **Compliance check ("My garage"):** flags expired insurance or PUC, a licence that doesn't match the vehicle class, under-18 drivers, and so on, with one-click "what does the law say?".
- **Quick ask:** chat with cited answers, a Found / Not-in-documents badge, a "show retrieval" view with scores, and follow-up memory for the last 2 turns.
- **Saved reports**, "Save as PDF" (print), and a two-wheeler / four-wheeler filter.

## Pipeline
| Step | What happens |
|---|---|
| **Ingest** (`scripts/ingest.py`) | 3 PDFs → one chunk per Section / Regulation / penalty row. Table-of-contents stubs and amendment footnotes are filtered out; long sections are split into overlapping parts. Each chunk keeps its section number, title, page and source URL. Tagged two-wheeler / four-wheeler. **352 chunks.** |
| **Retrieve** (`lib/search.js`) | BM25 (title weighted 3×) + **domain query rewriting** ("bike" → "motor cycle", "drunk" → "drunken driving") + fine-intent boost toward the 2019 table + vehicle filter boost + **amendment linking** (a 1988 section pulls in its 2019 revised fine). Weak matches get an **LLM query rewrite** and a second search. The situation endpoint runs **multi-query retrieval** (user text + category-specific + compliance-flag queries). |
| **Generate** (`app/api/*`) | Groq (`openai/gpt-oss-120b`, with model fallback on rate limits). The prompt allows only the numbered sources, says the 2019 penalties override the 1988 text, and requires an exact refusal otherwise. Off-topic questions are refused by a **retrieval gate** before any LLM call. |
| **Cite** | Every claim carries `[S#]` tags → clickable source cards (section, page, passage, link to the official PDF). Invalid tags are stripped server-side. |

## Data (all real, no synthetic data)
| Document | Source |
|---|---|
| Motor Vehicles Act, 1988 (original text) | [India Code](https://indiacode.nic.in/bitstream/123456789/19318/1/the_motor_vehicle_act_1988.pdf) |
| Motor Vehicles (Driving) Regulations, 2017 (G.S.R. 634(E)) | [Kerala Police circular reproducing the MoRTH gazette](https://keralapolice.gov.in/storage/orders/iaps/cir-15-2018.pdf) |
| Revised penalties, MV (Amendment) Act 2019 (25 rows, source: MoRTH) | [Vikaspedia](https://en.vikaspedia.in/viewcontent/social-welfare/social-awareness/consumer-education/safe-driving/revised-penalties-under-amended-motor-vehicles-act). This was an image-only PDF; it was OCR'd and checked row by row against the page images → `data/structured/mv_penalties_2019.json` |

## Evaluation
`npm run eval` runs the test sheet through the real retrieval code → `data/eval.json` (shown on the site).
- **Hit@1: 8/10, Hit@3: 10/10** on answerable questions.
- **2/2** off-topic questions refused by the retrieval gate.
- "Which insurance company is cheapest?" retrieves insurance sections, so the **LLM** must refuse; this is checked live.

See `TEST_SHEET.md` for the 5-question test sheet and failure cases.

### Failure cases
1. **Outdated base document.** The Act PDF is the 1988 text (Section 185 still says ₹2,000; 194B/194D/194E don't exist). Plain RAG would confidently quote old fines. *Fix:* added the 2019 table, linked sections, boosted it for fine questions, and made the prompt say "2019 overrides 1988".
2. **State fines differ from the central Act.** States set compounding amounts (for example, Karnataka and Kerala cut some 2019 fines). The app can only give central figures. *Mitigation:* every fine carries a "state amounts may differ" note; city-specific amounts are listed under "not covered".

## Run locally
```bash
npm install
cp .env.example .env.local   # then put your Groq key in it
npm run dev                  # http://localhost:3000
```
Re-build the corpus (optional): `pip install pypdf && python scripts/ingest.py`

## Deploy (Vercel)
Import the GitHub repo → add the Environment Variable `GROQ_API_KEY` → Deploy.

**Stack:** Next.js 16 · React 19 · Tailwind CSS 4 · Motion · Groq API · BM25 (no vector DB needed for 352 chunks).

*Not legal advice. Answers explain official documents; actual challan amounts depend on your state.*
