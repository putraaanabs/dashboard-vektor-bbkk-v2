(function () {
  const tabs = document.querySelectorAll('.tab');
  if (!tabs.length) return;

  const wilkerFilter = document.getElementById('filter-wilker');
  const monthFilter = document.getElementById('filter-bulan');
  const tables = document.getElementById('tables');
  const metrics = document.getElementById('metrics');
  const notice = document.getElementById('notice');
  const emptyState = document.getElementById('no-data');
  const chartsBox = document.getElementById('charts');
  const chartPanelA = document.getElementById('chart-panel-a');
  const chartPanelB = document.getElementById('chart-panel-b');
  const dbdPeriodNote = document.getElementById('dbd-period-note');
  const dailyMethodNote = document.getElementById('daily-method-note');
  const hourMethodNote = document.getElementById('hour-method-note');
  const dbdYearNote = document.getElementById('dbd-year-note');
  const dbdIndexNote = document.getElementById('dbd-index-note');
  const chartCoverageNote = document.getElementById('chart-coverage-note');

  let activeVector = 'tikus';
  let charts = {};

  const monthsShort = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const labels = {
    tanggal: 'Tanggal',
    jam_mulai: 'Jam mulai',
    jam_selesai: 'Jam selesai',
    bulan: 'Bulan',
    tahun: 'Tahun',
    wilker: 'Wilker',
    lokasi: 'Lokasi',
    trap_dipasang: 'Perangkap dipasang',
    trap_positif: 'Perangkap positif',
    jenis_tikus: 'Jenis tikus',
    jumlah_tikus: 'Tikus tertangkap',
    kotoran: 'Tanda kotoran',
    bau_air_seni: 'Bau air seni',
    bekas_gigitan: 'Bekas gigitan',
    genangan_air: 'Genangan air',
    keberadaan_sampah: 'Keberadaan sampah',
    kondisi_tps: 'Kondisi TPS',
    kondisi_selokan: 'Kondisi selokan',
    riwayat_banjir: 'Riwayat banjir',
    kepadatan_ekor: 'Kepadatan',
    suhu: 'Suhu',
    kelembapan: 'Kelembapan',
    kecepatan_angin: 'Kecepatan angin',
    pencahayaan: 'Pencahayaan',
    perangkap: 'Perangkap dipasang',
    tertangkap: 'Tertangkap',
    americana: 'P. americana',
    branca: 'P. branca',
    germanica: 'B. germanica',
    orientalis: 'B. orientalis',
    lainnya: 'Lainnya',
    mbr_subpictus: 'MBR An. subpictus',
    mbr_sundaicus: 'MBR An. sundaicus',
    mbr_lainnya: 'MBR Anopheles lainnya',
    mhd_subpictus: 'MHD An. subpictus',
    mhd_sundaicus: 'MHD An. sundaicus',
    mhd_lainnya: 'MHD Anopheles lainnya',
    area: 'Area',
    rumah: 'Rumah diperiksa',
    positif: 'Rumah positif',
    kontainer: 'Kontainer diperiksa',
    kontainer_positif: 'Kontainer positif',
    hi: 'HI (%)',
    ci: 'CI (%)',
    bi: 'BI (per 100 rumah)',
    abj: 'ABJ (%)',
    merk: 'Merek dagang',
    luas: 'Luas (m²)',
    liter: 'Jumlah liter',
    solar: 'Campuran solar'
  };

  function clearDashboard() {
    tables.replaceChildren();
    metrics.replaceChildren();
    notice.className = 'notice';
    notice.hidden = true;
    emptyState.hidden = true;
    chartsBox.hidden = true;
    chartPanelA.hidden = false;
    chartPanelB.hidden = false;
    dbdPeriodNote.hidden = true;
    dailyMethodNote.hidden = true;
    hourMethodNote.hidden = true;
    dbdYearNote.hidden = true;
    dbdIndexNote.hidden = true;
    chartCoverageNote.hidden = true;
    Object.values(charts).forEach(chart => chart.destroy());
    charts = {};
  }

  function addTable(title, rows, columns) {
    const panel = document.createElement('article');
    panel.className = 'panel table-panel';

    const heading = document.createElement('div');
    heading.className = 'table-title';
    heading.textContent = title;
    panel.append(heading);

    if (!rows || !rows.length) {
      const message = document.createElement('p');
      message.className = 'table-empty';
      message.textContent = 'Tidak ada catatan untuk periode ini.';
      panel.append(message);
      tables.append(panel);
      return;
    }

    const wrapper = document.createElement('div');
    wrapper.className = 'table-wrap';
    const table = document.createElement('table');
    const head = document.createElement('thead');
    const headingRow = document.createElement('tr');
    columns.forEach(column => {
      const cell = document.createElement('th');
      cell.scope = 'col';
      cell.textContent = labels[column] || column;
      headingRow.append(cell);
    });
    head.append(headingRow);
    table.append(head);

    const body = document.createElement('tbody');
    rows.forEach(row => {
      const line = document.createElement('tr');
      columns.forEach(column => {
        const cell = document.createElement('td');
        cell.textContent = formatCell(column, row[column]);
        line.append(cell);
      });
      body.append(line);
    });
    table.append(body);
    wrapper.append(table);
    panel.append(wrapper);
    tables.append(panel);
  }

  function formatCell(column, value) {
    if (value == null || value === '') return '—';
    const decimalColumns = new Set(['hi', 'ci', 'bi', 'abj']);
    if (decimalColumns.has(column) && Number.isFinite(Number(value))) {
      return new Intl.NumberFormat('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(value));
    }
    return String(value);
  }

  function formatSurveyDate(value) {
    const key = parseDateKey(value);
    if (!key) return value || '—';
    const [year, month, day] = key.split('-').map(Number);
    return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
      .format(new Date(year, month - 1, day));
  }

  function setChartCoverage(rows, isHourly) {
    const dates = [...new Set(rows.map(row => parseDateKey(row.tanggal)).filter(Boolean))].sort();
    const count = rows.length;
    const dateCount = dates.length;
    let summary = `Grafik menggunakan ${count} catatan dari ${dateCount} tanggal survei dalam periode terpilih.`;
    if (isHourly) summary += ' Nilai dikelompokkan menurut interval jam yang tercatat.';
    if (dateCount === 1) summary += ' Data hanya mencakup satu tanggal survei, jadi belum mewakili pola pada tanggal lain.';
    summary += isHourly
      ? ' Interval tanpa catatan tidak ditampilkan sebagai nilai nol.'
      : ' Tanggal tanpa catatan survei tidak ditampilkan sebagai nilai nol.';
    chartCoverageNote.textContent = summary;
    chartCoverageNote.hidden = false;
  }
  function drawChart(id, title, chartLabels, datasets, axisLabel = 'TREN HARIAN', chartType = 'line') {
    const canvas = document.getElementById(id);
    const titleElement = document.getElementById(id === 'chart-a' ? 'chart-title-a' : 'chart-title-b');
    titleElement.textContent = title;
    const panel = id === 'chart-a' ? chartPanelA : chartPanelB;
    panel.querySelector('.eyebrow').textContent = axisLabel;
    canvas.style.height = '260px';

    charts[id] = new Chart(canvas, {
      type: chartType,
      data: { labels: chartLabels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: { legend: { position: 'bottom' } },
        scales: chartType === 'line' ? {
          x: { ticks: { maxRotation: 0, minRotation: 0, autoSkip: true, maxTicksLimit: 10 } },
          y: { beginAtZero: true }
        } : {}
      }
    });
  }

  function parseDateKey(value) {
    if (value == null) return null;
    const text = String(value);
    const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
    const dmy = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (dmy) return `${dmy[3]}-${String(dmy[2]).padStart(2, '0')}-${String(dmy[1]).padStart(2, '0')}`;
    return null;
  }

  function shortDate(dateKey) {
    const [, month, day] = dateKey.split('-').map(Number);
    return `${day} ${monthsShort[month - 1]}`;
  }

  function dailySeries(rows, dateField, measures, method) {
    const grouped = new Map();

    rows.forEach(row => {
      const day = parseDateKey(row[dateField]);
      if (!day) return;
      if (!grouped.has(day)) {
        grouped.set(day, Object.fromEntries(measures.map(item => [item.key, { sum: 0, count: 0 }])));
      }
      const bucket = grouped.get(day);
      measures.forEach(item => {
        const raw = row[item.key];
        if (raw == null || raw === '' || !Number.isFinite(Number(raw))) return;
        bucket[item.key].sum += Number(raw);
        bucket[item.key].count += 1;
      });
    });

    const days = [...grouped.keys()].sort();
    const datasets = measures.map(item => ({
      label: item.label,
      data: days.map(day => {
        const value = grouped.get(day)[item.key];
        if (!value.count) return null;
        return method === 'average' ? value.sum / value.count : value.sum;
      }),
      borderColor: item.color,
      backgroundColor: item.color,
      tension: 0.25,
      pointRadius: 3,
      pointHoverRadius: 5,
      spanGaps: false
    }));

    return { labels: days.map(shortDate), datasets };
  }

  function clockOrder(value) {
    const match = String(value || '').match(/^(\d{1,2}):(\d{2})/);
    if (!match) return Number.MAX_SAFE_INTEGER;
    const hour = Number(match[1]);
    const minute = Number(match[2]);
    return (hour < 12 ? hour + 24 : hour) * 60 + minute;
  }

  function hourlySeries(rows, measures) {
    const grouped = new Map();
    rows.forEach(row => {
      if (!row.jam_mulai || !row.jam_selesai) return;
      const start = String(row.jam_mulai).slice(0, 5);
      const end = String(row.jam_selesai).slice(0, 5);
      const key = `${start}|${end}`;
      if (!grouped.has(key)) {
        grouped.set(key, {
          start,
          end,
          values: Object.fromEntries(measures.map(item => [item.key, { sum: 0, count: 0 }]))
        });
      }
      const interval = grouped.get(key);
      measures.forEach(item => {
        const raw = row[item.key];
        if (raw == null || raw === '' || !Number.isFinite(Number(raw))) return;
        interval.values[item.key].sum += Number(raw);
        interval.values[item.key].count += 1;
      });
    });

    const intervals = [...grouped.values()].sort((a, b) => clockOrder(a.start) - clockOrder(b.start));
    const datasets = measures.map(item => ({
      label: item.label,
      data: intervals.map(interval => {
        const value = interval.values[item.key];
        return value.count ? value.sum / value.count : null;
      }),
      borderColor: item.color,
      backgroundColor: item.color,
      tension: 0.25,
      pointRadius: 3,
      pointHoverRadius: 5,
      spanGaps: false
    }));

    return {
      labels: intervals.map(interval => `${interval.start}–${interval.end}`),
      datasets
    };
  }
  function addDailyChart(rows, dateField, measures, method, titleA) {
    const data = dailySeries(rows, dateField, measures, method);
    if (!data.labels.length) return;
    chartsBox.hidden = false;
    drawChart('chart-a', titleA, data.labels, data.datasets);

    chartPanelB.hidden = true;
  }

  function dbdIndexRows(rows) {
    return rows.map(row => {
      const houses = Number(row.rumah) || 0;
      const housePositive = Number(row.positif) || 0;
      const containers = Number(row.kontainer) || 0;
      const containerPositive = Number(row.kontainer_positif) || 0;
      const hi = houses ? housePositive / houses * 100 : null;
      return {
        ...row,
        hi,
        ci: containers ? containerPositive / containers * 100 : null,
        bi: houses ? containerPositive / houses * 100 : null,
        abj: hi === null ? null : 100 - hi
      };
    });
  }

  function metricCard(label, value) {
    const card = document.createElement('article');
    card.className = 'metric';
    const title = document.createElement('p');
    title.className = 'metric-label';
    title.textContent = label;
    const amount = document.createElement('p');
    amount.className = 'metric-value';
    const displayValue = value == null || value === '' ? '—' : String(value);
    if (typeof value === 'string' && value.trim() && !Number.isFinite(Number(value))) {
      amount.classList.add('metric-value-text');
      amount.textContent = value.trim().toLocaleLowerCase('id-ID')
        .replace(/(^|[\s-])([a-zà-ÿ])/g, (_, separator, letter) => separator + letter.toLocaleUpperCase('id-ID'))
        .replace(/\b(Tps|Mbr|Mhd|Abj|Hi|Ci|Bi|Dbd)\b/g, token => token.toUpperCase());
    } else {
      amount.textContent = displayValue;
    }
    card.append(title, amount);
    return card;
  }

  function metricGroup(title, items) {
    if (!items.length) return;
    const group = document.createElement('section');
    group.className = 'summary-group';
    const heading = document.createElement('h2');
    heading.textContent = title;
    const grid = document.createElement('div');
    grid.className = 'metric-grid';
    items.forEach(([label, value]) => grid.append(metricCard(label, value)));
    group.append(heading, grid);
    metrics.append(group);
  }

  function metricNumber(value, digits = 0) {
    const number = Number(value);
    return Number.isFinite(number)
      ? new Intl.NumberFormat('id-ID', { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(number)
      : '—';
  }

  function renderMetrics(vector, data) {
    metrics.replaceChildren();
    if (vector === 'tikus') {
      const s = data.summary || {};
      metricGroup('Ringkasan pengawasan tikus', [
        ['Total survei', metricNumber(s.total_survei)],
        ['Perangkap dipasang', metricNumber(s.total_trap)],
        ['Perangkap positif', metricNumber(s.trap_positif)],
        ['Tikus tertangkap', metricNumber(s.tikus_tertangkap)]
      ]);
      const latest = (data.environments || []).at(-1);
      if (latest) metricGroup('Kondisi lingkungan · catatan terakhir', [
        ['Tanggal catatan', formatSurveyDate(latest.tanggal)], ['Wilker', latest.wilker], ['Lokasi', latest.lokasi],
        ['Kotoran', latest.kotoran], ['Bau air seni', latest.bau_air_seni],
        ['Bekas gigitan', latest.bekas_gigitan], ['Genangan air', latest.genangan_air],
        ['Keberadaan sampah', latest.keberadaan_sampah], ['Kondisi TPS', latest.kondisi_tps],
        ['Kondisi selokan', latest.kondisi_selokan], ['Riwayat banjir', latest.riwayat_banjir]
      ]);
    } else if (vector === 'lalat') {
      const s = data.summary || {};
      metricGroup('Ringkasan survei lalat', [
        ['Total survei', metricNumber(s.total_survei)],
        ['Rata-rata kepadatan (ekor)', metricNumber(s.kepadatan, 2)],
        ['Rata-rata suhu (°C)', metricNumber(s.suhu, 1)],
        ['Rata-rata kelembapan (%)', metricNumber(s.kelembapan, 1)],
        ['Rata-rata kecepatan angin (m/s)', metricNumber(s.angin, 2)]
      ]);
    } else if (vector === 'kecoa') {
      const s = data.summary || {};
      const species = [
        ['P. americana', Number(s.americana) || 0], ['P. branca', Number(s.branca) || 0],
        ['B. germanica', Number(s.germanica) || 0], ['B. orientalis', Number(s.orientalis) || 0],
        ['Spesies lain', Number(s.lainnya) || 0]
      ];
      const dominant = species.reduce((best, item) => item[1] > best[1] ? item : best, ['—', 0]);
      metricGroup('Ringkasan survei kecoa', [
        ['Total survei', metricNumber(s.total_survei)],
        ['Total perangkap', metricNumber(s.total_trap)],
        ['Total tertangkap', metricNumber(s.tertangkap)],
        ['Spesies dominan', dominant[1] ? `${dominant[0]} (${metricNumber(dominant[1])})` : '—'],
        ...species.map(([name, count]) => [name, metricNumber(count)])
      ]);
    } else if (vector === 'malaria') {
      const rows = data.details || [];
      const averages = (key) => {
        const values = rows.map(row => Number(row[key])).filter(Number.isFinite);
        return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
      };
      metricGroup('Ringkasan pengamatan malaria · rata-rata per catatan', [
        ['Total survei', metricNumber(rows.length)],
        ['MBR An. subpictus', metricNumber(averages('mbr_subpictus'), 2)],
        ['MBR An. sundaicus', metricNumber(averages('mbr_sundaicus'), 2)],
        ['MBR Anopheles lainnya', metricNumber(averages('mbr_lainnya'), 2)],
        ['MHD An. subpictus', metricNumber(averages('mhd_subpictus'), 2)],
        ['MHD An. sundaicus', metricNumber(averages('mhd_sundaicus'), 2)],
        ['MHD Anopheles lainnya', metricNumber(averages('mhd_lainnya'), 2)]
      ]);
    } else if (vector === 'dbd') {
      const s = data.summary || {};
      const houses = Number(s.rumah) || 0;
      const positive = Number(s.positif) || 0;
      const containers = Number(s.kontainer) || 0;
      const positiveContainers = Number(s.kontainer_positif) || 0;
      const hi = houses ? positive / houses * 100 : null;
      const ci = containers ? positiveContainers / containers * 100 : null;
      const bi = houses ? positiveContainers / houses * 100 : null;
      const abj = hi == null ? null : 100 - hi;
      metricGroup('Ringkasan DBD · bulan terpilih', [
        ['Total survei', metricNumber(s.total_survei)],
        ['Rumah diperiksa', metricNumber(houses)], ['Rumah positif', metricNumber(positive)],
        ['Kontainer diperiksa', metricNumber(containers)], ['Kontainer positif', metricNumber(positiveContainers)],
        ['House Index · HI', hi == null ? '—' : `${metricNumber(hi, 2)}%`],
        ['Container Index · CI', ci == null ? '—' : `${metricNumber(ci, 2)}%`],
        ['Breteau Index · BI', bi == null ? '—' : metricNumber(bi, 2)],
        ['Angka Bebas Jentik · ABJ', abj == null ? '—' : `${metricNumber(abj, 2)}%`],
        ['Lokasi survei', s.lokasi || '—']
      ]);
      (data.summaryByArea || []).forEach(area => {
        const areaHouses = Number(area.rumah) || 0;
        const areaPositive = Number(area.positif) || 0;
        const areaContainers = Number(area.kontainer) || 0;
        const areaPositiveContainers = Number(area.kontainer_positif) || 0;
        const areaHi = areaHouses ? areaPositive / areaHouses * 100 : null;
        const areaCi = areaContainers ? areaPositiveContainers / areaContainers * 100 : null;
        const areaBi = areaHouses ? areaPositiveContainers / areaHouses * 100 : null;
        const areaAbj = areaHi == null ? null : 100 - areaHi;
        const targetStatus = areaAbj == null ? '—' : areaAbj < 95 ? 'Di bawah target ABJ 95%' : 'Mencapai target ABJ 95%';
        metricGroup(`Area ${area.area}`, [
          ['Rumah diperiksa', metricNumber(areaHouses)], ['Rumah positif', metricNumber(areaPositive)],
          ['HI', areaHi == null ? '—' : `${metricNumber(areaHi, 2)}%`],
          ['Kontainer diperiksa', metricNumber(areaContainers)], ['Kontainer positif', metricNumber(areaPositiveContainers)],
          ['CI', areaCi == null ? '—' : `${metricNumber(areaCi, 2)}%`],
          ['BI', areaBi == null ? '—' : metricNumber(areaBi, 2)],
          ['ABJ', areaAbj == null ? '—' : `${metricNumber(areaAbj, 2)}%`], ['Status indeks', risk]
        ]);
      });
    }
  }
  async function loadDashboard() {
    clearDashboard();
    if (!monthFilter.value) return;

    const [year, month] = monthFilter.value.split('-');
    const query = new URLSearchParams({
      wilker: wilkerFilter.value,
      bulan: month,
      tahun: year
    });

    try {
      const response = await fetch(`/api/data/${activeVector}?${query}`);
      const data = await response.json();
      if (!response.ok) throw Error(data.error || 'Data gagal dimuat.');
      let recordCount = 0;

      if (activeVector === 'tikus') {
        recordCount = data.details.length;
        addDailyChart(data.details, 'tanggal', [
          { label: 'Perangkap positif', key: 'trap_positif', color: '#087e83' },
          { label: 'Tikus tertangkap', key: 'jumlah_tikus', color: '#d18428' }
        ], 'sum', 'Perubahan temuan tikus per hari');
        addTable('Pengawasan perangkap', data.details,
          ['tanggal', 'wilker', 'lokasi', 'trap_dipasang', 'trap_positif', 'jenis_tikus', 'jumlah_tikus']);
        addTable('Kondisi lingkungan', data.environments,
          ['tanggal', 'wilker', 'lokasi', 'kotoran', 'bau_air_seni', 'bekas_gigitan', 'genangan_air', 'keberadaan_sampah', 'kondisi_tps', 'kondisi_selokan', 'riwayat_banjir']);
      }

      if (activeVector === 'lalat') {
        recordCount = data.details.length;
        addDailyChart(data.details, 'tanggal', [
          { label: 'Kepadatan rata-rata', key: 'kepadatan_ekor', color: '#087e83' }
        ], 'average', 'Perubahan rata-rata kepadatan lalat per hari');
        addTable('Catatan survei lalat', data.details,
          ['tanggal', 'wilker', 'lokasi', 'kepadatan_ekor', 'suhu', 'kelembapan', 'kecepatan_angin', 'pencahayaan']);
      }

      if (activeVector === 'kecoa') {
        recordCount = data.details.length;
        const totals = dailySeries(data.details, 'tanggal', [
          { label: 'Kecoa tertangkap', key: 'tertangkap', color: '#087e83' }
        ], 'sum');
        const species = dailySeries(data.details, 'tanggal', [
          { label: 'P. americana', key: 'americana', color: '#087e83' },
          { label: 'P. branca', key: 'branca', color: '#416ea6' },
          { label: 'B. germanica', key: 'germanica', color: '#d18428' },
          { label: 'B. orientalis', key: 'orientalis', color: '#b74d55' },
          { label: 'Lainnya', key: 'lainnya', color: '#8c78b9' }
        ], 'sum');
        if (totals.labels.length) {
          chartsBox.hidden = false;
          drawChart('chart-a', 'Kecoa tertangkap per hari', totals.labels, totals.datasets);
          drawChart('chart-b', 'Temuan spesies per hari', species.labels, species.datasets);
        }
        addTable('Rincian survei kecoa', data.details,
          ['tanggal', 'wilker', 'lokasi', 'perangkap', 'tertangkap', 'americana', 'branca', 'germanica', 'orientalis', 'lainnya']);
      }

      if (activeVector === 'malaria') {
        recordCount = data.details.length;
        const mbr = hourlySeries(data.details, [
          { label: 'An. subpictus', key: 'mbr_subpictus', color: '#087e83' },
          { label: 'An. sundaicus', key: 'mbr_sundaicus', color: '#416ea6' },
          { label: 'Anopheles lainnya', key: 'mbr_lainnya', color: '#d18428' }
        ]);
        const mhd = hourlySeries(data.details, [
          { label: 'An. subpictus', key: 'mhd_subpictus', color: '#087e83' },
          { label: 'An. sundaicus', key: 'mhd_sundaicus', color: '#416ea6' },
          { label: 'Anopheles lainnya', key: 'mhd_lainnya', color: '#d18428' }
        ]);
        if (mbr.labels.length || mhd.labels.length) {
          chartsBox.hidden = false;
          hourMethodNote.hidden = false;
          if (mbr.labels.length) drawChart('chart-a', 'MBR menurut jam pengamatan', mbr.labels, mbr.datasets, 'TREN PER JAM');
          else chartPanelA.hidden = true;
          if (mhd.labels.length) drawChart('chart-b', 'MHD menurut jam pengamatan', mhd.labels, mhd.datasets, 'TREN PER JAM');
          else chartPanelB.hidden = true;
        }
        addTable('Rincian indikator MBR dan MHD', data.details,
          ['tanggal', 'jam_mulai', 'jam_selesai', 'wilker', 'lokasi', 'suhu', 'mbr_subpictus', 'mbr_sundaicus', 'mbr_lainnya', 'mhd_subpictus', 'mhd_sundaicus', 'mhd_lainnya']);
      }
      if (activeVector === 'dbd') {
        recordCount = data.details.length + data.fogging.length;
        dbdPeriodNote.hidden = false;
        dbdYearNote.hidden = false;
        dbdIndexNote.hidden = false;
        addTable('Indeks jentik per area · ringkasan bulan terpilih', dbdIndexRows(data.summaryByArea),
          ['area', 'rumah', 'positif', 'hi', 'kontainer', 'kontainer_positif', 'ci', 'bi', 'abj']);
        addTable('Pengamatan jentik', data.details,
          ['bulan', 'tahun', 'area', 'wilker', 'lokasi', 'rumah', 'positif', 'kontainer', 'kontainer_positif']);
        addTable('Pengendalian / fogging', data.fogging,
          ['bulan', 'tahun', 'area', 'wilker', 'lokasi', 'luas', 'rumah', 'merk', 'liter', 'solar']);
      }

      if (activeVector === 'dbd' && Number(data.summary?.rumah) > 0) {
        const houses = Number(data.summary.rumah) || 0;
        const positive = Number(data.summary.positif) || 0;
        chartsBox.hidden = false;
        chartPanelB.hidden = true;
        drawChart('chart-a', 'Perbandingan rumah positif dan negatif', ['Positif', 'Tidak positif'], [{
          label: 'Rumah', data: [positive, Math.max(0, houses - positive)],
          backgroundColor: ['#b74d55', '#087e83'], borderWidth: 0
        }], 'RINGKASAN BULANAN', 'doughnut');
      }

      if (recordCount) renderMetrics(activeVector, data);
      if (!chartsBox.hidden && activeVector !== 'dbd') {
        const isHourly = activeVector === 'malaria';
        if (isHourly) hourMethodNote.hidden = false;
        else dailyMethodNote.hidden = false;
        setChartCoverage(data.details || [], isHourly);
      }
      if (!recordCount) emptyState.hidden = false;
    } catch (error) {
      notice.textContent = error.message;
      notice.className = 'notice error';
      notice.hidden = false;
    }
  }

  tabs.forEach(tab => tab.addEventListener('click', () => {
    tabs.forEach(item => item.classList.toggle('active', item === tab));
    activeVector = tab.dataset.vektor;
    loadDashboard();
  }));

  wilkerFilter.addEventListener('change', loadDashboard);
  monthFilter.addEventListener('change', loadDashboard);
  document.getElementById('download-data').addEventListener('click', () => {
    if (!monthFilter.value) return;
    const [year, month] = monthFilter.value.split('-');
    const query = new URLSearchParams({
      wilker: wilkerFilter.value,
      bulan: month,
      tahun: year
    });
    window.location.href = `/api/download/${activeVector}?${query}`;
  });

  loadDashboard();
})();






