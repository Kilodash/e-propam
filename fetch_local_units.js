const http = require('http');

http.get('http://192.168.51.55:3000/api/units', (resp) => {
  let data = '';
  resp.on('data', (chunk) => {
    data += chunk;
  });
  resp.on('end', () => {
    console.log("Status Code:", resp.statusCode);
    console.log("Response Data:", data);
  });
}).on("error", (err) => {
  console.log("Error: " + err.message);
});
