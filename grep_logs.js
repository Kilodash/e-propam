const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
  const cmd = `pct exec 301 -- docker logs --tail 100 y15u7on8161xvwgg5gl1nhje-113847485857 2>&1 | grep -E "(Error|error|units|500)"`;
  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('close', () => conn.end()).on('data', d => process.stdout.write(d)).stderr.on('data', d => process.stderr.write(d));
  });
}).on('error', err => console.error(err)).connect({
  host: '192.168.51.100', port: 22, username: 'root', password: '$&Admin2004', readyTimeout: 10000
});
