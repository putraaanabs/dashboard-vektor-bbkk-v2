const express = require('express');
const service = require('../services/dashboardService');

const router = express.Router();
const WILKERS = ['JUANDA', 'PERAK', 'GRESIK', 'TUBAN', 'KALIANGET'];
const AREAS = ['PERIMETER', 'BUFFER'];
const YES_NO = ['ADA', 'TIDAK ADA'];

function field(name, label, type = 'text', options = null, extra = {}) {
  return { name, label, type, options, required: true, ...extra };
}
function date(name, label) { return field(name, label, 'date'); }
function time(name, label) { return field(name, label, 'time'); }
function number(name, label, precision = 0, required = true) {
  return field(name, label, 'number', null, {
    required, precision,
    step: precision ? `0.${'0'.repeat(Math.max(0, precision - 1))}1` : '1'
  });
}
function wilker(name = 'wilker') { return field(name, 'Wilayah kerja', 'select', WILKERS); }

const forms = {
  lalat: { key: 'lalat', title: 'Survei lalat', table: 'survey_lalat', fields: [
    date('tanggal', 'Tanggal'), wilker(), field('lokasi', 'Lokasi'),
    number('kepadatan_ekor', 'Kepadatan (ekor)', 1), number('suhu', 'Suhu (°C)', 1),
    number('kelembapan', 'Kelembapan (%)', 1), number('kecepatan_angin', 'Kecepatan angin (m/s)', 1),
    number('pencahayaan', 'Pencahayaan (lux)')
  ] },
  kecoa: { key: 'kecoa', title: 'Survei kecoa', table: 'survey_kecoa', fields: [
    date('TANGGAL', 'Tanggal'), wilker('WILKER'), field('LOKASI_PENGAMATAN', 'Lokasi'),
    number('JUMLAH_PERANGKAP', 'Jumlah perangkap'), number('JUMLAH_TERTANGKAP', 'Jumlah tertangkap'),
    number('P_AMERICANA', 'P. americana'), number('P_BRANCA', 'P. branca'),
    number('B_GERMANICA', 'B. germanica'), number('B_ORIENTALIS', 'B. orientalis'),
    number('ANOTHER_SPECIES', 'Spesies lain')
  ] },
  tikus: { key: 'tikus', title: 'Pengawasan tikus', table: 'pengawasan_tikus', fields: [
    date('tanggal', 'Tanggal'), wilker(), field('lokasi_pemasangan_trap', 'Lokasi pemasangan'),
    number('jumlah_pemasangan_trap', 'Jumlah perangkap'), number('jumlah_trap_terdapat_tikus', 'Perangkap positif'),
    field('jenis_tikus', 'Jenis tikus', 'select', [{ value: '0', label: 'Tidak ada tikus' }, 'Rattus tanezumi', 'Rattus norvegicus', 'Lainnya']),
    number('jumlah_tikus', 'Tikus tertangkap'),
    number('jumlah_pinjal_umum', 'Jumlah pinjal umum', 0, false),
    number('ip', 'IP umum (sesuai lembar survei)', 2, false),
    number('jumlah_x_cheopis', 'Jumlah X. cheopis', 0, false),
    number('ip_khusus', 'IP khusus (sesuai lembar survei)', 2, false)
  ] },
  lingkungan: { key: 'lingkungan', title: 'Kondisi lingkungan tikus', table: 'kondisi_tikus', fields: [
    date('tanggal', 'Tanggal'), wilker(), field('lokasi', 'Lokasi'),
    field('kotoran', 'Kotoran', 'select', YES_NO), field('bau_air_seni', 'Bau air seni', 'select', ['ADA', 'TIDAK BERBAU']),
    field('bekas_gigitan', 'Bekas gigitan', 'select', YES_NO), field('genangan_air', 'Genangan air', 'select', YES_NO),
    field('keberadaan_sampah', 'Keberadaan sampah', 'select', YES_NO),
    field('kondisi_tps', 'Kondisi TPS', 'select', ['BAIK', 'BURUK']),
    field('kondisi_selokan', 'Kondisi selokan', 'select', ['BAIK', 'BURUK']),
    field('riwayat_banjir', 'Riwayat banjir', 'select', YES_NO)
  ] },
  malaria: { key: 'malaria', title: 'Survei malaria', table: 'uod_uol', fields: [
    date('tanggal', 'Tanggal'), wilker(), field('lokasi', 'Lokasi'), time('jam_mulai', 'Jam mulai'), time('jam_selesai', 'Jam selesai'),
    number('jumlah_uod', 'Jumlah UOD'), number('jumlah_uol', 'Jumlah UOL'), number('temperatur', 'Suhu (°C)', 1),
    number('kelembapan', 'Kelembapan (%)', 1), number('kecepatan_angin', 'Kecepatan angin (m/s)', 1),
    number('umpan_orang', 'Umpan orang'), number('mbr_anopheles_subpictus', 'MBR An. subpictus'),
    number('mbr_anopheles_sundaicus', 'MBR An. sundaicus'), number('mbr_anopheles_other', 'MBR Anopheles lainnya'),
    number('mhd_anopheles_subpictus', 'MHD An. subpictus'), number('mhd_anopheles_sundaicus', 'MHD An. sundaicus'),
    number('mhd_anopheles_other', 'MHD Anopheles lainnya')
  ] },
  dbd: { key: 'dbd', title: 'Pengamatan jentik DBD', table: 'pengamatan_dbd', period: true, fields: [
    field('periode', 'Periode', 'period'), wilker('WILKER'), field('AREA', 'Area', 'select', AREAS), field('LOKASI', 'Lokasi'),
    number('RUMAH_DIPERIKSA', 'Rumah diperiksa'), number('RUMAH_POSITIF', 'Rumah positif'),
    number('KONTAINER_DIPERIKSA', 'Kontainer diperiksa'), number('KONTAINER_POSITIF', 'Kontainer positif')
  ] },
  fogging: { key: 'fogging', title: 'Pengendalian DBD', table: 'pengendalian_dbd', period: true, fields: [
    field('periode', 'Periode', 'period'), wilker('WILKER'), field('AREA', 'Area', 'select', AREAS), field('LOKASI', 'Lokasi'),
    number('LUAS_M2', 'Luas (m²)', 2), number('JUMLAH_RUMAH', 'Jumlah rumah'), field('MERK_DAGANG', 'Merek dagang'),
    number('JUMLAH_L', 'Jumlah insektisida (liter)', 2), number('CAMPURAN_SOLAR', 'Campuran solar')
  ] }
};

