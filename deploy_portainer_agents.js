const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const cmd = `
    echo "=== Installing Portainer Agent on CT 102 (Supabase) ==="
    pct exec 102 -- bash -c "docker rm -f portainer_agent 2>/dev/null || true"
    pct exec 102 -- bash -c "docker run -d -p 9001:9001 --name portainer_agent --restart=always -v /var/run/docker.sock:/var/run/docker.sock -v /var/lib/docker/volumes:/var/lib/docker/volumes portainer/agent:latest"
    
    echo "=== Installing Portainer Agent on CT 300 (Reverse Proxy) ==="
    pct exec 300 -- bash -c "docker rm -f portainer_agent 2>/dev/null || true"
    pct exec 300 -- bash -c "docker run -d -p 9001:9001 --name portainer_agent --restart=always -v /var/run/docker.sock:/var/run/docker.sock -v /var/lib/docker/volumes:/var/lib/docker/volumes portainer/agent:latest"
    
    echo "Agents installed successfully!"
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
