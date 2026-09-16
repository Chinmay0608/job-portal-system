/**
 * embeddingService.js
 * High-performance, zero-memory Subword & Token Vectorizer for Skill Matching & Candidate-Job Semantic Scoring.
 * Designed for ultra-low memory overhead on cloud containers (Render Free Tier 512MB RAM).
 */

const VECTOR_DIM = 128;

/**
 * Fast deterministic string hash function
 */
function hashString(str, seed = 0) {
  let h = seed;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/**
 * Generates a normalized 1D embedding Float32Array for the given text.
 * Uses subword n-gram frequency hash projections with L2 unit normalization.
 * @param {string} text 
 * @returns {Promise<Float32Array>}
 */
async function getEmbedding(text) {
  if (!text || typeof text !== 'string') {
    return new Float32Array(VECTOR_DIM);
  }

  // If local ONNX is explicitly enabled in environment, use transformers pipeline
  if (process.env.USE_LOCAL_ONNX === 'true') {
    try {
      const { pipeline } = require('@xenova/transformers');
      if (!global.__xenovaPipeline) {
        global.__xenovaPipeline = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', { quantized: true });
      }
      const output = await global.__xenovaPipeline(text, { pooling: 'mean', normalize: true });
      return output.data;
    } catch (err) {
      console.warn('[EmbeddingService] Local ONNX failed, using zero-memory vectorizer:', err.message);
    }
  }

  // Zero-Memory Subword + Word Token Hash Projection (128-dim)
  const vec = new Float32Array(VECTOR_DIM);
  const normalized = text.toLowerCase().trim().replace(/[^a-z0-9#+.\s]/g, ' ');
  const words = normalized.split(/\s+/).filter(Boolean);

  if (words.length === 0) {
    return vec;
  }

  // 1. Word token projections
  for (const word of words) {
    const idx = hashString(word, 13) % VECTOR_DIM;
    const sign = (hashString(word, 37) % 2 === 0) ? 1.0 : -1.0;
    vec[idx] += sign * 1.5;

    // 2. Character 3-gram projections for typo tolerance and morphology (e.g. 'react', 'reactjs')
    const padded = `^${word}$`;
    for (let i = 0; i <= padded.length - 3; i++) {
      const trigram = padded.slice(i, i + 3);
      const tIdx = hashString(trigram, 71) % VECTOR_DIM;
      const tSign = (hashString(trigram, 101) % 2 === 0) ? 0.6 : -0.6;
      vec[tIdx] += tSign;
    }
  }

  // L2 Unit Normalization
  let sumSq = 0;
  for (let i = 0; i < VECTOR_DIM; i++) {
    sumSq += vec[i] * vec[i];
  }

  const norm = Math.sqrt(sumSq);
  if (norm > 0) {
    for (let i = 0; i < VECTOR_DIM; i++) {
      vec[i] /= norm;
    }
  }

  return vec;
}

/**
 * Calculates dot product cosine similarity between two normalized vectors.
 * @param {Array|Float32Array} vecA 
 * @param {Array|Float32Array} vecB 
 * @returns {number}
 */
function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length === 0 || vecA.length !== vecB.length) {
    return 0;
  }
  let dot = 0;
  for (let i = 0; i < vecA.length; i++) {
    dot += vecA[i] * vecB[i];
  }
  return Math.max(0, Math.min(1, dot));
}

/**
 * Finds the best skill match from a list of candidate skills using vector similarity.
 * @param {string} inputSkill 
 * @param {string[]} masterSkillList 
 * @param {number} threshold 
 * @returns {Promise<{ match: string, score: number } | null>}
 */
async function findBestSkillMatch(inputSkill, masterSkillList = [], threshold = 0.75) {
  if (!inputSkill || !Array.isArray(masterSkillList) || masterSkillList.length === 0) {
    return null;
  }

  // Exact match check first for maximum speed
  const exactMatch = masterSkillList.find(s => s.toLowerCase() === inputSkill.toLowerCase());
  if (exactMatch) {
    return { match: exactMatch, score: 1.0 };
  }

  const inputVec = await getEmbedding(inputSkill);
  if (inputVec.length === 0) return null;

  let bestMatch = null;
  let maxScore = -1;

  for (const masterSkill of masterSkillList) {
    const masterVec = await getEmbedding(masterSkill);
    const score = cosineSimilarity(inputVec, masterVec);
    if (score > maxScore) {
      maxScore = score;
      bestMatch = masterSkill;
    }
  }

  if (maxScore >= threshold && bestMatch) {
    return { match: bestMatch, score: maxScore };
  }

  return null;
}

class EmbeddingPipeline {
  static async getInstance() {
    return null;
  }
}

module.exports = {
  EmbeddingPipeline,
  getEmbedding,
  cosineSimilarity,
  findBestSkillMatch
};
