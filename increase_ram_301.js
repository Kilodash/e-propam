const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  // Increase memory to 4GB and swap to 4GB for CT 301
  const cmd = `
    pct set 301 -memory 4096 -swap 4096
    echo "Memory updated."
    pct exec 301 -- free -m
  `;
  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code, signal) => {
      conn.end();
    }).on('data', (data) => {
      process.stdout.write(data);
    }).stderr.on('data', (data) => {
      process.stderr.write(data);
    });
  });
}).on('error', (err) => {
  console.error('Connection error:', err);
}).connect({
  host: '192.168.51.100',
  port: 22,
  username: 'root',
  password: '$&Admin2004',
  readyTimeout: 10000
});