const listingColumns = {
  tikus: ['tanggal', 'wilker', 'lokasi_pemasangan_trap', 'jumlah_pemasangan_trap', 'jumlah_trap_terdapat_tikus', 'jenis_tikus', 'jumlah_tikus', 'jumlah_pinjal_umum', 'ip', 'jumlah_x_cheopis', 'ip_khusus'],
  lingkungan: ['tanggal', 'wilker', 'lokasi', 'kotoran', 'bau_air_seni', 'bekas_gigitan', 'genangan_air', 'keberadaan_sampah', 'kondisi_tps', 'kondisi_selokan', 'riwayat_banjir'],
  lalat: ['tanggal', 'wilker', 'lokasi', 'kepadatan_ekor', 'suhu', 'kelembapan', 'kecepatan_angin', 'pencahayaan'],
  kecoa: ['TANGGAL', 'WILKER', 'LOKASI_PENGAMATAN', 'JUMLAH_PERANGKAP', 'JUMLAH_TERTANGKAP', 'P_AMERICANA', 'P_BRANCA', 'B_GERMANICA', 'B_ORIENTALIS', 'ANOTHER_SPECIES'],
  malaria: ['tanggal', 'jam_mulai', 'jam_selesai', 'wilker', 'lokasi', 'jumlah_uod', 'jumlah_uol', 'temperatur', 'kelembapan', 'kecepatan_angin', 'umpan_orang', 'mbr_anopheles_subpictus', 'mbr_anopheles_sundaicus', 'mbr_anopheles_other', 'mhd_anopheles_subpictus', 'mhd_anopheles_sundaicus', 'mhd_anopheles_other'],
  dbd: ['BULAN', 'TAHUN', 'WILKER', 'AREA', 'LOKASI', 'RUMAH_DIPERIKSA', 'RUMAH_POSITIF', 'KONTAINER_DIPERIKSA', 'KONTAINER_POSITIF'],
  fogging: ['TANGGAL', 'TAHUN', 'WILKER', 'AREA', 'LOKASI', 'LUAS_M2', 'JUMLAH_RUMAH', 'MERK_DAGANG', 'JUMLAH_L', 'CAMPURAN_SOLAR']
};
const columnLabels = {
  tanggal: 'Tanggal', TANGGAL: 'Bulan/tanggal', BULAN: 'Bulan', TAHUN: 'Tahun',
  wilker: 'Wilker', WILKER: 'Wilker', lokasi: 'Lokasi', LOKASI: 'Lokasi', LOKASI_PENGAMATAN: 'Lokasi',
  lokasi_pemasangan_trap: 'Lokasi pemasangan', jumlah_pemasangan_trap: 'Perangkap dipasang',
  jumlah_trap_terdapat_tikus: 'Perangkap positif', jenis_tikus: 'Jenis tikus', jumlah_tikus: 'Tikus tertangkap',
  jumlah_pinjal_umum: 'Pinjal umum', ip: 'IP umum', jumlah_x_cheopis: 'X. cheopis', ip_khusus: 'IP khusus',
  jumlah_uod: 'UOD', jumlah_uol: 'UOL', jam_mulai: 'Jam mulai', jam_selesai: 'Jam selesai',
  RUMAH_DIPERIKSA: 'Rumah diperiksa', RUMAH_POSITIF: 'Rumah positif', KONTAINER_DIPERIKSA: 'Kontainer diperiksa',
  KONTAINER_POSITIF: 'Kontainer positif', JUMLAH_PERANGKAP: 'Perangkap dipasang', JUMLAH_TERTANGKAP: 'Tertangkap',
  P_AMERICANA: 'P. americana', P_BRANCA: 'P. branca', B_GERMANICA: 'B. germanica', B_ORIENTALIS: 'B. orientalis',
  ANOTHER_SPECIES: 'Spesies lain', LUAS_M2: 'Luas (m²)', JUMLAH_RUMAH: 'Rumah', MERK_DAGANG: 'Merek dagang',
  JUMLAH_L: 'Liter', CAMPURAN_SOLAR: 'Campuran solar'
};

