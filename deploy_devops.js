const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const cmd = `
    echo "=== 1. Checking Storage & Templates ==="
    TEMPLATE=$(pveam available -section system | grep 'debian-12' | awk '{print $2}' | head -n 1)
    FILENAME=\${TEMPLATE##*/}
    STORAGE=$(pvesm status | awk 'NR>1 {print $1}' | grep -E "local-lvm|local-zfs" | head -n 1)
    if [ -z "$STORAGE" ]; then STORAGE="local"; fi
    echo "Using template $FILENAME on storage $STORAGE"

    echo "=== 2. Creating LXC Container (ID: 301) ==="
    if pct status 301 >/dev/null 2>&1; then
      echo "Container 301 already exists! Stopping and Destroying it..."
      pct stop 301 2>/dev/null || true
      sleep 2
      pct destroy 301
    fi

    pct create 301 local:vztmpl/$FILENAME \\
      -arch amd64 \\
      -hostname devops-server \\
      -cores 2 \\
      -memory 2048 \\
      -net0 name=eth0,bridge=vmbr0,ip=192.168.51.50/24,gw=192.168.51.1 \\
      -password '$&Admin2004' \\
      -features nesting=1 \\
      -storage $STORAGE \\
      -rootfs 15
      
    echo "Starting Container 301..."
    pct start 301
    echo "Waiting for container to boot up..."
    sleep 10
    
    echo "=== 3. Installing Docker ==="
    pct exec 301 -- bash -c "apt-get update && apt-get install -y curl && curl -fsSL https://get.docker.com | sh"
    
    echo "=== 4. Deploying Portainer & Uptime Kuma ==="
    pct exec 301 -- bash -c "mkdir -p /opt/devops && cat << 'EOF' > /opt/devops/docker-compose.yml
version: '3.8'
services:
  portainer:
    image: portainer/portainer-ce:latest
    container_name: portainer
    restart: unless-stopped
    security_opt:
      - no-new-privileges:true
    volumes:
      - /etc/localtime:/etc/localtime:ro
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - ./portainer_data:/data
    ports:
      - '9000:9000'
      
  uptime-kuma:
    image: louislam/uptime-kuma:1
    container_name: uptime-kuma
    restart: unless-stopped
    volumes:
      - ./uptime_kuma_data:/app/data
    ports:
      - '3001:3001'
EOF
"

    echo "Starting DevOps Stack..."
    pct exec 301 -- bash -c "cd /opt/devops && docker compose up -d"
    
    echo "=== 5. Installing Openship ==="
    # Install Openship CLI inside the container
    pct exec 301 -- bash -c "curl -fsSL https://get.openship.io | sh || true"
    
    echo "=== Deployment Completed ==="
    echo "Portainer: http://192.168.51.50:9000"
    echo "Uptime Kuma: http://192.168.51.50:3001"
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
