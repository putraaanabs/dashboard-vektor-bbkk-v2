-- Jalankan sekali pada database vektor_db sebelum memakai fitur koreksi data.
-- Kedua tabel ini tidak memiliki ID unik pada dump awal.
USE vektor_db;

SET @has_tikus_id := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'pengawasan_tikus'
    AND COLUMN_NAME = 'id'
);
SET @tikus_id_sql := IF(
  @has_tikus_id = 0,
  'ALTER TABLE pengawasan_tikus ADD COLUMN id INT NOT NULL AUTO_INCREMENT PRIMARY KEY FIRST',
  'SELECT ''Kolom id pada pengawasan_tikus sudah tersedia'' AS status'
);
PREPARE tikus_id_stmt FROM @tikus_id_sql;
EXECUTE tikus_id_stmt;
DEALLOCATE PREPARE tikus_id_stmt;

SET @has_lingkungan_id := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'kondisi_tikus'
    AND COLUMN_NAME = 'id'
);
SET @lingkungan_id_sql := IF(
  @has_lingkungan_id = 0,
  'ALTER TABLE kondisi_tikus ADD COLUMN id INT NOT NULL AUTO_INCREMENT PRIMARY KEY FIRST',
  'SELECT ''Kolom id pada kondisi_tikus sudah tersedia'' AS status'
);
PREPARE lingkungan_id_stmt FROM @lingkungan_id_sql;
EXECUTE lingkungan_id_stmt;
DEALLOCATE PREPARE lingkungan_id_stmt;