function field(name, label, type = 'text', options = null, extra = {}) {
  return { name, label, type, options, required: true, ...extra };
}
function date(name, label) { return field(name, label, 'date'); }
function time(name, label) { return field(name, label, 'time'); }
function number(name, label, precision = 0, required = true) {
  return field(name, label, 'number', null, { required, precision, step: precision ? `0.${'0'.repeat(Math.max(0, precision - 1))}1` : '1' });
}
function wilker(name = 'wilker') { return field(name, 'Wilayah kerja', 'select', WILKERS); }

function validateDate(value, label) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw Error(`${label} tidak valid.`);
  const [year, month, day] = value.split('-').map(Number);
  if (year < 1000) throw Error(`${label} tidak valid untuk tanggal MySQL.`);
  const dateValue = new Date(Date.UTC(year, month - 1, day));
  if (dateValue.toISOString().slice(0, 10) !== value) throw Error(`${label} tidak valid.`);
}

function validateFields(form, body) {
  const fields = form.fields.filter(item => item.type !== 'period');
  const columns = fields.map(item => item.name);
  const values = fields.map(item => {
    let value = body[item.name];
    if (Array.isArray(value) || (value != null && typeof value !== 'string')) throw Error(`Nilai ${item.label} tidak valid.`);
    value = value == null ? '' : value.trim();
    if (!value) {
      if (item.required) throw Error(`Lengkapi kolom ${item.label}.`);
      return null;
    }
    if (item.type === 'number') {
      const pattern = item.precision ? /^\d+(?:\.\d+)?$/ : /^\d+$/;
      if (!pattern.test(value)) throw Error(item.precision ? `${item.label} harus angka dengan maksimal ${item.precision} angka desimal.` : `${item.label} harus bilangan bulat.`);
      const decimals = value.includes('.') ? value.split('.')[1].length : 0;
      if (decimals > item.precision) throw Error(`${item.label} menerima maksimal ${item.precision} angka desimal.`);
      const numeric = Number(value);
      if (!Number.isFinite(numeric) || numeric < 0) throw Error(`${item.label} harus nol atau lebih.`);
      return value;
    }
    if (item.type === 'date') validateDate(value, item.label);
    if (item.type === 'time' && !/^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/.test(value)) throw Error(`${item.label} tidak valid.`);
    if (item.type === 'select' && !item.options.some(option => (typeof option === 'string' ? option : option.value) === value)) throw Error(`Pilih nilai ${item.label} dari daftar.`);
    return value;
  });
  return { columns, values, record: Object.fromEntries(columns.map((column, index) => [column, values[index]])) };
}

