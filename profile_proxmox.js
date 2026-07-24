const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const cmd = `
    echo "=== CPU & Load ==="
    uptime
    cat /proc/cpuinfo | grep 'model name' | uniq
    echo ""
    echo "=== Memory & Swap ==="
    free -h
    echo "Swappiness: $(cat /proc/sys/vm/swappiness)"
    echo ""
    echo "=== Storage & ZFS ==="
    zpool status 2>/dev/null || echo "No ZFS pools found"
    if [ -f /sys/module/zfs/parameters/zfs_arc_max ]; then
      echo "ZFS ARC Max: $(cat /sys/module/zfs/parameters/zfs_arc_max)"
    fi
    df -hT | grep -v 'tmpfs\|devtmpfs\|overlay'
    echo ""
    echo "=== CPU Governor ==="
    cat /sys/devices/system/cpu/cpu0/cpufreq/scaling_governor 2>/dev/null || echo "Not available"
    echo ""
    echo "=== APT Repositories ==="
    grep -r "^deb" /etc/apt/sources.list* | grep pve
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
