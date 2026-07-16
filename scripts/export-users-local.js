// Generate xlsx from local seed data (no Supabase needed)
const ExcelJS = require('exceljs')

const ACCOUNTS = [
  // Global roles
  ['admin@ep.id', 'admin', null],
  ['yanduan@ep.id', 'yanduan', null],
  ['kabid@ep.id', 'kabid', 'KABID PROPAM POLDA JAWA BARAT'],
  ['kasubbag_yanduan@ep.id', 'yanduan', 'KASUBBAG YANDUAN POLDA JAWA BARAT'],
  ['operator_yanduan@ep.id', 'yanduan', 'OPERATOR YANDUAN POLDA JAWA BARAT'],
  ['kasubbag_rehabpers@ep.id', 'rehabpers', 'KASUBBAG REHABPERS POLDA JAWA BARAT'],
  // Paminal
  ['kasubbid_paminal@ep.id', 'paminal', 'KASUBBID PAMINAL POLDA JAWA BARAT'],
  ['kaur_binpam_paminal@ep.id', 'paminal', 'KAUR BINPAM SUBBID PAMINAL POLDA JAWA BARAT'],
  ['ur_binpam_paminal@ep.id', 'paminal', 'UR BINPAM SUBBID PAMINAL POLDA JAWA BARAT'],
  ['ur_binpam_paminal_typo@ep.id', 'paminal', 'UR BINPAM SUBBID PAMINAL JAWA BARAT'],
  ['unit1_paminal@ep.id', 'paminal', 'UNIT 1 SUBBID PAMINAL POLDA JAWA BARAT'],
  ['unit2_paminal@ep.id', 'paminal', 'UNIT 2 SUBBID PAMINAL POLDA JAWA BARAT'],
  ['unit3_paminal@ep.id', 'paminal', 'UNIT 3 SUBBID PAMINAL POLDA JAWA BARAT'],
  ['ur_prodok_paminal@ep.id', 'paminal', 'UR PRODOK SUBBID PAMINAL POLDA JAWA BARAT'],
  ['ur_litpers_paminal@ep.id', 'paminal', 'UR LITPERS SUBBID PAMINAL POLDA JAWA BARAT'],
  // Provos
  ['kasubbid_provos@ep.id', 'provos', 'KASUBBID PROVOS POLDA JAWA BARAT'],
  ['unit1_provos@ep.id', 'provos', 'UNIT 1 SUBBID PROVOS POLDA JAWA BARAT'],
  ['unit2_provos@ep.id', 'provos', 'UNIT 2 SUBBID PROVOS POLDA JAWA BARAT'],
  ['unit3_provos@ep.id', 'provos', 'UNIT 3 SUBBID PROVOS POLDA JAWA BARAT'],
  // Wabprof
  ['kasubbid_wabprof@ep.id', 'wabprof', 'KASUBBID WABPROF POLDA JAWA BARAT'],
  ['unit1_wabprof@ep.id', 'wabprof', 'UNIT 1 SUBBID WABPROF POLDA JAWA BARAT'],
  ['unit2_wabprof@ep.id', 'wabprof', 'UNIT 2 SUBBID WABPROF POLDA JAWA BARAT'],
  ['unit3_wabprof@ep.id', 'wabprof', 'UNIT 3 SUBBID WABPROF POLDA JAWA BARAT'],
  // Brimob, Ditpolair, Wassidik
  ['kasiprovos_satbrimob@ep.id', 'provos', 'KASIPROVOS SATBRIMOB POLDA JAWA BARAT'],
  ['kanit_paminal_ditpolair@ep.id', 'paminal', 'KANIT PAMINAL DITPOLAIR POLDA JAWA BARAT'],
  ['wassidik_ditreskrimum@ep.id', 'wassidik', 'WASSIDIK DITRESKRIMUM POLDA JAWA BARAT'],
  ['bag_wassidik@ep.id', 'wassidik', 'BAG WASSIDIK POLDA JAWA BARAT'],
  // POLRES
  ['polrestabes_bandung@ep.id', 'polres', 'Polrestabes Bandung'],
  ['kanit_paminal_polrestabes_bandung@ep.id', 'polres', 'Polrestabes Bandung'],
  ['polresta_bandung@ep.id', 'polres', 'Polresta Bandung'],
  ['polresta_bogor_kota@ep.id', 'polres', 'Polresta Bogor Kota'],
  ['polresta_cirebon@ep.id', 'polres', 'Polresta Cirebon'],
  ['polresta_karawang@ep.id', 'polres', 'Polresta Karawang'],
  ['polresta_sukabumi@ep.id', 'polres', 'Polresta Sukabumi'],
  ['polres_cimahi@ep.id', 'polres', 'Polres Cimahi'],
  ['polres_banjar@ep.id', 'polres', 'Polres Banjar'],
  ['kanit_paminal_banjar_kota@ep.id', 'polres', 'Polres Banjar'],
  ['polres_bogor@ep.id', 'polres', 'Polres Bogor'],
  ['kaur_yanduan_bogor@ep.id', 'polres', 'Polres Bogor'],
  ['polres_cianjur@ep.id', 'polres', 'Polres Cianjur'],
  ['polres_ciamis@ep.id', 'polres', 'Polres Ciamis'],
  ['polres_cirebon_kota@ep.id', 'polres', 'Polres Cirebon Kota'],
  ['polres_garut@ep.id', 'polres', 'Polres Garut'],
  ['polres_indramayu@ep.id', 'polres', 'Polres Indramayu'],
  ['polres_kuningan@ep.id', 'polres', 'Polres Kuningan'],
  ['polres_majalengka@ep.id', 'polres', 'Polres Majalengka'],
  ['polres_pangandaran@ep.id', 'polres', 'Polres Pangandaran'],
  ['polres_purwakarta@ep.id', 'polres', 'Polres Purwakarta'],
  ['polres_subang@ep.id', 'polres', 'Polres Subang'],
  ['polres_sukabumi@ep.id', 'polres', 'Polres Sukabumi'],
  ['polres_sukabumi_kota@ep.id', 'polres', 'Polres Sukabumi Kota'],
  ['polres_sumedang@ep.id', 'polres', 'Polres Sumedang'],
  ['polres_tasikmalaya@ep.id', 'polres', 'Polres Tasikmalaya'],
  ['polres_tasikmalaya_kota@ep.id', 'polres', 'Polres Tasikmalaya Kota'],
]

// Password default sama untuk semua user
const DEFAULT_PASSWORD = 'ePropamJabar!'

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

ACCOUNTS.forEach(([email, role, unit]) => {
  sheet.addRow({
    email,
    password: DEFAULT_PASSWORD,
    role,
    unit_name: unit || '',
  })
})

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

const filename = `e-propam-users-${new Date().toISOString().replace(/[:T.]/g,'-').substring(0,19)}-with-passwords.xlsx`
wb.xlsx.writeFile(filename).then(() => {
  console.log(`Exported ${ACCOUNTS.length} users to ${filename}`)
})
