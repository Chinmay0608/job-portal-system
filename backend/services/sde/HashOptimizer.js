const crypto = require('crypto');

class HashOptimizer {
  /**
   * Generates a deterministic SHA-256 hash for a job based ONLY on meaningful fields.
   * We exclude timestamps, tracking IDs, or provider metadata to avoid triggering
   * false-positive AI enrichments on identical data.
   * 
   * @param {Object} job - The normalized extracted job payload
   * @returns {string} - The SHA-256 hash
   */
  static generateHash(job) {
    const meaningfulFields = {
      title: job.title || '',
      description: job.description || '',
      location: job.location || '',
      salary: job.salary || '',
      employmentType: job.employmentType || '',
      applyUrl: job.applyUrl || ''
    };

    // Ensure deterministic ordering and formatting
    const hashString = JSON.stringify(meaningfulFields, Object.keys(meaningfulFields).sort());
    
    return crypto.createHash('sha256').update(hashString).digest('hex');
  }

  /**
   * Compares the new hash with the existing hash to determine if processing is needed.
   * @param {string} newHash 
   * @param {string} oldHash 
   * @returns {boolean} - true if changed, false if identical
   */
  static hasChanged(newHash, oldHash) {
    if (!oldHash) return true;
    return newHash !== oldHash;
  }
}

module.exports = HashOptimizer;
