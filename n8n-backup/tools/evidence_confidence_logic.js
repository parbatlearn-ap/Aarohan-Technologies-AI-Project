const rows = $input.all().map(i => i.json);

if (!rows || rows.length === 0) {
  return [{
    json: {
      answer: "This could not be found in the available Aarohan policy corpus. Please contact People Ops for guidance.",
      source_document: null,
      source_section: null,
      similarity: 0,
      confidence: "low",
      human_review_required: true,
      reason: "No policy chunks were returned by the retrieval query."
    }
  }];
}

const question = $('Receive Question').item.json.question || '';

// --- Thresholds (documented, calibrated from Step 11C's real retrieval numbers) ---
const INSUFFICIENT_EVIDENCE_FLOOR = 0.60; // below this raw similarity, treat as no match at all
const HIGH_CONFIDENCE_FLOOR = 0.70;       // observed floor of genuine top-1 matches in Step 11C
const AMBIGUOUS_MARGIN = 0.03;            // narrow top1/top2 margin band, also from Step 11C
const COVERAGE_FLOOR = 0.5;               // >=50% of the question's salient terms must appear in the
                                           // selected evidence, or it is not treated as a supported answer

// --- Deterministic text helpers (no LLM call; explainable, fixed rules) ---
const STOPWORDS = new Set([
  "what","who","how","many","will","if","my","i","am","a","an","the","is","are","do","does","did",
  "of","to","for","in","on","and","or","at","as","be","get","gets","should","already","after","before",
  "during","this","that","their","they","it","its","have","has","had","can","could","would","when",
  "where","why","new","hire","hires","hired","employee","employees","days","day","happen","happens",
  "found","receive"
]);
// Words that appear in almost every chunk's own document header
// ("Aarohan Technologies — ... <Doc> Policy (Fictional)\nSection: ...") and therefore
// carry no discriminating power on their own.
const CORPUS_HEADER_TERMS = new Set(["aarohan","technologies","policy","fictional","section"]);

function tokenize(text) {
  return (text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/[\s-]+/)
    .filter(Boolean);
}

function stem(w) {
  const suffixes = ["ational", "ization", "ing", "edly", "ed", "es", "s"];
  for (const suf of suffixes) {
    if (w.length - suf.length >= 4 && w.endsWith(suf)) return w.slice(0, -suf.length);
  }
  return w;
}

function salientWords(text) {
  const toks = tokenize(text);
  const out = [];
  const seen = new Set();
  for (const w of toks) {
    const s = stem(w);
    if (STOPWORDS.has(w) || STOPWORDS.has(s)) continue;
    if (CORPUS_HEADER_TERMS.has(w) || CORPUS_HEADER_TERMS.has(s)) continue;
    if (w.length < 3) continue;
    if (!seen.has(s)) { seen.add(s); out.push(s); }
  }
  return out;
}

function stemMatch(qWord, hToken) {
  const hs = stem(hToken);
  if (qWord === hs) return true;
  const minLen = Math.min(qWord.length, hs.length);
  if (minLen >= 4 && qWord.slice(0, 4) === hs.slice(0, 4) &&
      (qWord.startsWith(hs) || hs.startsWith(qWord))) return true;
  return false;
}

function containsWord(haystack, word) {
  const hToks = tokenize(haystack);
  return hToks.some(h => stemMatch(word, h));
}

function coverage(words, text) {
  const matched = words.filter(w => containsWord(text, w));
  const missing = words.filter(w => !matched.includes(w));
  const ratio = matched.length / Math.max(1, words.length);
  return { ratio, matched, missing };
}

function sectionTitleText(section) {
  return (section || "").replace(/^\d+\.\s*/, "");
}

// --- Step 1: similarity + contention set (candidates within AMBIGUOUS_MARGIN of top-1) ---
const withSimilarity = rows.map(r => Object.assign({}, r, { similarity: 1 - r.distance }));
withSimilarity.sort((a, b) => b.similarity - a.similarity);
const top1 = withSimilarity[0];
const contention = withSimilarity.filter(r => (top1.similarity - r.similarity) <= AMBIGUOUS_MARGIN);

// --- Step 2: question's salient (concept-bearing) words ---
const qWords = salientWords(question);

