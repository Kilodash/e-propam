const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const cmd = `
    echo "=== Updating Uptime Kuma to 2.4.0 ==="
    pct exec 301 -- bash -c "cd /opt/devops && sed -i 's/louislam\\/uptime-kuma:1/louislam\\/uptime-kuma:2.4.0/g' docker-compose.yml"
    pct exec 301 -- bash -c "cd /opt/devops && docker compose pull uptime-kuma"
    pct exec 301 -- bash -c "cd /opt/devops && docker compose up -d uptime-kuma"
    echo "Uptime Kuma has been updated successfully!"
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
