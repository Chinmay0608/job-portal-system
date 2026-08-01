const axios = require('axios');
const URL = require('url').URL;

class SignatureVerifier {
  /**
   * Verifies the ATS platform of a given URL using a waterfall detection strategy.
   * Priority: Hostname > Redirect > HTML Markers > JS Bundles
   * @param {string} urlString 
   * @returns {Promise<{platform: string, confidence: number, reason: string}>}
   */
  async verify(urlString) {
    try {
      const url = new URL(urlString);
      const hostname = url.hostname.toLowerCase();

      // 1. Known Hostname Check
      if (hostname.includes('boards.greenhouse.io')) {
        return { platform: 'GREENHOUSE', confidence: 100, reason: 'Known Greenhouse Hostname' };
      }
      if (hostname.includes('jobs.lever.co') || hostname.includes('api.lever.co')) {
        return { platform: 'LEVER', confidence: 100, reason: 'Known Lever Hostname' };
      }

      // Fetch the page to check Redirects, HTML, and JS
      const response = await axios.get(urlString, {
        maxRedirects: 3,
        timeout: 10000,
        headers: { 'User-Agent': 'Mozilla/5.0 (Compatible; SkillBridgeBot/1.0)' }
      });

      const finalUrl = new URL(response.request.res.responseUrl || urlString);
      const finalHostname = finalUrl.hostname.toLowerCase();

      // 2. Redirect Destination Check
      if (finalHostname.includes('boards.greenhouse.io')) {
        return { platform: 'GREENHOUSE', confidence: 95, reason: 'Redirected to Greenhouse Hostname' };
      }
      if (finalHostname.includes('jobs.lever.co')) {
        return { platform: 'LEVER', confidence: 95, reason: 'Redirected to Lever Hostname' };
      }

      // 3. HTML Markers & 4. JavaScript Bundles Check
      const html = response.data;
      if (typeof html === 'string') {
        // Greenhouse Markers
        if (html.includes('id="grnhse_app"') || html.includes('grnhse.iframe')) {
          return { platform: 'GREENHOUSE', confidence: 85, reason: 'Found Greenhouse HTML/JS Marker' };
        }
        
        // Lever Markers
        if (html.includes('<meta name="generator" content="Lever">') || html.includes('lever-jobs-container')) {
          return { platform: 'LEVER', confidence: 85, reason: 'Found Lever HTML/JS Marker' };
        }
      }

      // 5. If we reach here, we could optionally try probing standard JSON endpoints
      // E.g. appending /v1/boards/{slug} but that requires knowing the slug.
      
      return { platform: 'UNKNOWN', confidence: 0, reason: 'No known signatures detected' };

    } catch (error) {
      return { platform: 'UNKNOWN', confidence: 0, reason: `Request failed: ${error.message}` };
    }
  }
}

module.exports = new SignatureVerifier();
