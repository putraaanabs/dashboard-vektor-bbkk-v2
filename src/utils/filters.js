const MONTHS = [
  'JANUARI', 'FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI',
  'JULI', 'AGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DESEMBER'
];

function parse(query) {
  const month = Number(query.bulan);
  const year = Number(query.tahun);
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw Error('Pilih bulan yang valid.');
  }
  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    throw Error('Pilih tahun yang valid.');
  }

  return {
    month,
    year,
    monthName: MONTHS[month - 1],
    wilker: (typeof query.wilker === 'string' && query.wilker.trim()) || 'semua'
  };
}

function monthBounds(filters) {
  const start = `${filters.year}-${String(filters.month).padStart(2, '0')}-01`;
  const nextMonth = new Date(filters.year, filters.month, 1);
  const end = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}-01`;
  return { start, end };
}

function where(column, filters, kind) {
  const bounds = monthBounds(filters);
  const expression = kind === 'text'
    ? `STR_TO_DATE(${column}, '%d/%m/%Y')`
    : column;
  const clauses = [`${expression} >= ?`, `${expression} < ?`];
  const params = [bounds.start, bounds.end];

  if (filters.wilker !== 'semua') {
    clauses.push('UPPER(WILKER) = UPPER(?)');
    params.push(filters.wilker);
  }

  return { sql: clauses.join(' AND '), params };
}

function monthWhere(filters, column = 'BULAN') {
  const clauses = [`UPPER(${column}) = ?`, 'TAHUN = ?'];
  const params = [filters.monthName, filters.year];
  if (filters.wilker !== 'semua') {
    clauses.push('UPPER(WILKER) = UPPER(?)');
    params.push(filters.wilker);
  }
  return { sql: clauses.join(' AND '), params };
}

module.exports = { parse, where, monthWhere };
