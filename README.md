<div align="center">
  <h1>📋 Sistem Absen Barcode</h1>
  <p>Aplikasi absensi sederhana untuk mencatat kehadiran anggota menggunakan QR Code atau NIM.</p>

  <p>
    <a href="https://laravel.com"><img src="https://img.shields.io/badge/Laravel-12.x-FF2D20?style=flat-square&logo=laravel&logoColor=white" alt="Laravel"></a>
    <a href="https://www.php.net"><img src="https://img.shields.io/badge/PHP-8.4+-777BB4?style=flat-square&logo=php&logoColor=white" alt="PHP"></a>
    <a href="https://inertiajs.com"><img src="https://img.shields.io/badge/Inertia-2.x-9553E9?style=flat-square&logo=inertia&logoColor=white" alt="Inertia"></a>
    <a href="https://react.dev"><img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=white" alt="React"></a>
    <a href="https://vitejs.dev"><img src="https://img.shields.io/badge/Vite-6.x-646CFF?style=flat-square&logo=vite&logoColor=white" alt="Vite"></a>
    <a href="https://tailwindcss.com"><img src="https://img.shields.io/badge/Tailwind-4.x-38BDF8?style=flat-square&logo=tailwindcss&logoColor=white" alt="Tailwind"></a>
    <a href="https://www.mysql.com"><img src="https://img.shields.io/badge/MySQL-8.x-4479A1?style=flat-square&logo=mysql&logoColor=white" alt="MySQL"></a>
  </p>

</div>

---

## Tentang Aplikasi

**Sistem Absen Barcode** adalah aplikasi absensi untuk membantu organisasi mencatat kehadiran anggota saat rapat, kegiatan, atau event tertentu.

Biasanya, absensi masih dilakukan dengan kertas, Google Form, atau pesan WhatsApp. Cara tersebut sering membuat proses rekap menjadi lama, data mudah tercecer, dan ada kemungkinan nama anggota terlewat.

Dengan aplikasi ini, proses absensi menjadi lebih praktis:

1. Admin membuat event atau kegiatan.
2. Anggota menunjukkan QR Code miliknya.
3. Admin melakukan scan QR atau memasukkan NIM anggota.
4. Data kehadiran langsung tersimpan di sistem.
5. Hasil absensi bisa diekspor ke Excel.

---

## Alur Penggunaan

### Untuk Anggota

Anggota tidak perlu login untuk membuat QR Code.

```
Buka halaman utama  →  Masukkan NIM  →  Buat QR Code  →  Simpan atau screenshot QR Code
```

QR Code hanya perlu dibuat satu kali. Setelah itu, QR dapat digunakan kembali untuk absensi pada event berikutnya.

Jika anggota tidak membawa HP atau tidak bisa menunjukkan QR Code, admin masih dapat mencatat kehadiran menggunakan NIM, selama QR anggota tersebut sudah pernah dibuat sebelumnya.

### Untuk Admin

Admin perlu login untuk mengelola event dan mencatat absensi.

```
Login  →  Buat event  →  Aktifkan event  →  Scan QR / input NIM  →  Tutup event  →  Ekspor data
```

| Langkah                | Penjelasan                                                      |
| ---------------------- | --------------------------------------------------------------- |
| **Buat event**         | Admin membuat kegiatan atau rapat yang akan diabsenkan          |
| **Aktifkan event**     | Event harus aktif agar anggota bisa dicatat kehadirannya        |
| **Scan QR**            | Admin memindai QR Code anggota menggunakan kamera               |
| **Input NIM**          | Admin dapat memasukkan NIM secara manual jika QR tidak tersedia |
| **Catat izin / sakit** | Admin dapat menandai anggota yang izin atau sakit               |
| **Tutup event**        | Setelah kegiatan selesai, event dapat ditutup                   |
| **Ekspor data**        | Data absensi dapat diunduh dalam format Excel                   |

---

## Fitur Utama

| Fitur                     | Penjelasan                                                         |
| ------------------------- | ------------------------------------------------------------------ |
| Absensi berdasarkan event | Setiap absensi terhubung dengan kegiatan tertentu                  |
| QR Code anggota           | Setiap anggota memiliki QR Code permanen                           |
| Scan QR dan input NIM     | Admin bisa mencatat kehadiran dengan dua cara                      |
| Status kehadiran          | Mendukung status hadir, terlambat, izin, sakit, alpha, dan revoked |
| Rekap otomatis            | Data absensi langsung tersimpan dan siap direkap                   |
| Ekspor Excel              | Hasil absensi dapat diunduh dalam bentuk file Excel                |
| Manajemen anggota         | Admin dapat menambah, mengubah, dan melihat data anggota           |
| Audit log                 | Aktivitas penting di sistem tercatat untuk memudahkan pengecekan   |
| Pembatasan akses          | Fitur admin hanya bisa digunakan setelah login                     |

---

## Status Absensi

