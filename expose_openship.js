const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const cmd = `
    echo "=== Exposing Openship to external network ==="
    pct exec 301 -- apt-get install -y socat
    pct exec 301 -- bash -c "killall socat 2>/dev/null || true"
    pct exec 301 -- bash -c "nohup socat TCP-LISTEN:80,fork,bind=0.0.0.0 TCP:127.0.0.1:35871 >/dev/null 2>&1 &"
    echo "Openship is now exposed on port 80!"
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
