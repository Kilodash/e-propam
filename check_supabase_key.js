const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
  const cmd = `pct exec 102 -- bash -c 'cat /opt/supabase/docker/.env | grep ANON_KEY' || pct exec 102 -- bash -c 'cat /root/supabase/docker/.env | grep ANON_KEY'`;
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
  host: '192.168.51.100', port: 22, username: 'root', password: '$&Admin2004', readyTimeout: 10000
});
