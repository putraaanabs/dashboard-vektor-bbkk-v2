const express = require('express');
const { parse } = require('../utils/filters');
const service = require('../services/dashboardService');

const router = express.Router();

router.get('/data/:vektor', async function (req, res) {
  try {
    const filters = parse(req.query);
    const data = await service.dashboard(req.params.vektor, filters);
    res.json(data);
  } catch (error) {
    const invalidRequest = /valid|dikenal/i.test(error.message);
    const missingDbdYear = error.code === 'ER_BAD_FIELD_ERROR' && /TAHUN/i.test(error.message);
    console.error('Data dashboard:', error.message);

    if (missingDbdYear) {
      return res.status(503).json({
        error: 'Skema DBD belum diperbarui. Jalankan sql/001-add-dbd-year.sql pada database vektor_db, lalu muat ulang dashboard.'
      });
    }

    res.status(invalidRequest ? 400 : 500).json({
      error: invalidRequest ? error.message : 'Data gagal dimuat. Periksa koneksi dan skema database.'
    });
  }
});

function csvCell(value) {
  let text = value == null ? '' : String(value);
  if (/^[=+@-]/.test(text)) text = "'" + text;
  return '"' + text.replaceAll('"', '""') + '"';
}

router.get('/download/:vektor', async function (req, res) {
  try {
    const filters = parse(req.query);
    const data = await service.download(req.params.vektor, filters);

    if (!data.length) return res.status(404).send('Tidak ada data pada filter tersebut.');

    const columns = Object.keys(data[0]);
    const csv = [
      columns.map(csvCell).join(','),
      ...data.map(row => columns.map(column => csvCell(row[column])).join(','))
    ].join('\r\n');

    res.type('text/csv')
      .attachment(`laporan-${req.params.vektor}-${filters.year}-${String(filters.month).padStart(2, '0')}.csv`)
      .send('\uFEFF' + csv);
  } catch (error) {
    const invalidRequest = /valid|dikenal/i.test(error.message);
    console.error('Unduhan dashboard:', error.message);
    res.status(invalidRequest ? 400 : 500)
      .send(invalidRequest ? error.message : 'Unduhan gagal dibuat.');
  }
});

module.exports = router;


