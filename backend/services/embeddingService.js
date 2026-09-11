/**
 * embeddingService.js
 * In-memory Hugging Face Embeddings & Skill Normalizer using @xenova/transformers
 */

const { pipeline } = require('@xenova/transformers');

class EmbeddingPipeline {
  static instance = null;

  static async getInstance() {
    if (this.instance === null) {
      this.instance = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    }
    return this.instance;
  }
}

/**
 * Generates a normalized 1D embedding Float32Array for the given text.
 * @param {string} text 
 * @returns {Promise<Float32Array>}
 */
async function getEmbedding(text) {
  if (!text || typeof text !== 'string') {
    return new Float32Array(0);
  }
  const extractor = await EmbeddingPipeline.getInstance();
  const output = await extractor(text, { pooling: 'mean', normalize: true });
  return output.data;
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
  return dot;
}

/**
 * Finds the best skill match from a list of candidate skills using vector similarity.
 * @param {string} inputSkill 
 * @param {string[]} masterSkillList 
 * @param {number} threshold 
 * @returns {Promise<{ match: string, score: number } | null>}
 */
async function findBestSkillMatch(inputSkill, masterSkillList = [], threshold = 0.78) {
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

module.exports = {
  EmbeddingPipeline,
  getEmbedding,
  cosineSimilarity,
  findBestSkillMatch
};
