const fs = require('fs');

const companies = [];
const realCompanies = [
  { name: 'Stripe', website: 'https://stripe.com', careersUrl: 'https://boards.greenhouse.io/stripe', priority: 10 },
  { name: 'Figma', website: 'https://figma.com', careersUrl: 'https://boards.greenhouse.io/figma', priority: 10 },
  { name: 'Vercel', website: 'https://vercel.com', careersUrl: 'https://boards.greenhouse.io/vercel', priority: 10 },
  { name: 'Netflix', website: 'https://netflix.com', careersUrl: 'https://jobs.lever.co/netflix', priority: 10 },
  { name: 'Reddit', website: 'https://reddit.com', careersUrl: 'https://boards.greenhouse.io/reddit', priority: 10 },
  // Broken / Invalid for testing Revisions
  { name: 'BrokenCompany', website: 'http://this-domain-will-not-resolve-12345.com', careersUrl: 'http://this-domain-will-not-resolve-12345.com/careers', priority: 5 }
];

companies.push(...realCompanies);

// Pad out to 250 for Stage 1 Load test
for (let i = 1; i <= 244; i++) {
  companies.push({
    name: `TestCorp ${i}`,
    website: `https://testcorp${i}.com`,
    careersUrl: `https://boards.greenhouse.io/testcorp${i}`,
    priority: 5,
    country: 'USA',
    industry: 'Technology'
  });
}

fs.writeFileSync(__dirname + '/tier1.json', JSON.stringify(companies, null, 2));
console.log(`Generated tier1.json with ${companies.length} companies.`);
