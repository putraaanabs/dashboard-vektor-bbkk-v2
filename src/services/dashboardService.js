const db = require('../config/database');
const { where, monthWhere } = require('../utils/filters');

async function query(sql, params = []) {
  const [rows] = await db.query(sql, params);
  return rows;
}

async function wilkers() {
  const rows = await query(`
    SELECT WILKER AS wilker FROM pengamatan_dbd
    UNION SELECT wilker FROM pengawasan_tikus
    UNION SELECT wilker FROM kondisi_tikus
    UNION SELECT wilker FROM survey_lalat
    UNION SELECT WILKER FROM survey_kecoa
    UNION SELECT WILKER FROM dd_kd
    UNION SELECT wilker FROM uod_uol
    ORDER BY wilker
  `);
  return rows.map(row => row.wilker).filter(Boolean);
}

async function tikus(filters) {
  const condition = where('tanggal', filters);
  const [summary] = await query(`
    SELECT COUNT(*) AS total_survei,
      COALESCE(SUM(jumlah_pemasangan_trap), 0) AS total_trap,
      COALESCE(SUM(jumlah_trap_terdapat_tikus), 0) AS trap_positif,
      COALESCE(SUM(jumlah_tikus), 0) AS tikus_tertangkap
    FROM pengawasan_tikus WHERE ${condition.sql}
  `, condition.params);
  const details = await query(`
    SELECT tanggal, wilker, lokasi_pemasangan_trap AS lokasi,
      jumlah_pemasangan_trap AS trap_dipasang,
      jumlah_trap_terdapat_tikus AS trap_positif,
      jenis_tikus, jumlah_tikus
    FROM pengawasan_tikus WHERE ${condition.sql}
    ORDER BY tanggal, wilker, lokasi_pemasangan_trap
  `, condition.params);
  const environments = await query(`
    SELECT tanggal, wilker, lokasi, kotoran, bau_air_seni, bekas_gigitan,
      genangan_air, keberadaan_sampah, kondisi_tps, kondisi_selokan, riwayat_banjir
    FROM kondisi_tikus WHERE ${condition.sql}
    ORDER BY tanggal, wilker, lokasi
  `, condition.params);
  return { summary, details, environments };
}

async function lalat(filters) {
  const condition = where('tanggal', filters);
  const [summary] = await query(`
    SELECT COUNT(*) AS total_survei,
      AVG(kepadatan_ekor) AS kepadatan,
      AVG(suhu) AS suhu,
      AVG(kelembapan) AS kelembapan,
      AVG(kecepatan_angin) AS angin
    FROM survey_lalat WHERE ${condition.sql}
  `, condition.params);
  const details = await query(`
    SELECT tanggal, wilker, lokasi, kepadatan_ekor, suhu, kelembapan,
      kecepatan_angin, pencahayaan
    FROM survey_lalat WHERE ${condition.sql}
    ORDER BY tanggal, wilker, lokasi
  `, condition.params);
  return { summary, details };
}

async function kecoa(filters) {
  const condition = where('TANGGAL', filters, 'text');
  const [summary] = await query(`
    SELECT COUNT(*) AS total_survei,
      COALESCE(SUM(JUMLAH_PERANGKAP), 0) AS total_trap,
      COALESCE(SUM(JUMLAH_TERTANGKAP), 0) AS tertangkap,
      COALESCE(SUM(P_AMERICANA), 0) AS americana,
      COALESCE(SUM(P_BRANCA), 0) AS branca,
      COALESCE(SUM(B_GERMANICA), 0) AS germanica,
      COALESCE(SUM(B_ORIENTALIS), 0) AS orientalis,
      COALESCE(SUM(ANOTHER_SPECIES), 0) AS lainnya
    FROM survey_kecoa WHERE ${condition.sql}
  `, condition.params);
  const details = await query(`
    SELECT TANGGAL AS tanggal, WILKER AS wilker,
      LOKASI_PENGAMATAN AS lokasi, JUMLAH_PERANGKAP AS perangkap,
      JUMLAH_TERTANGKAP AS tertangkap, P_AMERICANA AS americana,
      P_BRANCA AS branca, B_GERMANICA AS germanica,
      B_ORIENTALIS AS orientalis, ANOTHER_SPECIES AS lainnya
    FROM survey_kecoa WHERE ${condition.sql}
    ORDER BY STR_TO_DATE(TANGGAL, '%d/%m/%Y'), WILKER
  `, condition.params);
  return { summary, details };
}

