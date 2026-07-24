const { Client } = require('ssh2');
const conn = new Client();
const sql = `
ALTER TABLE public.unit_mapping DROP CONSTRAINT IF EXISTS unit_mapping_satker_level_check;
ALTER TABLE public.unit_mapping ADD CONSTRAINT unit_mapping_satker_level_check 
  CHECK (satker_level IN ('kabid','subbid','subbag','tabes','polres','brimob','ditpolair','wassidik'));

UPDATE public.unit_mapping SET satker_level = 'tabes' WHERE id IN (1174, 1175, 1176, 1173, 1235);
UPDATE public.unit_mapping SET satker_level = 'brimob' WHERE id IN (1236, 1237, 1238);
UPDATE public.unit_mapping SET satker_level = 'ditpolair' WHERE id IN (1239, 1259);
UPDATE public.unit_mapping SET satker_level = 'kabid' WHERE id = 1155;
`;
conn.on('ready', () => {
  const cmd = `pct exec 102 -- docker exec -i supabase-db psql -U supabase_admin -d postgres`;
  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('close', () => conn.end()).on('data', d => process.stdout.write(d)).stderr.on('data', d => process.stderr.write(d));
    stream.write(sql);
    stream.end();
  });
}).on('error', err => console.error(err)).connect({
  host: '192.168.51.100', port: 22, username: 'root', password: '$&Admin2004', readyTimeout: 10000
});