Aplikasi ini menggunakan beberapa status kehadiran:

| Status        | Arti                                                                    |
| ------------- | ----------------------------------------------------------------------- |
| **Hadir**     | Anggota hadir tepat waktu                                               |
| **Terlambat** | Anggota hadir, tetapi melewati batas waktu yang ditentukan              |
| **Izin**      | Anggota tidak hadir dengan keterangan izin                              |
| **Sakit**     | Anggota tidak hadir karena sakit                                        |
| **Alpha**     | Anggota tidak hadir tanpa keterangan                                    |
| **Revoked**   | Data absensi dibatalkan karena ada kesalahan input atau alasan tertentu |

Status `Revoked` tidak dihitung sebagai kehadiran aktif dan tidak dimasukkan ke hasil ekspor utama.

---

## Teknologi yang Digunakan

| Bagian       | Teknologi                                      |
| ------------ | ---------------------------------------------- |
| Backend      | Laravel 12, PHP 8.2+                           |
| Frontend     | Inertia.js 2, React 19, Tailwind CSS 4, Vite 6 |
| Database     | MySQL 8 / MariaDB 10.6+                        |
| QR Code      | `bacon/bacon-qr-code`                          |
| Ekspor Excel | `phpoffice/phpspreadsheet`                     |
| Testing      | PHPUnit 11 dan Vitest 2                        |

---

## Instalasi

### Kebutuhan Sistem

Sebelum menjalankan aplikasi, pastikan perangkat sudah memiliki:

* PHP 8.2 atau lebih baru
* Composer 2.x
* Node.js 20 atau lebih baru
* npm
* MySQL 8 atau MariaDB 10.6+

Ekstensi PHP yang dibutuhkan:

```bash
pdo_mysql, mbstring, gd, zip, xml
```

### Langkah Instalasi

Clone repository:

```bash
git clone https://github.com/<user>/<repo>.git sistem-absen
cd sistem-absen
```

Install dependency backend dan frontend:

```bash
composer install
npm install
```

Buat file environment dan generate application key:

```bash
cp .env.example .env
php artisan key:generate
```

Atur konfigurasi database pada file `.env`, lalu jalankan migrasi dan seeder:

```bash
php artisan migrate --seed
```

Build asset frontend dan jalankan server:

```bash
npm run build
php artisan serve
```

---

## Data Anggota

Data anggota diambil dari file CSV berikut:

```bash
database/seeders/data/kepengurusan.csv
```

Jika file belum tersedia, gunakan file sample sebagai template:

```bash
cp database/seeders/data/kepengurusan.sample.csv database/seeders/data/kepengurusan.csv
```

Format kolom CSV:

```bash
Departemen/Biro,Jabatan,Nama,NIM
```

Contoh isi data:

```bash
HRD,Anggota,Budi Santoso,123456789
```

Jika nilai `Departemen/Biro` tidak sesuai dengan daftar departemen yang tersedia di sistem, data tersebut akan dilewati saat proses seeding.

Untuk menjalankan ulang seeder data anggota:

```bash
php artisan db:seed --class=KepengurusanSeeder
```

---

## Akun Demo

Akun demo tersedia setelah proses `php artisan migrate --seed` berhasil
dijalankan. Untuk produksi, **ganti kredensial demo di bawah** sebelum
menerima traffic publik (lihat section *Security Setup (Production)*).

| Role    | Login               | Password   | Akses             |
| ------- | ------------------- | ---------- | ----------------- |
| Admin   | `login_code: admin` | `password` | `/kuasa`          |
| Anggota | NIM dari data CSV   | —          | Halaman utama `/` |

---

## Admin Security

Konsol admin di `/kuasa/dashboard` menerapkan beberapa lapisan proteksi:

### Lockout & Brute-Force Protection

- **Per-akun**: 3 percobaan gagal berturut → akun terkunci sementara
  selama 30 menit. Setelah 3 siklus lockout berturut tanpa login sukses,
  akun ditandai **terkunci permanen** dan hanya bisa dibuka oleh admin
  lain melalui halaman manajemen admin.
- **Per-IP**: route `POST /kuasa` dibatasi `throttle:10,5` (10 percobaan
  per 5 menit per IP) agar attacker tidak bisa enumerate banyak
  `login_code` dari satu titik.
- Pesan kegagalan kredensial selalu generik (`"Kode admin atau password
  salah."`) untuk mencegah user enumeration. Pesan lockout sengaja
  spesifik agar admin tahu harus minta unlock.

### Password Policy (`StrongPassword`)

- Minimal **12 karakter**
- Mengandung huruf besar, huruf kecil, angka, dan simbol
- Tidak boleh sama dengan `login_code`
- Tidak boleh sama dengan **3 password sebelumnya** (anti-reuse)

### Manajemen Akun Admin

Halaman `/kuasa/admins` menyediakan UI untuk:

- Menambah admin baru (StrongPassword diberlakukan saat input password)
- Membuka kunci akun admin lain yang terkunci
- Menghapus admin (diblok jika menyisakan <2 admin atau diri sendiri)

### Audit Log

Semua aktivitas keamanan tercatat di `/kuasa/audit-logs`:

| Action | Arti |
| ------ | ---- |
| `auth.login.success` | Login berhasil |
| `auth.login.failed` | Login gagal (kredensial atau akun tidak dikenal) |
| `auth.login.locked_attempt` | Mencoba login pada akun terkunci |
| `auth.login.role_denied` | Login berhasil tapi role bukan admin |
| `auth.logout` | Logout |
| `auth.lockout_triggered` | Akun dikunci sementara (siklus baru) |
| `auth.permanent_lock` | Akun dikunci permanen |
| `auth.admin_unlocked` | Admin lain membuka kunci |
| `admin.user.created` | Admin baru dibuat |
| `admin.user.deleted` | Admin dihapus |

### Security Setup (Production)

Sebelum go-live, pastikan konfigurasi berikut sudah diterapkan di
environment produksi:

1. **`APP_DEBUG=false`** — `true` di produksi membocorkan stack trace.
2. **`APP_URL=https://...`** + reverse-proxy/Cloudflare yang memaksa
   HTTPS. Aplikasi otomatis memaksa skema `https` saat
   `APP_ENV=production` (lihat `AppServiceProvider`).
3. Set di `.env` produksi:
   ```env
   SESSION_SECURE_COOKIE=true
   SESSION_SAME_SITE=strict
   SESSION_ENCRYPT=true
   SESSION_LIFETIME=120
   ```
4. Generate ulang `APP_KEY` & `QR_SECRET` lewat
   `php artisan key:generate` (jangan reuse dari repo).
5. Ganti kredensial admin demo (`admin` / `password`) sebelum go-live.
   Caranya:
   ```bash
   php artisan tinker
   >>> $u = App\Models\User::where('login_code','admin')->first();
   >>> $u->password = 'PasswordYangKuat!2026'; // di-hash via cast
   >>> $u->save();
   ```
   Atau login ke `/kuasa`, buat akun admin baru di `/kuasa/admins` dengan
   password kuat, lalu hapus akun demo via tombol Hapus di tabel admin
   (sistem mengizinkan hapus selama jumlah admin tetap ≥ 2).
6. Untuk mekanisme unlock antar-admin, jaga **minimal 2 akun admin
   aktif**. Tambah admin kedua via `/kuasa/admins` setelah ganti
   kredensial demo.
7. Cache config & route di production untuk performa:
   ```bash
   php artisan config:cache
   php artisan route:cache
   php artisan view:cache
   ```
8. Aplikasi memasang `Content-Security-Policy`, `X-Frame-Options`,
   `Referrer-Policy`, `Permissions-Policy`, dan `HSTS` (saat HTTPS)
   secara global via `SecurityHeaders` middleware. Verifikasi via
   DevTools → Network → Response Headers.

> ⚠️ **Rotasi kredensial DB**: jika Anda meng-clone repo dari versi
> lama yang pernah memuat kredensial DB di `.env`, anggap kredensial
> tersebut bocor — segera rotasi password DB dan hapus dari git
> history (`git filter-repo`).

---

## Testing

Jalankan testing backend:

```bash
php artisan test
```

Jalankan testing frontend:

```bash
npm run test
```

---

## Struktur Direktori

<details>
<summary>Lihat struktur lengkap</summary>

```
.
├── app/
│   ├── Concerns/                 # Trait reusable
│   ├── DTO/                      # Data transfer objects
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── Admin/            # Dashboard, Event, Member, Scanner, Attendance, AuditLog
│   │   │   ├── Auth/             # LoginController
│   │   │   └── User/             # Halaman QR publik
│   │   ├── Requests/             # Validasi request
│   │   └── Resources/            # API resources
│   ├── Models/                   # User, Profile, Event, Attendance, AuditLog
│   ├── Policies/                 # Authorization
│   ├── Services/                 # Service utama aplikasi
│   └── Support/                  # Helper dan exporter
├── database/
│   ├── migrations/               # Struktur tabel database
│   └── seeders/
│       └── data/                 # Data anggota dalam format CSV
├── resources/
│   ├── js/
│   │   ├── features/
│   │   │   ├── auth/             # Login
│   │   │   ├── public-qr/        # Halaman QR anggota
│   │   │   ├── dashboard/        # Dashboard admin
│   │   │   ├── events/           # Kelola event
│   │   │   ├── members/          # Kelola anggota
│   │   │   └── scanner/          # Scanner QR dan input NIM
│   │   ├── Components/           # Komponen UI
│   │   └── Layouts/              # Layout halaman
│   └── views/                    # Blade root
├── routes/
│   ├── web.php
│   └── console.php
└── tests/                        # Test backend dan frontend
```

</details>

---

