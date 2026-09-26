// ClickGuide Intent Matcher - Keyword scoring engine (No API Key Required)
const KEYWORD_RULES = {
  'create-repo': [
    { word: 'create', weight: 3 },
    { word: 'repo', weight: 4 },
    { word: 'repository', weight: 5 },
    { word: 'new', weight: 2 },
    { word: 'first', weight: 2 },
    { word: 'start', weight: 2 },
    { word: 'make', weight: 2 },
    { word: 'initialize', weight: 3 },
    { word: 'setup', weight: 2 },
    { word: 'init', weight: 3 },
    // Hinglish keywords
    { word: 'banao', weight: 4 },
    { word: 'banaye', weight: 4 },
    { word: 'banani', weight: 4 },
    { word: 'naya', weight: 3 },
    { word: 'nayi', weight: 3 },
    { word: 'pehla', weight: 3 },
    { word: 'pehli', weight: 3 }
  ],
  'open-pr': [
    { word: 'pull', weight: 5 },
    { word: 'request', weight: 5 },
    { word: 'pr', weight: 5 },
    { word: 'edit', weight: 3 },
    { word: 'readme', weight: 4 },
    { word: 'commit', weight: 4 },
    { word: 'propose', weight: 4 },
    { word: 'change', weight: 2 },
    { word: 'changes', weight: 2 },
    { word: 'merge', weight: 3 },
    { word: 'contribute', weight: 3 },
    { word: 'fork', weight: 3 },
    // Hinglish keywords
    { word: 'bheje', weight: 4 },
    { word: 'bhejna', weight: 4 },
    { word: 'bhejo', weight: 4 },
    { word: 'karna', weight: 2 },
    { word: 'badlo', weight: 3 },
    { word: 'badalna', weight: 3 }
  ]
};

/**
 * Normalize input string
 */
function normalizeText(text) {
  if (!text || typeof text !== 'string') return '';
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Match query against authored flows
 */
function matchQuery(query, customFlows) {
  let flows = customFlows;
  if (!flows) {
    if (typeof CLICKGUIDE_FLOWS !== 'undefined') {
      flows = CLICKGUIDE_FLOWS;
    } else if (typeof globalThis !== 'undefined' && globalThis.CLICKGUIDE_FLOWS) {
      flows = globalThis.CLICKGUIDE_FLOWS;
    } else {
      flows = {};
    }
  }

  const cleanText = normalizeText(query);
  const tokens = cleanText.split(' ').filter(Boolean);

  const availableFlows = Object.keys(flows).map((id) => ({
    id,
    title_en: flows[id].title_en,
    title_hi: flows[id].title_hi,
    description_en: flows[id].description_en,
    description_hi: flows[id].description_hi
  }));

  if (!cleanText || tokens.length === 0) {
    return {
      matched: false,
      flowId: null,
      flow: null,
      confidence: 0,
      query: cleanText,
      message: 'I can guide you through these tasks:',
      availableFlows
    };
  }

  const scores = {
    'create-repo': 0,
    'open-pr': 0
  };

  // Calculate keyword matching scores
  for (const [flowId, rules] of Object.entries(KEYWORD_RULES)) {
    for (const rule of rules) {
      if (tokens.includes(rule.word)) {
        scores[flowId] += rule.weight;
      } else if (cleanText.includes(rule.word)) {
        scores[flowId] += rule.weight * 0.8;
      }
    }
  }

  let bestFlowId = null;
  let highestScore = 0;

  for (const [flowId, score] of Object.entries(scores)) {
    if (score > highestScore) {
      highestScore = score;
      bestFlowId = flowId;
    }
  }

  const MATCH_THRESHOLD = 3;

  if (bestFlowId && highestScore >= MATCH_THRESHOLD) {
    return {
      matched: true,
      flowId: bestFlowId,
      flow: flows[bestFlowId] || null,
      confidence: Math.min(100, Math.round((highestScore / 10) * 100)),
      query: cleanText,
      availableFlows
    };
  }

  return {
    matched: false,
    flowId: null,
    flow: null,
    confidence: 0,
    query: cleanText,
    message: 'I can guide you through these tasks:',
    availableFlows
  };
}

const MatcherAPI = {
  matchQuery,
  normalizeText,
  KEYWORD_RULES
};

if (typeof window !== 'undefined') {
  window.ClickGuideMatcher = MatcherAPI;
}
if (typeof globalThis !== 'undefined') {
  globalThis.ClickGuideMatcher = MatcherAPI;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MatcherAPI;
}