// --- Step 3: section-level specificity re-rank within the contention set only.
// "Same document" is NOT used as a signal anywhere below -- only how well each
// candidate's OWN section title matches the question's salient terms, normalized
// by title length (so a short, exact-match title like "Equipment" beats a longer,
// loosely-related title like "Onboarding Differences for Remote Hires"). ---
for (const c of contention) {
  const title = sectionTitleText(c.section);
  const titleWords = tokenize(title).filter(w => !STOPWORDS.has(w));
  const matches = qWords.filter(w => containsWord(title, w));
  c.title_match_count = matches.length;
  c.title_match_ratio = matches.length / Math.max(1, titleWords.length);
}
const maxRatio = Math.max(...contention.map(c => c.title_match_ratio));
const winners = contention.filter(c => Math.abs(c.title_match_ratio - maxRatio) < 1e-9);
const specificityDecisive = maxRatio > 0 && winners.length === 1;
const selected = specificityDecisive ? winners[0] : top1;

const others = contention.filter(c => c !== selected);
let nextBest = others.length > 0
  ? others.reduce((a, b) => (a.similarity > b.similarity ? a : b))
  : withSimilarity.find(r => r !== selected) || null;
const margin = nextBest ? selected.similarity - nextBest.similarity : 1;

// --- Step 4: concept coverage check against the SELECTED evidence's own chunk_text.
// This is the primary gate against "generic keyword overlap" false positives
// (e.g. a question about parental leave matching on the word "leave" alone). ---
const { ratio: coverageRatio, missing: missingTerms } = coverage(qWords, selected.chunk_text || "");

// --- Step 5: decision ---
let confidence, humanReviewRequired, answer, sourceDocument, sourceSection, reason;

if (coverageRatio < COVERAGE_FLOOR) {
  confidence = "low";
  humanReviewRequired = true;
  answer = "This could not be found in the available Aarohan policy corpus. Please contact People Ops for guidance.";
  sourceDocument = selected.document_id;
  sourceSection = selected.section;
  reason = "The closest retrieved evidence (" + selected.document_id + " / " + selected.section +
    ") only shares generic terms with the question and does not cover its specific terms: [" +
    missingTerms.join(", ") + "]. Treating this as not covered by the policy corpus rather than " +
    "presenting a non-responsive chunk as an answer.";
} else if (selected.similarity < INSUFFICIENT_EVIDENCE_FLOOR) {
  confidence = "low";
  humanReviewRequired = true;
  answer = "This could not be found in the available Aarohan policy corpus. Please contact People Ops for guidance.";
  sourceDocument = null;
  sourceSection = null;
  reason = "Best match similarity (" + selected.similarity.toFixed(3) + ") is below the " +
    INSUFFICIENT_EVIDENCE_FLOOR + " evidence floor.";
} else if (selected.similarity >= HIGH_CONFIDENCE_FLOOR && (margin >= AMBIGUOUS_MARGIN || specificityDecisive)) {
  confidence = "high";
  humanReviewRequired = false;
  answer = selected.chunk_text;
  sourceDocument = selected.document_id;
  sourceSection = selected.section;
  reason = specificityDecisive && margin < AMBIGUOUS_MARGIN
    ? "Similarity " + selected.similarity.toFixed(3) + " meets the high-confidence floor, and this " +
      "section's title uniquely and specifically matches the question's own terms among the " +
      "near-tied candidates, resolving what would otherwise be a narrow-margin ambiguity."
    : "Similarity " + selected.similarity.toFixed(3) + " meets the high-confidence floor with a clear " +
      "margin (" + margin.toFixed(3) + ") over the next-best candidate, and the retrieved text covers " +
      "the question's specific terms.";
} else {
  confidence = "medium";
  humanReviewRequired = true;
  answer = selected.chunk_text;
  sourceDocument = selected.document_id;
  sourceSection = selected.section;
  reason = "Similarity " + selected.similarity.toFixed(3) + " is reasonable and the retrieved text covers " +
    "the question's specific terms, but the margin to the next-best candidate (" + margin.toFixed(3) +
    ") is narrow and no single section title is a clearly better match -- flagging for human " +
    "confirmation rather than asserting one section with full confidence.";
}

return [{
  json: {
    answer: answer,
    source_document: sourceDocument,
    source_section: sourceSection,
    similarity: Math.round(selected.similarity * 1000) / 1000,
    confidence: confidence,
    human_review_required: humanReviewRequired,
    reason: reason
  }
}];
