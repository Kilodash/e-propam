const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const cmd = `
    echo "=== Starting Openship ==="
    pct exec 301 -- bash -c "export PATH=\\"/root/.bun/bin:$PATH\\" && nohup openship up > /var/log/openship.log 2>&1 &"
    echo "Openship started in the background!"
    sleep 5
    echo "Checking Openship logs:"
    pct exec 301 -- cat /var/log/openship.log | head -n 15
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
