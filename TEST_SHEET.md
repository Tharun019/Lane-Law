# Lane Law AI — Test Sheet

Retrieval columns come from `npm run eval`. Fill in the **Answer OK?** column live with the deployed app.

| # | Question | Expected source | Retrieved (rank of first correct) | Answer OK? |
|---|---|---|---|---|
| 1 | What is the fine for riding a bike without a helmet? (two-wheeler) | 2019 penalty row 25 (₹1,000 + 3-month licence disqualification); MV Act s.129 | rank 2 (row 24 "overloading two-wheelers" ranks 1) | |
| 2 | What is the penalty for drunk driving? | MV Act s.185 + 2019 row 11 (up to ₹10,000 / 6 months, first offence) | rank 1 | |
| 3 | What happens if I drive without a licence? | 2019 row 7 (₹5,000); MV Act s.3, s.181 | rank 2 | |
| 4 | What is the fine for driving without insurance? | 2019 row 21 (₹2,000 and/or 3 months); MV Act s.196 | rank 1 | |
| 5 | What should I do when an ambulance is coming behind me? | 2019 row 19 (₹10,000 and/or 6 months); Driving Regulations reg. 27 | rank 1 | |

## Must say "I don't know"
| Question | Why | Result |
|---|---|---|
| How do I make biryani? | Off-topic | Refused by retrieval gate (no LLM call) |
| Who is the transport minister of Karnataka? | Not in documents | Refused by retrieval gate |
| Which insurance company is cheapest? | Insurance sections retrieved, but no company or price data | LLM must refuse (check live) |

## Failure cases
1. **Outdated law in the base PDF:** the 1988 text says ₹2,000 for drunk driving. Fixed with 2019 table linking and override rules.
2. **State compounding fines:** Bengaluru challan amounts can differ from the central Act; the app flags this and does not invent city amounts.
3. *(observed)* Helmet question: "overloading two-wheelers" outranks the helmet row because "bike" expands to "two-wheeler". The correct row is still in the top 3, so the answer is unaffected.
