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

    echo "=== 2. Creating LXC Container (ID: 302) ==="
    if pct status 302 >/dev/null 2>&1; then
      echo "Container 302 already exists! Stopping and Destroying it..."
      pct stop 302 2>/dev/null || true
      sleep 2
      pct destroy 302
    fi

    pct create 302 local:vztmpl/$FILENAME \\
      -arch amd64 \\
      -hostname local-dns \\
      -cores 1 \\
      -memory 512 \\
      -net0 name=eth0,bridge=vmbr0,ip=192.168.51.53/24,gw=192.168.51.1 \\
      -nameserver 8.8.8.8 \\
      -password '$&Admin2004' \\
      -storage $STORAGE \\
      -rootfs 4
      
    echo "Starting Container 302..."
    pct start 302
    echo "Waiting for container to boot up..."
    sleep 10
    
    echo "=== 3. Installing AdGuard Home ==="
    pct exec 302 -- bash -c "apt-get update && apt-get install -y curl wget tar"
    pct exec 302 -- bash -c "curl -s -S -L https://raw.githubusercontent.com/AdguardTeam/AdGuardHome/master/scripts/install.sh | sh -s -- -v"
    
    echo "=== Deployment Completed ==="
    echo "AdGuard Setup: http://192.168.51.53:3000"
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
