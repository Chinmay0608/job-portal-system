/**
 * jobClassifierService.js
 * Hugging Face Zero-Shot Job Domain Classifier using @xenova/transformers (Xenova/nli-deberta-v3-small)
 */

const { pipeline } = require('@xenova/transformers');

class ZeroShotPipeline {
  static instance = null;

  static async getInstance() {
    if (this.instance === null) {
      this.instance = await pipeline('zero-shot-classification', 'Xenova/nli-deberta-v3-small');
    }
    return this.instance;
  }
}

const CANDIDATE_LABELS = [
  'Frontend Development',
  'Backend Engineering',
  'Full Stack Development',
  'DevOps & Cloud',
  'Data Science & Machine Learning',
  'Mobile Development',
  'Quality Assurance & SDET',
  'Cybersecurity'
];

/**
 * Classifies a job's title and description into standard technical domains.
 * @param {string} title 
 * @param {string} description 
 * @returns {Promise<{ primaryDomain: string, confidence: number }>}
 */
async function classifyJob(title = '', description = '') {
  const text = `${title || ''} ${(description || '').slice(0, 300)}`.trim();
  if (!text) {
    return { primaryDomain: 'Uncategorized', confidence: 0 };
  }

  const classifier = await ZeroShotPipeline.getInstance();
  const result = await classifier(text, CANDIDATE_LABELS);

  return {
    primaryDomain: result.labels[0],
    confidence: result.scores[0]
  };
}

module.exports = {
  ZeroShotPipeline,
  CANDIDATE_LABELS,
  classifyJob
};
