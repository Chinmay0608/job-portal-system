require('mongoose').connect('mongodb://127.0.0.1:27017/skillbridge').then(() => {
  require('../../models/Company').updateOne({name: /netflix/i}, {$set: {platformRef: 'LEVER', careerPage: 'https://jobs.lever.co/netflix', status: 'VERIFIED', priority: 5}}).then(() => {
    console.log('Fixed Netflix in DB');
    process.exit(0);
  });
});
