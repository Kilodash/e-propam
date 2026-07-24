const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const cmd = `
    echo "=== 1. Checking Storage & Templates ==="
    pveam update
    
    # Get latest Debian 12 template
    TEMPLATE=$(pveam available -section system | grep 'debian-12' | awk '{print $2}' | head -n 1)
    echo "Selected Template: $TEMPLATE"
    
    # Check if template is already downloaded, if not download it
    FILENAME=\${TEMPLATE##*/}
    if [ ! -f "/var/lib/vz/template/cache/$FILENAME" ]; then
      echo "Downloading template $FILENAME to 'local' storage..."
      pveam download local $TEMPLATE
    else
      echo "Template $FILENAME already exists."
    fi

    # Find best storage for rootfs
    STORAGE=$(pvesm status | awk 'NR>1 {print $1}' | grep -E "local-lvm|local-zfs" | head -n 1)
    if [ -z "$STORAGE" ]; then STORAGE="local"; fi
    echo "Using storage: $STORAGE"

    echo "=== 2. Creating LXC Container (ID: 300) ==="
    if pct status 300 >/dev/null 2>&1; then
      echo "Container 300 already exists! Stopping and Destroying it for a clean setup..."
      pct stop 300 2>/dev/null || true
      sleep 2
      pct destroy 300
    fi

    pct create 300 local:vztmpl/$FILENAME \\
      -arch amd64 \\
      -hostname reverse-proxy \\
      -cores 1 \\
      -memory 1024 \\
      -net0 name=eth0,bridge=vmbr0,ip=192.168.51.40/24,gw=192.168.51.1 \\
      -password '$&Admin2004' \\
      -features nesting=1 \\
      -storage $STORAGE \\
      -rootfs 8
      
    echo "Starting Container 300..."
    pct start 300
    echo "Waiting for container to boot up..."
    sleep 10
    
    echo "=== 3. Installing Docker & NPM ==="
    echo "Installing Docker..."
    pct exec 300 -- bash -c "apt-get update && apt-get install -y curl && curl -fsSL https://get.docker.com | sh"
    
    echo "Creating docker-compose.yml for Nginx Proxy Manager..."
    pct exec 300 -- bash -c "mkdir -p /opt/npm && cat << 'EOF' > /opt/npm/docker-compose.yml
version: '3.8'
services:
  app:
    image: 'jc21/nginx-proxy-manager:latest'
    restart: unless-stopped
    ports:
      - '80:80'
      - '81:81'
      - '443:443'
    volumes:
      - ./data:/data
      - ./letsencrypt:/etc/letsencrypt
EOF
"

    echo "Starting Nginx Proxy Manager..."
    pct exec 300 -- bash -c "cd /opt/npm && docker compose up -d"
    
    echo "=== Deployment Completed ==="
    echo "NPM Web GUI: http://192.168.51.40:81"
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
