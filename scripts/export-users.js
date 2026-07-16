// Quick script to export users + passwords to xlsx
const { createClient } = require('@supabase/supabase-js')
const ExcelJS = require('exceljs')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function main() {
  const { data: profiles, error: pErr } = await supabase
    .from('profiles')
    .select('id, email, role, unit_name')
    .order('role')
    .order('unit_name')
  if (pErr) throw pErr

  const { data: seeds, error: sErr } = await supabase
    .from('seed_passwords')
    .select('user_id, password')
    .then(r => r)
    .catch(e => ({ data: [], error: null }))
  if (sErr) console.warn('seed_passwords error:', sErr.message)

  const passwordMap = new Map()
  for (const s of seeds || []) passwordMap.set(s.user_id, s.password)

  const wb = new ExcelJS.Workbook()
  wb.creator = 'E-PROPAM'
  wb.created = new Date()

  const sheet = wb.addWorksheet('Users')
  sheet.columns = [
    { header: 'Email', key: 'email', width: 40 },
    { header: 'Password', key: 'password', width: 24 },
    { header: 'Role', key: 'role', width: 14 },
    { header: 'Unit', key: 'unit_name', width: 50 },
  ]
  sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }
  sheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF0F172A' },
  }

  for (const p of profiles || []) {
    sheet.addRow({
      email: p.email || '',
      password: passwordMap.get(p.id) || '(tidak tersedia)',
      role: p.role || '',
      unit_name: p.unit_name || '',
    })
  }

  sheet.eachRow((row) => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        right: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      }
    })
  })

  const filename = `e-propam-users-${new Date().toISOString().split('T')[0]}-with-passwords.xlsx`
  await wb.xlsx.writeFile(filename)
  console.log(`Exported ${profiles?.length || 0} users to ${filename}`)
  console.log(`With passwords: ${passwordMap.size}`)
}

main().catch(e => { console.error(e); process.exit(1) })
