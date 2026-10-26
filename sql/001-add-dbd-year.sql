-- Jalankan pada database vektor_db. Aman dijalankan ulang.
-- Catatan pemilik proyek: seluruh data DBD lama berasal dari tahun 2025.
USE vektor_db;

SET @has_dbd_year := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'pengamatan_dbd'
    AND COLUMN_NAME = 'TAHUN'
);
SET @dbd_year_sql := IF(
  @has_dbd_year = 0,
  'ALTER TABLE pengamatan_dbd ADD COLUMN TAHUN SMALLINT NOT NULL DEFAULT 2025',
  'SELECT ''Kolom TAHUN pada pengamatan_dbd sudah tersedia'' AS status'
);
PREPARE dbd_year_stmt FROM @dbd_year_sql;
EXECUTE dbd_year_stmt;
DEALLOCATE PREPARE dbd_year_stmt;

SET @has_fogging_year := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'pengendalian_dbd'
    AND COLUMN_NAME = 'TAHUN'
);
SET @fogging_year_sql := IF(
  @has_fogging_year = 0,
  'ALTER TABLE pengendalian_dbd ADD COLUMN TAHUN SMALLINT NOT NULL DEFAULT 2025',
  'SELECT ''Kolom TAHUN pada pengendalian_dbd sudah tersedia'' AS status'
);
PREPARE fogging_year_stmt FROM @fogging_year_sql;
EXECUTE fogging_year_stmt;
DEALLOCATE PREPARE fogging_year_stmt;

UPDATE pengamatan_dbd SET TAHUN = 2025 WHERE TAHUN IS NULL;
UPDATE pengendalian_dbd SET TAHUN = 2025 WHERE TAHUN IS NULL;
