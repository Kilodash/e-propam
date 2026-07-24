const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const cmd = `
    echo "=== Cleaning up ports and restarting Openship ==="
    pct exec 301 -- bash -c "kill -9 \\$(pgrep socat) 2>/dev/null || true"
    pct exec 301 -- bash -c "export PATH=/root/.bun/bin:$PATH; openship stop"
    sleep 2
    
    pct exec 301 -- bash -c "export PATH=/root/.bun/bin:$PATH; openship up --public-url http://192.168.51.55 --dashboard-port 80"
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
