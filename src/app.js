require('dotenv').config();
const path = require('path');
const express = require('express');
const pages = require('./routes/pages');
const api = require('./routes/api');
const input = require('./routes/input');

const app = express();
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', 'views'));
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use('/scripts', express.static(path.join(__dirname, '..', 'node_modules', 'chart.js', 'dist')));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use('/', pages);
app.use('/api', api);
app.use('/input', input);

app.use(function notFound(req, res) {
  res.status(404).render('message', {
    title: 'Tidak ditemukan',
    message: 'Halaman yang dicari tidak tersedia.'
  });
});

app.use(function handleError(error, req, res, next) {
  console.error(error);
  res.status(500).render('message', {
    title: 'Terjadi kendala',
    message: 'Halaman gagal dimuat. Silakan coba kembali.'
  });
});

const port = Number(process.env.PORT || 3000);
app.listen(port, function () {
  console.log(`Dashboard Vektor berjalan di port ${port}`);
});