function monthValues(period) {
  const match = /^(20\d{2})-(0[1-9]|1[0-2])$/.exec(String(period || ''));
  if (!match) throw Error('Pilih periode bulan dan tahun yang valid.');
  const months = ['JANUARI', 'FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI', 'JULI', 'AGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DESEMBER'];
  return { year: Number(match[1]), monthName: months[Number(match[2]) - 1] };
}

function prepareSubmission(form, body) {
  const { columns: fieldColumns, values: fieldValues, record } = validateFields(form, body);
  let columns = fieldColumns;
  let values = fieldValues;
  if (form.key === 'kecoa') {
    const speciesTotal = ['P_AMERICANA', 'P_BRANCA', 'B_GERMANICA', 'B_ORIENTALIS', 'ANOTHER_SPECIES']
      .reduce((total, key) => total + Number(record[key] || 0), 0);
    if (speciesTotal > Number(record.JUMLAH_TERTANGKAP)) throw Error('Total per spesies tidak boleh melebihi jumlah tertangkap.');
    const dateIndex = columns.indexOf('TANGGAL');
    const [year, month, day] = values[dateIndex].split('-');
    values[dateIndex] = `${day}/${month}/${year}`;
  }
  if (form.key === 'tikus' && Number(record.jumlah_trap_terdapat_tikus) > Number(record.jumlah_pemasangan_trap)) {
    throw Error('Perangkap positif tidak boleh melebihi jumlah perangkap yang dipasang.');
  }
  if (form.key === 'dbd' && (Number(record.RUMAH_POSITIF) > Number(record.RUMAH_DIPERIKSA) || Number(record.KONTAINER_POSITIF) > Number(record.KONTAINER_DIPERIKSA))) {
    throw Error('Jumlah positif tidak boleh melebihi jumlah yang diperiksa.');
  }
  if (form.key === 'malaria' && record.jam_mulai === record.jam_selesai) throw Error('Jam mulai dan jam selesai tidak boleh sama.');
  if (form.period) {
    const { year, monthName } = monthValues(body.periode);
    columns = form.key === 'dbd' ? ['BULAN', 'TAHUN', ...fieldColumns] : ['TANGGAL', 'TAHUN', ...fieldColumns];
    values = [monthName, year, ...fieldValues];
  }
  return { columns, values };
}

function formValuesFromRecord(form, record) {
  const values = { ...record };
  if (form.key === 'kecoa') {
    const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(String(record.TANGGAL || ''));
    if (match) values.TANGGAL = `${match[3]}-${match[2]}-${match[1]}`;
  }
  if (form.period) {
    const monthName = form.key === 'dbd' ? record.BULAN : record.TANGGAL;
    const monthNames = ['JANUARI', 'FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI', 'JULI', 'AGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DESEMBER'];
    const monthNumber = monthNames.indexOf(String(monthName || '').toUpperCase()) + 1;
    if (monthNumber) values.periode = `${record.TAHUN}-${String(monthNumber).padStart(2, '0')}`;
  }
  for (const key of ['jam_mulai', 'jam_selesai']) {
    if (values[key] != null) values[key] = String(values[key]).slice(0, 5);
  }
  return values;
}

router.get('/manage', function (req, res) {
  res.render('input-manage-hub', { title: 'Koreksi data', forms: Object.values(forms) });
});