async function malaria(filters) {
  const legacyDate = where('TANGGAL', filters, 'text');
  const currentDate = where('tanggal', filters);
  const details = await query(`
    SELECT STR_TO_DATE(TANGGAL, '%d/%m/%Y') AS sort_date,
      TANGGAL AS tanggal, JAM_MULAI AS jam_mulai, JAM_SELESAI AS jam_selesai,
      WILKER AS wilker, LOKASI AS lokasi, TEMPERATUR AS suhu,
      MBR_ANOPHELES_SUBPICTUS AS mbr_subpictus,
      MBR_ANOPHELES_SUNDAICUS AS mbr_sundaicus,
      MBR_ANOPHELES_OTHER AS mbr_lainnya,
      MHD_ANOPHELES_SUBPICTUS AS mhd_subpictus,
      MHD_ANOPHELES_SUNDAICUS AS mhd_sundaicus,
      MHD_ANOPHELES_OTHER AS mhd_lainnya
    FROM dd_kd WHERE ${legacyDate.sql}
    UNION ALL
    SELECT tanggal AS sort_date,
      DATE_FORMAT(tanggal, '%d/%m/%Y'),
      TIME_FORMAT(jam_mulai, '%H:%i'), TIME_FORMAT(jam_selesai, '%H:%i'),
      wilker, lokasi, temperatur,
      mbr_anopheles_subpictus, mbr_anopheles_sundaicus, mbr_anopheles_other,
      mhd_anopheles_subpictus, mhd_anopheles_sundaicus, mhd_anopheles_other
    FROM uod_uol WHERE ${currentDate.sql}
    ORDER BY sort_date, jam_mulai, lokasi
  `, legacyDate.params.concat(currentDate.params));
  return { total_survei: details.length, details };
}
async function dbd(filters) {
  const condition = monthWhere(filters);
  const [summaryByArea, summaryRows, details] = await Promise.all([
    query(`
      SELECT AREA AS area,
        SUM(RUMAH_DIPERIKSA) AS rumah,
        SUM(RUMAH_POSITIF) AS positif,
        SUM(KONTAINER_DIPERIKSA) AS kontainer,
        SUM(KONTAINER_POSITIF) AS kontainer_positif
      FROM pengamatan_dbd WHERE ${condition.sql}
      GROUP BY AREA
    `, condition.params),
    query(`
      SELECT COUNT(*) AS total_survei,
        SUM(RUMAH_DIPERIKSA) AS rumah,
        SUM(RUMAH_POSITIF) AS positif,
        SUM(KONTAINER_DIPERIKSA) AS kontainer,
        SUM(KONTAINER_POSITIF) AS kontainer_positif,
        GROUP_CONCAT(DISTINCT LOKASI ORDER BY LOKASI SEPARATOR ', ') AS lokasi
      FROM pengamatan_dbd WHERE ${condition.sql}
    `, condition.params),
    query(`
      SELECT BULAN AS bulan, TAHUN AS tahun, AREA AS area,
        WILKER AS wilker, LOKASI AS lokasi,
        RUMAH_DIPERIKSA AS rumah, RUMAH_POSITIF AS positif,
        KONTAINER_DIPERIKSA AS kontainer,
        KONTAINER_POSITIF AS kontainer_positif
      FROM pengamatan_dbd WHERE ${condition.sql}
      ORDER BY AREA, LOKASI
    `, condition.params)
  ]);

  const foggingCondition = monthWhere(filters, 'TANGGAL');
  const fogging = await query(`
    SELECT AREA AS area, TANGGAL AS bulan, TAHUN AS tahun,
      WILKER AS wilker, LOKASI AS lokasi, LUAS_M2 AS luas,
      JUMLAH_RUMAH AS rumah, MERK_DAGANG AS merk,
      JUMLAH_L AS liter, CAMPURAN_SOLAR AS solar
    FROM pengendalian_dbd WHERE ${foggingCondition.sql}
  `, foggingCondition.params);

  return { summary: summaryRows[0], summaryByArea, details, fogging };
}
const handlers = { tikus, lalat, kecoa, malaria, dbd };

