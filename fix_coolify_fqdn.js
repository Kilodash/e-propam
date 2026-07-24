const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('Fixing Coolify FQDN...');
  
  // 1. Update .env
  // 2. Restart coolify
  const cmd = `
pct exec 301 -- bash -c "
  if [ -f /data/coolify/source/.env ]; then
    sed -i 's|^APP_URL=.*|APP_URL=http://192.168.51.55:8000|g' /data/coolify/source/.env
    sed -i 's|^APP_ID=.*|APP_ID=http://192.168.51.55:8000|g' /data/coolify/source/.env
    echo 'FQDN updated in .env'
    docker restart coolify
    echo 'Coolify restarted.'
  else
    echo 'File .env not found'
  fi
"
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
