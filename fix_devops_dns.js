const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const cmd = `
    echo "=== Fixing DNS in CT 301 ==="
    pct set 301 --nameserver 8.8.8.8
    pct exec 301 -- bash -c "echo 'nameserver 8.8.8.8' > /etc/resolv.conf"
    
    echo "=== Re-Installing Docker ==="
    pct exec 301 -- bash -c "curl -fsSL https://get.docker.com | sh"
    
    echo "=== Re-Deploying Portainer & Uptime Kuma ==="
    pct exec 301 -- bash -c "cd /opt/devops && docker compose up -d"
    
    echo "=== Installing Openship ==="
    pct exec 301 -- bash -c "curl -fsSL https://get.openship.io | sh"
    
    echo "=== Fix Completed ==="
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
