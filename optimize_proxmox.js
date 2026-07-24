const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const cmd = `
    echo "=== 1. Optimizing Swappiness ==="
    # Remove existing swappiness config if any
    sed -i '/^vm.swappiness/d' /etc/sysctl.conf
    # Add new swappiness config
    echo "vm.swappiness=10" >> /etc/sysctl.conf
    # Apply
    sysctl -p
    
    echo ""
    echo "=== 2. Disabling Enterprise Repo ==="
    if [ -f /etc/apt/sources.list.d/pve-enterprise.list ]; then
      sed -i 's/^deb/#deb/g' /etc/apt/sources.list.d/pve-enterprise.list
      echo "Enterprise repo disabled."
    else
      echo "Enterprise repo file not found, skipping."
    fi

    echo ""
    echo "=== 3. Clearing Swap (This might take a minute) ==="
    swapoff -a && swapon -a
    echo "Swap cleared."
    
    echo ""
    echo "=== 4. Verification ==="
    echo "Current swappiness:"
    cat /proc/sys/vm/swappiness
    echo ""
    echo "Memory & Swap status:"
    free -h
    echo ""
    echo "Running apt update (checking for errors):"
    apt-get update
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
