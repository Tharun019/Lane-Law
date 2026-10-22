export const CATEGORY_LABELS = {
  stopped: "Stopped by traffic police",
  echallan: "Received a challan / e-challan",
  accident_minor: "Accident — no one injured",
  accident_injury: "Accident — someone injured",
  seized: "Vehicle seized / documents taken",
  licence: "No licence, expired or suspended licence",
  insurance: "Insurance expired or missing",
  minor: "Someone under 18 was driving",
  lending: "Lent my vehicle to someone",
  helmet: "Riding without a helmet",
  drunk: "Drink driving / breath test",
  speeding: "Over-speeding",
  other: "Something else",
};

// Official government portals. Shown as helpful links; they are NOT part of the RAG corpus.
export const OFFICIAL_LINKS = [
  { name: "e-Challan (check & pay challans)", url: "https://echallan.parivahan.gov.in/" },
  { name: "Sarathi (driving licence services)", url: "https://sarathi.parivahan.gov.in/" },
  { name: "Vahan (vehicle registration services)", url: "https://vahan.parivahan.gov.in/" },
  { name: "Parivahan Sewa (all transport services)", url: "https://parivahan.gov.in/" },
];
