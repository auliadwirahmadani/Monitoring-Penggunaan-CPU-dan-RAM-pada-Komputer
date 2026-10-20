# Monitoring Penggunaan CPU dan RAM pada Komputer

Aplikasi web dashboard interaktif dan real-time untuk memantau performa perangkat komputer, khususnya penggunaan **CPU**, **RAM (Memory)**, **Penyimpanan (Disk C:)**, serta daftar **Aplikasi / Proses Terberat** yang sedang berjalan di sistem operasi Windows.

---

## Fitur Utama

1. **Pemantauan CPU Real-Time**:
   - Menampilkan persentase beban prosesor secara langsung (*Instantaneous Processor Load*).
   - Indikator gauge melingkar dengan perubahan warna dinamis (*Normal*, *Tinggi*, *Kritis*).
   - Grafik garis riwayat penggunaan CPU secara real-time (30 titik data terakhir).

2. **Pemantauan RAM (Memori) Real-Time**:
   - Menampilkan persentase memori terpakai, kapasitas total (GB), memori yang sedang digunakan (GB), dan sisa memori bebas (GB).
   - Indikator gauge melingkar dan grafik garis riwayat real-time.

3. **Status Penyimpanan (Disk C:)**:
   - Menampilkan persentase pemakaian drive C:, ruang terpakai (GB), ruang kosong (GB), dan kapasitas total (GB).

4. **Daftar 10 Proses Aplikasi Terberat (Top Resource-Consuming Processes)**:
   - Menampilkan PID, nama aplikasi, penggunaan memori (MB), waktu eksekusi CPU, dan status respon.
   - Dilengkapi kolom **Pencarian / Filter Real-time** untuk mencari proses tertentu berdasarkan nama atau PID.

5. **Spesifikasi Lengkap Hardware & Sistem Operasi**:
   - Model prosesor (misal: *AMD Ryzen / Intel Core*).
   - Jumlah Core dan Logical Processors (Threads) beserta Clock Speed.
   - Versi & Arsitektur Windows (64-bit).
   - Nama Komputer dan Akun Pengguna yang sedang aktif.
   - System Uptime (lama waktu komputer menyala).

6. **Sistem Peringatan (Alert System)**:
   - Banner peringatan visual ketika beban CPU atau RAM melampaui batas ambang batas (default: 85%).
   - Alarm audio (suara beep peringatan sintetis via Web Audio API) yang dapat diaktifkan/dinonaktifkan oleh pengguna.
   - Pengaturan batas ambang (*threshold slider*) yang fleksibel (50% - 95%).

7. **Kontrol Interaktif & Ekspor Data**:
   - Pilihan interval pembaruan: 1 detik, 2 detik, 3 detik, atau 5 detik.
   - Tombol **Jeda / Resume** pemantauan.
   - **Ekspor Riwayat ke CSV**: Mengunduh seluruh riwayat pembacaan metrik ke format spreadsheet (CSV).
   - **Unduh Snapshot JSON**: Mengunduh data metrik lengkap saat ini dalam format JSON.
   - Toggle **Mode Gelap (Dark Mode)** dan **Mode Terang (Light Mode)** yang otomatis tersimpan.

---

## Struktur Direktori

```text
Monitoring Penggunaan CPU dan RAM pada Komputer/
├── assets/
│   ├── css/
│   │   └── style.css            # Styling glassmorphism, animasi, dan gauge
│   └── js/
│       └── app.js               # Logika frontend, Chart.js, audio alert, dan polling API
├── data/                        # Folder cache info sistem
├── scripts/
│   └── get_metrics.ps1          # Skrip PowerShell untuk membaca metrik Windows
├── api.php                      # Endpoint REST API (metrics & sysinfo)
├── index.php                    # Halaman antarmuka utama dashboard
├── run.bat                      # Peluncur sekali klik (one-click runner)
└── README.md                    # Dokumentasi lengkap
```

---

## Cara Menjalankan Aplikasi

Anda dapat menjalankan aplikasi ini dengan salah satu dari 3 cara berikut:

### Cara 1: Menggunakan File `run.bat` (Paling Praktis)
1. Buka folder proyek di File Explorer.
2. Klik ganda (double-click) pada file **`run.bat`**.
3. Browser akan otomatis terbuka dan menampilkan dashboard di alamat `http://localhost:8080`.

---

### Cara 2: Menggunakan Laragon
Karena proyek ini berada di folder `c:\laragon\www\Monitoring Penggunaan CPU dan RAM pada Komputer`:
1. Buka aplikasi **Laragon**.
2. Klik tombol **Start All** pada Laragon untuk mengaktifkan Apache/Nginx.
3. Buka browser Anda dan akses tautan berikut:
   ```text
   http://localhost/Monitoring%20Penggunaan%20CPU%20dan%20RAM%20pada%20Komputer/
   ```
   *Atau jika menggunakan fitur Virtual Host Laragon:*
   ```text
   http://monitoring-penggunaan-cpu-dan-ram-pada-komputer.test/
   ```

---

### Cara 3: Menggunakan Terminal / Command Prompt
1. Buka terminal (PowerShell atau Command Prompt) di folder proyek.
2. Jalankan perintah server bawaan PHP:
   ```bash
   php -S localhost:8080
   ```
3. Buka browser dan kunjungi `http://localhost:8080`.

---

## Persyaratan Sistem

- **Sistem Operasi**: Windows 10 atau Windows 11 (64-bit)
- **PHP**: Versi 7.4 ke atas atau PHP 8.x (sudah tersedia bawaan Laragon)
- **PowerShell**: Bawaan Windows
- **Browser**: Google Chrome, Microsoft Edge, Mozilla Firefox, atau browser modern lainnya dengan dukungan JavaScript aktif.
