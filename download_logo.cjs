const https = require('https');
const fs = require('fs');

const file = fs.createWriteStream("logo.jpg");
https.get("https://i.postimg.cc/4NP62dYC/IMG-20260420-WA0023-2.jpg", function(response) {
  response.pipe(file);
  file.on('finish', () => {
    file.close();
    console.log('Downloaded logo.');
  });
});
