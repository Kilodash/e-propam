const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('Connected to Proxmox. Restarting Coolify...');
  conn.exec('pct exec 301 -- docker restart coolify', (err, stream) => {
    if (err) throw err;
    stream.on('close', (code, signal) => {
      console.log('Coolify restarted successfully.');
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
