const axios = require('axios');
require('dotenv').config();

async function testAdzunaDirect() {
  const appId = process.env.ADZUNA_APP_ID;
  const apiKey = process.env.ADZUNA_API_KEY;

  console.log('Testing Adzuna API directly with appId:', appId);

  const url = `https://api.adzuna.com/v1/api/jobs/in/search/1`;
  const response = await axios.get(url, {
    params: {
      app_id: appId,
      app_key: apiKey,
      results_per_page: 20,
      what: "developer",
      max_days_old: 30,
      "content-type": "application/json"
    }
  });

  console.log('Adzuna total results available:', response.data.count);
  console.log('Fetched jobs sample:', response.data.results.slice(0, 3).map(j => ({
    title: j.title,
    company: j.company?.display_name,
    location: j.location?.display_name,
    created: j.created,
    redirect: j.redirect_url
  })));
}

testAdzunaDirect().catch(err => {
  console.error('Adzuna Test Error:', err.response?.data || err.message);
});
