const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('Cleaning up Docker disk space and increasing storage...');
  
  // 1. Check disk space before
  // 2. Prune docker
  // 3. Increase rootfs by 10G
  // 4. Check disk space after
  const cmd = `
    echo "=== DISK BEFORE ==="
    pct exec 301 -- df -h /
    echo "=== CLEANING UP DOCKER ==="
    pct exec 301 -- docker system prune -af --volumes
    pct exec 301 -- docker builder prune -af
    echo "=== RESIZING LXC DISK (+10G) ==="
    pct resize 301 rootfs +10G || echo "Failed to resize or already large enough"
    echo "=== DISK AFTER ==="
    pct exec 301 -- df -h /
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
