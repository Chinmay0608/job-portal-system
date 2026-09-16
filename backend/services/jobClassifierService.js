/**
 * jobClassifierService.js
 * High-precision, zero-memory Job Domain Classifier.
 * Uses weighted contextual keyword mapping across titles & descriptions for 0MB RAM consumption on Render.
 */

const CANDIDATE_LABELS = [
  'Frontend Development',
  'Backend Engineering',
  'Full Stack Development',
  'DevOps & Cloud',
  'Data Science & Machine Learning',
  'Mobile Development',
  'Quality Assurance & SDET',
  'Cybersecurity',
  'Product & Project Management',
  'UI/UX & Design',
  'Core Engineering'
];

const KEYWORD_DOMAIN_MAP = [
  { 
    domain: 'Frontend Development', 
    titleKeywords: ['frontend', 'front-end', 'react', 'vue', 'angular', 'ui developer', 'web developer', 'next.js', 'svelte', 'javascript developer'],
    descKeywords: ['css', 'html', 'tailwind', 'sass', 'redux', 'typescript', 'dom', 'browser', 'responsive design'] 
  },
  { 
    domain: 'Backend Engineering', 
    titleKeywords: ['backend', 'back-end', 'node', 'express', 'django', 'fastapi', 'spring', 'golang', 'java developer', 'golang developer', 'python backend', 'c#', '.net'],
    descKeywords: ['microservices', 'postgresql', 'mongodb', 'mysql', 'redis', 'rest api', 'graphql', 'grpc', 'kafka', 'rabbit'] 
  },
  { 
    domain: 'Full Stack Development', 
    titleKeywords: ['full stack', 'fullstack', 'full-stack', 'mern', 'mean'],
    descKeywords: ['full lifecycle', 'frontend and backend', 'client and server'] 
  },
  { 
    domain: 'DevOps & Cloud', 
    titleKeywords: ['devops', 'cloud', 'sre', 'site reliability', 'infrastructure', 'platform engineer', 'aws engineer', 'kubernetes engineer'],
    descKeywords: ['docker', 'kubernetes', 'terraform', 'ci/cd', 'ansible', 'helm', 'jenkins', 'github actions', 'cloudformation', 'linux'] 
  },
  { 
    domain: 'Data Science & Machine Learning', 
    titleKeywords: ['data scientist', 'machine learning', 'ml engineer', 'ai engineer', 'data engineer', 'deep learning', 'nlp engineer', 'computer vision'],
    descKeywords: ['pytorch', 'tensorflow', 'pandas', 'numpy', 'spark', 'hadoop', 'llm', 'genai', 'scikit-learn', 'data pipeline', 'etl'] 
  },
  { 
    domain: 'Mobile Development', 
    titleKeywords: ['android', 'ios', 'flutter', 'react native', 'mobile developer', 'mobile engineer', 'swift developer', 'kotlin developer'],
    descKeywords: ['swiftui', 'jetpack compose', 'app store', 'play store', 'xcode', 'mobile app'] 
  },
  { 
    domain: 'Quality Assurance & SDET', 
    titleKeywords: ['qa', 'sdet', 'test engineer', 'automation engineer', 'quality assurance', 'tester'],
    descKeywords: ['cypress', 'selenium', 'playwright', 'testng', 'junit', 'manual testing', 'api testing', 'postman', 'regression testing'] 
  },
  { 
    domain: 'Cybersecurity', 
    titleKeywords: ['security', 'cyber', 'soc analyst', 'penetration tester', 'infosec', 'security engineer', 'vapt'],
    descKeywords: ['siem', 'threat', 'vulnerability', 'owasp', 'firewall', 'encryption', 'pci-dss', 'iso 27001', 'zero trust'] 
  },
  {
    domain: 'Product & Project Management',
    titleKeywords: ['product manager', 'project manager', 'scrum master', 'product owner', 'program manager', 'technical product manager'],
    descKeywords: ['roadmap', 'agile', 'sprint', 'user stories', 'kpis', 'stakeholder management', 'jira']
  },
  {
    domain: 'UI/UX & Design',
    titleKeywords: ['ui/ux', 'ux designer', 'product designer', 'graphic designer', 'visual designer', 'ui designer'],
    descKeywords: ['figma', 'wireframes', 'prototyping', 'design system', 'user research', 'usability testing']
  },
  {
    domain: 'Core Engineering',
    titleKeywords: ['mechanical', 'electrical', 'embedded', 'firmware', 'hardware', 'vlsi', 'iot', 'robotics'],
    descKeywords: ['microcontroller', 'pcb', 'cad', 'circuit', 'c/c++', 'arm', 'rtos']
  }
];

function classifyWithKeywords(title = '', description = '') {
  const titleLower = title.toLowerCase();
  const descLower = description.toLowerCase();

  let bestDomain = 'Uncategorized';
  let highestScore = 0;

  for (const item of KEYWORD_DOMAIN_MAP) {
    let score = 0;

    // Title matches (weight = 3.0)
    for (const kw of item.titleKeywords) {
      const regex = new RegExp(`\\b${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      if (regex.test(titleLower)) {
        score += 3.0;
      }
    }

    // Description matches (weight = 1.0)
    for (const kw of item.descKeywords) {
      const regex = new RegExp(`\\b${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      if (regex.test(descLower)) {
        score += 1.0;
      }
    }

    if (score > highestScore) {
      highestScore = score;
      bestDomain = item.domain;
    }
  }

  const confidence = highestScore > 0 ? Math.min(0.98, 0.65 + (highestScore * 0.08)) : 0.4;
  return {
    primaryDomain: bestDomain,
    confidence: Number(confidence.toFixed(2))
  };
}

/**
 * Classifies a job's title and description into standard technical domains.
 * @param {string} title 
 * @param {string} description 
 * @returns {Promise<{ primaryDomain: string, confidence: number }>}
 */
async function classifyJob(title = '', description = '') {
  const text = `${title || ''} ${(description || '').slice(0, 400)}`.trim();
  if (!text) {
    return { primaryDomain: 'Uncategorized', confidence: 0 };
  }

  if (process.env.USE_LOCAL_ONNX === 'true') {
    try {
      const { pipeline } = require('@xenova/transformers');
      if (!global.__zeroShotPipeline) {
        global.__zeroShotPipeline = await pipeline('zero-shot-classification', 'Xenova/nli-deberta-v3-small', { quantized: true });
      }
      const result = await global.__zeroShotPipeline(text, CANDIDATE_LABELS);
      return {
        primaryDomain: result.labels[0],
        confidence: result.scores[0]
      };
    } catch (err) {
      console.warn('[JobClassifier Warning] Local ONNX failed, using keyword fallback:', err.message);
    }
  }

  return classifyWithKeywords(title, description);
}

class ZeroShotPipeline {
  static async getInstance() {
    return null;
  }
}

module.exports = {
  ZeroShotPipeline,
  CANDIDATE_LABELS,
  classifyJob
};
