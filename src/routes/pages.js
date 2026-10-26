const express = require('express');
const service = require('../services/dashboardService');

const router = express.Router();

async function renderDashboard(req, res) {
  let wilkers = [];
  try {
    wilkers = await service.wilkers();
  } catch (error) {
    console.error('Wilker list:', error.message);
  }

  res.render('dashboard', {
    title: 'Dashboard Surveilans Vektor',
    wilkers
  });
}

router.get('/', renderDashboard);
router.get('/dashboard', renderDashboard);

router.get('/input', function (req, res) {
  res.render('input-hub', {
    title: 'Input data',
    tersimpan: req.query.tersimpan === '1'
  });
});

module.exports = router;
