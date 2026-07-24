const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
  const cmd = `pct exec 102 -- docker exec -i supabase-db psql -U postgres -d postgres -c "SELECT id, gajamada_name, satker_level, normalized_name FROM unit_mapping WHERE satker_level IS NULL OR normalized_name IS NULL LIMIT 20;"`;
  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('close', () => conn.end()).on('data', d => process.stdout.write(d)).stderr.on('data', d => process.stderr.write(d));
  });
}).on('error', err => console.error(err)).connect({
  host: '192.168.51.100', port: 22, username: 'root', password: '$&Admin2004', readyTimeout: 10000
});
