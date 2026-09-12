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

const KEYWORD_DOMAIN_MAP = [
  { domain: 'Frontend Development', keywords: ['frontend', 'react', 'vue', 'angular', 'css', 'html', 'next.js', 'ui developer'] },
  { domain: 'Backend Engineering', keywords: ['backend', 'node', 'express', 'django', 'spring', 'golang', 'java', 'sql', 'postgres', 'microservices'] },
  { domain: 'Full Stack Development', keywords: ['full stack', 'fullstack', 'mern', 'mean'] },
  { domain: 'DevOps & Cloud', keywords: ['devops', 'cloud', 'aws', 'azure', 'docker', 'kubernetes', 'sre', 'ci/cd'] },
  { domain: 'Data Science & Machine Learning', keywords: ['data scientist', 'machine learning', 'deep learning', 'ai', 'data engineer', 'nlp', 'computer vision'] },
  { domain: 'Mobile Development', keywords: ['android', 'ios', 'flutter', 'react native', 'swift', 'kotlin'] },
  { domain: 'Quality Assurance & SDET', keywords: ['qa', 'tester', 'sdet', 'test automation', 'cypress', 'selenium'] },
  { domain: 'Cybersecurity', keywords: ['security', 'cyber', 'soc', 'penetration', 'infosec'] }
];

function fallbackKeywordClassify(text) {
  const lower = text.toLowerCase();
  for (const item of KEYWORD_DOMAIN_MAP) {
    if (item.keywords.some(kw => lower.includes(kw))) {
      return { primaryDomain: item.domain, confidence: 0.8 };
    }
  }
  return { primaryDomain: 'Uncategorized', confidence: 0 };
}

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

  try {
    const classifier = await ZeroShotPipeline.getInstance();
    const result = await classifier(text, CANDIDATE_LABELS);

    return {
      primaryDomain: result.labels[0],
      confidence: result.scores[0]
    };
  } catch (err) {
    console.warn('[JobClassifier Warning] Failed to run zero-shot classifier, using keyword fallback:', err.message);
    return fallbackKeywordClassify(text);
  }
}

module.exports = {
  ZeroShotPipeline,
  CANDIDATE_LABELS,
  classifyJob
};
