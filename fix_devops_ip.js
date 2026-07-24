const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const cmd = `
    echo "=== Changing IP to avoid potential conflict ==="
    pct stop 301 2>/dev/null || true
    sleep 2
    pct set 301 -net0 name=eth0,bridge=vmbr0,ip=192.168.51.55/24,gw=192.168.51.1
    pct set 301 --nameserver 8.8.8.8
    pct start 301
    echo "Waiting for boot..."
    sleep 10
    
    echo "=== Re-Installing Docker ==="
    pct exec 301 -- bash -c "apt-get update && apt-get install -y ca-certificates curl gnupg"
    pct exec 301 -- bash -c "install -m 0755 -d /etc/apt/keyrings && curl -fsSL https://download.docker.com/linux/debian/gpg -o /etc/apt/keyrings/docker.asc && chmod a+r /etc/apt/keyrings/docker.asc"
    pct exec 301 -- bash -c "echo \\"deb [arch=amd64 signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/debian bookworm stable\\" | tee /etc/apt/sources.list.d/docker.list > /dev/null"
    pct exec 301 -- bash -c "apt-get update && apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin"
    
    echo "=== Starting DevOps Tools ==="
    pct exec 301 -- bash -c "cd /opt/devops && docker compose up -d"
    
    echo "=== Re-Installing Openship ==="
    pct exec 301 -- bash -c "curl -fsSL https://get.openship.io | sh"
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
