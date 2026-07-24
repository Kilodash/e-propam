const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  // Get the last exited container that is NOT coolify or its helpers
  const cmd = `pct exec 301 -- bash -c "container_id=\\$(docker ps -a --filter status=exited --format '{{.ID}}' | head -n 1); if [ -n \\"\\$container_id\\" ]; then docker logs --tail 50 \\$container_id; else echo 'No exited container found'; fi"`;
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
