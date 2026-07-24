const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const cmd = `
    echo "=== Final Fix for Docker ==="
    # Restart network/container just in case
    pct stop 301
    sleep 2
    pct start 301
    sleep 5
    
    pct exec 301 -- bash -c "echo 'nameserver 8.8.8.8' > /etc/resolv.conf"
    pct exec 301 -- ping -c 2 get.docker.com
    
    pct exec 301 -- bash -c "curl -fsSL https://get.docker.com -o get-docker.sh && sh get-docker.sh"
    
    echo "=== Starting DevOps Tools ==="
    pct exec 301 -- bash -c "cd /opt/devops && docker compose up -d"
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
