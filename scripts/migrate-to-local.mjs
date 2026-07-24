/**
 * E-PROPAM: Migrasi data Supabase Cloud → Self-hosted (v2 — fixed)
 * node scripts/migrate-to-local.mjs
 */

import { createClient } from '@supabase/supabase-js'

const CLOUD = {
  url: 'https://vbxfdxtljxqqfowmubpg.supabase.co',
  serviceRoleKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZieGZkeHRsanhxcWZvd211YnBnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzkxNDgwMCwiZXhwIjoyMDk5NDkwODAwfQ.eVIebcLUcwufH42F2kk2ayUB7uMNfcJWlRXV2BKTUVU',
}

const LOCAL = {
  url: 'http://192.168.51.30:8000',
  serviceRoleKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q',
}

// Urutan: parent dulu, anak kemudian
// pk: primary key column untuk delete, skipCols: kolom yang tidak ada di lokal
const TABLES = [
  { name: 'unit_mapping',       pk: 'id',  skipCols: ['description'] },
  { name: 'app_settings',       pk: 'key', skipCols: [] },
  { name: 'pengaduan',          pk: 'id',  skipCols: ['disposisi_submitted_at'] },
  { name: 'timeline',           pk: 'id',  skipCols: [] },
  { name: 'card_layout_config', pk: 'id',  skipCols: [] },
  { name: 'aksi_yanduan',       pk: 'id',  skipCols: [] },
  { name: 'tindaklanjut_unit',  pk: 'id',  skipCols: [] },
  { name: 'attachments',        pk: 'id',  skipCols: [] },
  { name: 'dokumen_perkara',    pk: 'id',  skipCols: [] },
  { name: 'pelanggar_paminal',  pk: 'id',  skipCols: [] },
  { name: 'sync_log',           pk: 'id',  skipCols: [] },
]

const cloud = createClient(CLOUD.url, CLOUD.serviceRoleKey, { auth: { persistSession: false } })
const local = createClient(LOCAL.url, LOCAL.serviceRoleKey, { auth: { persistSession: false } })

function stripCols(rows, skipCols) {
  if (!skipCols.length) return rows
  return rows.map(row => {
    const r = { ...row }
    for (const col of skipCols) delete r[col]
    return r
  })
}

// Sanitize nilai kolom agar sesuai constraint lokal
const SANITIZE_RULES = {
  unit_mapping: {
    satker_level: (v) => ['subbid', 'subbag', 'polres', 'wassidik'].includes(v) ? v : null,
  },
}

function sanitizeRows(tableName, rows) {
  const rules = SANITIZE_RULES[tableName]
  if (!rules) return rows
  return rows.map(row => {
    const r = { ...row }
    for (const [col, fn] of Object.entries(rules)) {
      if (col in r) r[col] = fn(r[col])
    }
    return r
  })
}

async function fetchAll(table) {
  let all = []
  let from = 0
  const PAGE = 500
  while (true) {
    const { data, error } = await cloud.from(table).select('*').range(from, from + PAGE - 1)
    if (error) {
      if (error.code === '42P01' || error.message?.includes('schema cache')) {
        console.log(`  ⚠️  Tabel '${table}' tidak ada di cloud, skip.`)
        return null
      }
      throw new Error(error.message)
    }
    if (!data?.length) break
    all = all.concat(data)
    if (data.length < PAGE) break
    from += PAGE
  }
  return all
}

async function clearLocal(table, pk) {
  // Hapus semua data dengan filter yang selalu true
  const { error } = await local.from(table).delete().not(pk, 'is', null)
  if (error && !error.message?.includes('does not exist') && error.code !== '42P01') {
    console.log(`  ⚠️  Clear lokal: ${error.message}`)
  }
}

async function upsertLocal(table, rows, pk) {
  const BATCH = 100
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH)
    const { error } = await local.from(table).upsert(batch, { onConflict: pk })
    if (error) throw new Error(error.message)
    process.stdout.write(`  Lokal: ${Math.min(i + BATCH, rows.length)}/${rows.length}\r`)
  }
}

// Extract nama kolom bermasalah dari pesan error
function extractBadCol(msg) {
  const m = msg.match(/column[s]? "(.+?)" (?:does not exist|of '.+?' in the schema cache|of '.+?' does not exist)/)
  if (m) return m[1]
  const m2 = msg.match(/Could not find the '(.+?)' column/)
  if (m2) return m2[1]
  return null
}

async function migrateTable({ name, pk, skipCols }) {
  console.log(`\n📦 ${name}`)

  const rows = await fetchAll(name)
  if (rows === null) return
  if (rows.length === 0) { console.log('  ✅ Kosong.'); return }

  console.log(`  Cloud: ${rows.length} rows`)

  // Kumpulkan kolom yang perlu di-skip (dari skipCols + auto-detect)
  const autoSkip = new Set(skipCols)
  let cleaned = sanitizeRows(name, stripCols(rows, [...autoSkip]))

  await clearLocal(name, pk)

  // Retry loop — otomatis strip kolom bermasalah sampai berhasil
  let attempts = 0
  while (attempts < 15) {
    try {
      await upsertLocal(name, cleaned, pk)
      const skipped = [...autoSkip]
      console.log(`  ✅ ${rows.length} rows OK.${skipped.length ? ` (skip: ${skipped.join(', ')})` : ''}`)
      return
    } catch (err) {
      const badCol = extractBadCol(err.message)
      if (badCol && !autoSkip.has(badCol)) {
        autoSkip.add(badCol)
        console.log(`  ⚠️  Kolom '${badCol}' tidak ada di lokal, auto-skip...`)
        cleaned = sanitizeRows(name, stripCols(rows, [...autoSkip]))
        attempts++
      } else {
        throw err
      }
    }
  }
  throw new Error('Terlalu banyak kolom bermasalah, berhenti.')
}

async function main() {
  console.log('==============================================')
  console.log(' E-PROPAM Migrasi v2: Cloud → Self-hosted')
  console.log('==============================================')

  // Cek koneksi
  const { error: ce } = await cloud.from('pengaduan').select('id').limit(1)
  if (ce && ce.code !== 'PGRST116') { console.error('❌ Cloud:', ce.message); process.exit(1) }
  console.log('✅ Cloud OK')

  const { error: le } = await local.from('pengaduan').select('id').limit(1)
  if (le && le.code !== 'PGRST116' && le.code !== '42P01' && !le.message?.includes('schema cache')) {
    console.error('❌ Lokal:', le.message); process.exit(1)
  }
  console.log('✅ Lokal OK')
  console.log('')

  for (const t of TABLES) {
    try {
      await migrateTable(t)
    } catch (err) {
      console.error(`  ❌ Gagal: ${err.message}`)
    }
  }

  console.log('\n==============================================')
  console.log(' Migrasi data selesai!')
  console.log('')
  console.log(' ⚠️  Auth users (login accounts) belum dimigrasi.')
  console.log('    Jalankan di CT 102:')
  console.log('    pct exec 102 -- docker exec supabase-db pg_dump \\')
  console.log('      -U supabase_admin -d postgres --schema auth --data-only \\')
  console.log('      -t auth.users -t auth.identities > /tmp/auth_dump.sql')
  console.log('==============================================')
}

main().catch(console.error)