async function dashboard(vector, filters) {
  const handler = handlers[vector];
  if (!handler) throw Error('Jenis vektor tidak dikenal.');
  return handler(filters);
}

async function download(vector, filters) {
  if (vector === 'malaria') {
    return (await malaria(filters)).details.map(({ sort_date, ...row }) => row);
  }

  const sources = {
    tikus: ['pengawasan_tikus', where('tanggal', filters)],
    lalat: ['survey_lalat', where('tanggal', filters)],
    kecoa: ['survey_kecoa', where('TANGGAL', filters, 'text')],
    dbd: ['pengamatan_dbd', monthWhere(filters)]
  };
  const source = sources[vector];
  if (!source) throw Error('Jenis vektor tidak dikenal.');
  return query(`SELECT * FROM ${source[0]} WHERE ${source[1].sql}`, source[1].params);
}

async function insert(table, columns, values) {
  const columnList = columns.join(',');
  const placeholders = columns.map(() => '?').join(',');
  await db.query(`INSERT INTO ${table} (${columnList}) VALUES (${placeholders})`, values);
}

const inputSources = {
  tikus: { table: 'pengawasan_tikus', periodType: 'date', dateColumn: 'tanggal', wilkerColumn: 'wilker', locationColumn: 'lokasi_pemasangan_trap', columns: ['tanggal', 'wilker', 'lokasi_pemasangan_trap', 'jumlah_pemasangan_trap', 'jumlah_trap_terdapat_tikus', 'jenis_tikus', 'jumlah_tikus', 'jumlah_pinjal_umum', 'ip', 'jumlah_x_cheopis', 'ip_khusus'] },
  lingkungan: { table: 'kondisi_tikus', periodType: 'date', dateColumn: 'tanggal', wilkerColumn: 'wilker', locationColumn: 'lokasi', columns: ['tanggal', 'wilker', 'lokasi', 'kotoran', 'bau_air_seni', 'bekas_gigitan', 'genangan_air', 'keberadaan_sampah', 'kondisi_tps', 'kondisi_selokan', 'riwayat_banjir'] },
  lalat: { table: 'survey_lalat', periodType: 'date', dateColumn: 'tanggal', wilkerColumn: 'wilker', locationColumn: 'lokasi', columns: ['tanggal', 'wilker', 'lokasi', 'kepadatan_ekor', 'suhu', 'kelembapan', 'kecepatan_angin', 'pencahayaan'] },
  kecoa: { table: 'survey_kecoa', periodType: 'text-date', dateColumn: 'TANGGAL', wilkerColumn: 'WILKER', locationColumn: 'LOKASI_PENGAMATAN', columns: ['TANGGAL', 'WILKER', 'LOKASI_PENGAMATAN', 'JUMLAH_PERANGKAP', 'JUMLAH_TERTANGKAP', 'P_AMERICANA', 'P_BRANCA', 'B_GERMANICA', 'B_ORIENTALIS', 'ANOTHER_SPECIES'] },
  malaria: { table: 'uod_uol', periodType: 'date', dateColumn: 'tanggal', wilkerColumn: 'wilker', locationColumn: 'lokasi', columns: ['tanggal', 'wilker', 'lokasi', 'jam_mulai', 'jam_selesai', 'jumlah_uod', 'jumlah_uol', 'temperatur', 'kelembapan', 'kecepatan_angin', 'umpan_orang', 'mbr_anopheles_subpictus', 'mbr_anopheles_sundaicus', 'mbr_anopheles_other', 'mhd_anopheles_subpictus', 'mhd_anopheles_sundaicus', 'mhd_anopheles_other'] },
  dbd: { table: 'pengamatan_dbd', periodType: 'month', dateColumn: 'BULAN', yearColumn: 'TAHUN', wilkerColumn: 'WILKER', locationColumn: 'LOKASI', columns: ['BULAN', 'TAHUN', 'WILKER', 'AREA', 'LOKASI', 'RUMAH_DIPERIKSA', 'RUMAH_POSITIF', 'KONTAINER_DIPERIKSA', 'KONTAINER_POSITIF'] },
  fogging: { table: 'pengendalian_dbd', periodType: 'month', dateColumn: 'TANGGAL', yearColumn: 'TAHUN', wilkerColumn: 'WILKER', locationColumn: 'LOKASI', columns: ['TANGGAL', 'TAHUN', 'WILKER', 'AREA', 'LOKASI', 'LUAS_M2', 'JUMLAH_RUMAH', 'MERK_DAGANG', 'JUMLAH_L', 'CAMPURAN_SOLAR'] }
};

