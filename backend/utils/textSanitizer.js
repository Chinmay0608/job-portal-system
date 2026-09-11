/**
 * textSanitizer.js
 * In-Process PII Masking & Support Ticket Spam/Gibberish Triage Utility
 */

const PII_PATTERNS = [
  // Bearer tokens and Authorization headers
  /Bearer\s+[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]*/gi,
  /authorization:\s*\S+/gi,

  // Raw JWTs
  /ey[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]*/g,

  // Passwords, API Keys, Secrets in URL params or text
  /[?&](?:password|passwd|pwd|apikey|api_key|key|token|secret|auth)=[^&\s]*/gi,

  // 12-digit UID / Aadhaar format (e.g. 1234 5678 9012 or 1234-5678-9012 or 123456789012)
  /\b\d{4}[-.\s]?\d{4}[-.\s]?\d{4}\b/g,

  // Credit Card Numbers (13-16 digits with optional spaces/dashes)
  /\b(?:\d[ -]*?){13,16}\b/g,

  // Phone Numbers (10-12 digits with optional country code, dashes, or parens)
  /\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g
];

/**
 * Redacts PII, JWTs, passwords, credit card numbers, Aadhaar/UID, and phone numbers.
 * @param {string} text 
 * @returns {string}
 */
function maskPII(text) {
  if (!text || typeof text !== 'string') return '';
  return PII_PATTERNS.reduce(
    (t, pattern) => t.replace(pattern, '[REDACTED_PII]'),
    String(text)
  );
}

/**
 * Calculates character Shannon entropy to detect low-entropy or gibberish text.
 */
function calculateEntropy(str) {
  if (!str || str.length === 0) return 0;
  const frequencies = {};
  for (const char of str) {
    frequencies[char] = (frequencies[char] || 0) + 1;
  }
  let entropy = 0;
  for (const count of Object.values(frequencies)) {
    const p = count / str.length;
    entropy -= p * Math.log2(p);
  }
  return entropy;
}

/**
 * Evaluates whether ticket description text is spam or gibberish.
 * @param {string} text 
 * @returns {boolean}
 */
function isSpamOrGibberish(text) {
  if (!text || typeof text !== 'string') return true;

  const trimmed = text.trim();
  if (trimmed.length < 3) return true;

  const lower = trimmed.toLowerCase();

  // Known test/spam keywords or bot payloads
  const spamKeywords = [
    'asdf', 'qwerty', 'zxcvbn', 'test bot payload', 'lorem ipsum',
    'test test test', 'sample ticket', 'foo bar', '1234567890'
  ];
  for (const kw of spamKeywords) {
    if (lower.includes(kw)) return true;
  }

  // Key-smashing / repetition regex (e.g., "aaaaaaa", "asdfghjk", "hahahaha")
  if (/(.)\1{5,}/i.test(trimmed)) return true;
  if (/^(?:asdf|ghjk|qwerty|zxcv|1234|abc){2,}$/i.test(trimmed)) return true;

  // Single word > 25 chars without spaces or punctuation (probable key smash)
  const words = trimmed.split(/\s+/);
  for (const word of words) {
    if (word.length > 25 && !word.includes('http') && !word.includes('/')) {
      return true;
    }
  }

  // Entropy check: if text is long (> 15 chars) but entropy is unusually low (< 1.8)
  if (trimmed.length > 15 && calculateEntropy(lower) < 1.8) {
    return true;
  }

  return false;
}

module.exports = {
  maskPII,
  isSpamOrGibberish,
  PII_PATTERNS
};
