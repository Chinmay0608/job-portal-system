const axios = require('axios');
axios.get('https://boards-api.greenhouse.io/v1/boards/stripe/jobs?content=true').then(res => {
  const job = res.data.jobs[0];
  console.log(job.content.substring(0, 300));
}).catch(console.error);
