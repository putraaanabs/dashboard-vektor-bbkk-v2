# Dashboard Surveilans Vektor BBKK

Versi baru dashboard dengan Express, EJS, MySQL, dan Chart.js. Struktur dipisahkan menjadi routes, services, utils, views, dan public assets.

## Menjalankan

1. Pasang Node.js dan MySQL.
2. Buat database bernama `vektor_db` dan impor dump database proyek yang sudah ada.
3. Jalankan migrasi `sql/001-add-dbd-year.sql`; migrasi ini aman dijalankan ulang dan memilih database `vektor_db`. Pemilik proyek mengonfirmasi seluruh data DBD lama pada dump berasal dari 2025; migrasi ini memberi tahun itu kepada catatan lama dan menambah dukungan tahun pada input berikutnya.
4. Untuk fitur koreksi, jalankan `sql/002-add-record-ids.sql` satu kali agar catatan tikus dan kondisi lingkungan memiliki ID unik.
5. Salin `.env.example` menjadi `.env`, lalu isi konfigurasi database lokal.
6. Jalankan `npm install`. Untuk memulai aplikasi pada Windows, buka `Jalankan-Dashboard.bat` dari folder project; atau jalankan `npm start` dari PowerShell yang berada di folder ini.
7. Buka `http://localhost:3000`.

## Fitur

- Filter periode dan wilayah kerja.
- Dashboard tikus, lalat, kecoa, malaria, dan DBD.
- Unduh CSV untuk semua jenis vektor.
- Formulir input termasuk pengamatan dan pengendalian DBD.
- Koreksi catatan lama melalui menu Input data → Koreksi data tersimpan; fitur koreksi mengubah catatan tanpa menghapusnya.
- MBR dan MHD disimpan serta ditampilkan sebagai indikator berbeda.
- Keadaan tanpa data diberi pesan, bukan ditampilkan sebagai hasil indeks nol atau ABJ 100%.

## Catatan skema lama

Tabel kecoa dan data malaria lama menyimpan tanggal sebagai teks. Aplikasi membaca format tanggal `dd/mm/yyyy` untuk kedua tabel tersebut agar kompatibel dengan dump. Untuk pengembangan lanjutan, tanggal-tanggal tersebut sebaiknya dimigrasikan ke kolom bertipe DATE. File `.env` tidak disertakan; gunakan kredensial lokal dan jangan masukkan file itu ke arsip.



## Grafik waktu

Dashboard memakai filter bulan. Tikus, lalat, dan kecoa ditampilkan per tanggal survei. Grafik malaria dikelompokkan per interval jam pengamatan; MBR/MHD dirata-ratakan untuk setiap interval dalam bulan terpilih. Data DBD pada dump hanya memiliki bulan dan tahun, sehingga ditampilkan sebagai ringkasan bulanan per area.

