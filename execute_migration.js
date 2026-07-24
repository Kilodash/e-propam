const { Client } = require('ssh2');
const fs = require('fs');

const sql = fs.readFileSync('c:/Users/Lenovo/OneDrive/Dokumen/E-PAMINAL/supabase/migrations/015_add_missing_workflow_columns.sql', 'utf8');

const conn = new Client();
conn.on('ready', () => {
  const cmd = `pct exec 102 -- docker exec -i supabase-db psql -U supabase_admin -d postgres`;
  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code, signal) => {
      conn.end();
    }).on('data', (data) => {
      process.stdout.write(data);
    }).stderr.on('data', (data) => {
      process.stderr.write(data);
    });
    
    stream.write(sql);
    stream.end();
  });
}).on('error', (err) => {
  console.error('Connection error:', err);
}).connect({
  host: '192.168.51.100', port: 22, username: 'root', password: '$&Admin2004', readyTimeout: 10000
});