router.get('/manage/:key', async function (req, res) {
  const form = forms[req.params.key];
  if (!form) return res.status(404).render('message', { title: 'Tidak ditemukan', message: 'Jenis data tidak tersedia.' });
  const filters = { wilker: req.query.wilker || 'semua', period: req.query.periode || '', search: req.query.cari || '' };
  try {
    const rows = await service.listInputRecords(form.key, filters);
    const columns = listingColumns[form.key].map(key => ({ key, label: columnLabels[key] || key }));
    return res.render('input-records', { title: `Koreksi ${form.title}`, form, rows, columns, filters, error: null, saved: req.query.tersimpan === '1', wilkers: WILKERS });
  } catch (error) {
    const missingId = error.code === 'ER_BAD_FIELD_ERROR' && /id/i.test(error.message);
    const message = missingId
      ? 'Database belum memiliki ID unik untuk data tikus. Jalankan sql/002-add-record-ids.sql satu kali di database vektor_db.'
      : 'Daftar data gagal dimuat. Periksa koneksi database dan migrasi skema.';
    return res.status(500).render('input-records', {
      title: `Koreksi ${form.title}`, form, rows: [],
      columns: listingColumns[form.key].map(key => ({ key, label: columnLabels[key] || key })),
      filters, error: message, saved: false, wilkers: WILKERS
    });
  }
});

router.get('/:key/:id/edit', async function (req, res) {
  const form = forms[req.params.key];
  if (!form) return res.status(404).render('message', { title: 'Tidak ditemukan', message: 'Formulir tidak tersedia.' });
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id < 1) return res.sendStatus(404);
  try {
    const record = await service.findInputRecord(form.key, id);
    if (!record) return res.status(404).render('message', { title: 'Data tidak ditemukan', message: 'Catatan mungkin sudah dikoreksi atau tidak tersedia.' });
    res.render('input-form', {
      title: `Koreksi ${form.title}`, form: { ...form, submitLabel: 'Simpan koreksi' },
      values: formValuesFromRecord(form, record), error: null,
      formAction: `/input/${form.key}/${id}/edit`, formBackHref: `/input/manage/${form.key}`
    });
  } catch (error) {
    const missingId = error.code === 'ER_BAD_FIELD_ERROR' && /id/i.test(error.message);
    res.status(500).render('message', {
      title: 'Koreksi belum tersedia',
      message: missingId ? 'Jalankan sql/002-add-record-ids.sql satu kali di database vektor_db.' : 'Data gagal dimuat. Periksa koneksi dan skema database.'
    });
  }
});

router.post('/:key/:id/edit', async function (req, res) {
  const form = forms[req.params.key];
  if (!form) return res.sendStatus(404);
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id < 1) return res.sendStatus(404);
  const formAction = `/input/${form.key}/${id}/edit`;
  try {
    const { columns, values } = prepareSubmission(form, req.body);
    await service.updateInputRecord(form.key, id, columns, values);
    return res.redirect(`/input/manage/${form.key}?tersimpan=1`);
  } catch (error) {
    const databaseError = Boolean(error.code);
    return res.status(databaseError ? 500 : 400).render('input-form', {
      title: `Koreksi ${form.title}`, form: { ...form, submitLabel: 'Simpan koreksi' },
      values: req.body, formAction, formBackHref: `/input/manage/${form.key}`,
      error: databaseError ? 'Koreksi gagal disimpan. Periksa koneksi database dan skema ID.' : error.message
    });
  }
});

router.get('/:key', function (req, res) {
  const form = forms[req.params.key];
  if (!form) return res.status(404).render('message', { title: 'Tidak ditemukan', message: 'Formulir tidak tersedia.' });
  res.render('input-form', {
    title: form.title, form, error: null, values: {},
    formAction: `/input/${form.key}`, formBackHref: '/input'
  });
});

router.post('/:key', async function (req, res) {
  const form = forms[req.params.key];
  if (!form) return res.sendStatus(404);
  try {
    const { columns, values } = prepareSubmission(form, req.body);
    await service.insert(form.table, columns, values);
    return res.redirect('/input?tersimpan=1');
  } catch (error) {
    const missingDbdYear = error.code === 'ER_BAD_FIELD_ERROR' && /TAHUN/i.test(error.message);
    const databaseError = Boolean(error.code);
    return res.status(databaseError ? 500 : 400).render('input-form', {
      title: form.title, form, values: req.body, formAction: `/input/${form.key}`, formBackHref: '/input',
      error: missingDbdYear
        ? 'Skema DBD belum diperbarui. Jalankan sql/001-add-dbd-year.sql pada database vektor_db.'
        : databaseError ? 'Data gagal disimpan. Periksa koneksi dan skema database.' : error.message
    });
  }
});

module.exports = router;