function inputSource(key) {
  const source = inputSources[key];
  if (!source) throw Error('Jenis data tidak dikenal.');
  return source;
}

function periodParts(period) {
  const match = /^(20\d{2})-(0[1-9]|1[0-2])$/.exec(String(period || ''));
  if (!match) throw Error('Filter periode tidak valid.');
  return { year: Number(match[1]), month: Number(match[2]) };
}

async function listInputRecords(key, filters = {}) {
  const source = inputSource(key);
  const conditions = [];
  const params = [];
  if (filters.wilker && filters.wilker !== 'semua') {
    conditions.push(`UPPER(${source.wilkerColumn}) = UPPER(?)`);
    params.push(filters.wilker);
  }
  if (filters.period) {
    const { year, month } = periodParts(filters.period);
    if (source.periodType === 'month') {
      const monthName = ['JANUARI', 'FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI', 'JULI', 'AGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DESEMBER'][month - 1];
      conditions.push(`UPPER(${source.dateColumn}) = ?`, `${source.yearColumn} = ?`);
      params.push(monthName, year);
    } else {
      const dateExpression = source.periodType === 'text-date'
        ? `STR_TO_DATE(${source.dateColumn}, '%d/%m/%Y')`
        : source.dateColumn;
      const start = `${year}-${String(month).padStart(2, '0')}-01`;
      const next = new Date(Date.UTC(year, month, 1));
      const end = `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, '0')}-01`;
      conditions.push(`${dateExpression} >= ?`, `${dateExpression} < ?`);
      params.push(start, end);
    }
  }
  const search = String(filters.search || '').trim().slice(0, 100);
  if (search) {
    conditions.push(`${source.locationColumn} LIKE ?`);
    params.push(`%${search}%`);
  }
  const whereSql = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  return query(`SELECT * FROM ${source.table} ${whereSql} ORDER BY id DESC LIMIT 200`, params);
}

async function findInputRecord(key, id) {
  const source = inputSource(key);
  const rows = await query(`SELECT * FROM ${source.table} WHERE id = ? LIMIT 1`, [id]);
  return rows[0] || null;
}

async function updateInputRecord(key, id, columns, values) {
  const source = inputSource(key);
  if (!columns.length || columns.length !== values.length || columns.some(column => !source.columns.includes(column))) {
    throw Error('Kolom koreksi tidak valid.');
  }
  const assignments = columns.map(column => `${column} = ?`).join(', ');
  await db.query(`UPDATE ${source.table} SET ${assignments} WHERE id = ?`, [...values, id]);
  const rows = await query(`SELECT id FROM ${source.table} WHERE id = ? LIMIT 1`, [id]);
  if (!rows.length) throw Error('Catatan tidak ditemukan.');
}

module.exports = { wilkers, dashboard, download, insert, listInputRecords, findInputRecord, updateInputRecord };


