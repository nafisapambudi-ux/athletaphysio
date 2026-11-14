# PERFORMIQ - Sistem Pemantauan Kondisi Fisik Atlet Berbasis Sports Science

[![React](https://img.shields.io/badge/React-19-blue.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6-purple.svg)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-38bdf8.svg)](https://tailwindcss.com/)
[![Recharts](https://img.shields.io/badge/Recharts-Integrated-22c55e.svg)](https://recharts.org/)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore%20%26%20Auth-ffca28.svg)](https://firebase.google.com/)

Aplikasi web modern pemantauan kondisi fisik, beban latihan (*workload*), evaluasi kebugaran terstandar, dan kesiapan tanding atlet berbasis prinsip *Sports Science* (Sains Olahraga).

Halaman **Beranda** memperkenalkan tujuan platform, pengguna yang dituju, fitur utama, dan alur penggunaan. Buka **Dashboard** dari navigasi untuk masuk ke ringkasan kondisi tim dan fitur pemantauan.

---

## 🚀 Fitur Utama

### 1. Dashboard Analisis & Grafik Longitudinal (Recharts Engine)
* **Grafik Longitudinal 30 Hari**: Memvisualisasikan perbandingan beban akut (*7-day fatigue*), beban kronis (*28-day fitness*), dan beban sesi harian (*sRPE*).
* **Rasio ACWR (Acute:Chronic Workload Ratio)**: Berdasarkan protokol Tim Gabbett, membagi zona beban latihan ke dalam:
  * *Under-training* ($< 0.8$)
  * *Optimal "Sweet Spot"* ($0.8 - 1.3$)
  * *Zona Bahaya Cedera* ($> 1.5$)
* **Matriks Kuadran Risiko Cedera**: Pemetaan 4 kuadran antara beban kronis vs rasio ACWR untuk mencegah lonjakan beban tiba-tiba.
* **Filter Atlet & Cabor**: Pengawasan individual dan per cabang olahraga secara dinamis.

### 2. Pengukuran Biomekanika: Vertical Jump (CMJ/SJ/DJ) & VBT
* **Sensor Akselerometer HP (IMU)**: Mengestimasi waktu melayang (*flight time*) dari fase *free-fall* dan impak pendaratan via `DeviceMotionEvent`; hasil bergantung pada perangkat serta pemasangan HP.
* **Kamera Video Biomekanika**: Pratinjau video dengan penandaan take-off dan landing manual; kamera tidak melakukan pelacakan pose otomatis.
* **Kalkulasi Standar Emas**:
  * Tinggi lompatan rumus Bosco: $h = 122.625 \times t^2$ (cm).
  * Daya mekanik puncak Sayers: $P = 60.7 \times h + 45.3 \times \text{BB} - 2055$ (Watt).
  * Kecepatan lepas landas (*take-off velocity*): $v = 4.905 \times t$ (m/s).
  * Reactive Strength Index (RSI) untuk Drop Jump.
* **Velocity-Based Training (VBT)**:
  * Estimasi *Mean Concentric Velocity* (m/s) per repetisi dari akselerometer HP yang terpasang kuat pada barbel. Sebelum set, kalibrasi diam mengambil sampel orientasi gravitasi selama minimal 1,5 detik dan menetapkan titik nol gerak relatif.
  * Deteksi rep memakai konfirmasi akhir gerak singkat 60 ms dan dapat mulai dari satu akselerasi kuat atau dua sampel gerak normal; bunyi konfirmasi sukses tidak menghambat rep berikutnya, sedangkan alarm velocity loss tetap aktif. Gerakan yang tidak berhenti dengan jelas dalam 4 detik dibuang dan tidak dimasukkan ke hasil.
  * Kalibrasi ini bukan pengukuran ketinggian absolut: akselerometer HP tidak dapat menentukan tinggi/posisi absolut saat diam. Gauge menampilkan estimasi sesaat saat rep berlangsung, lalu menahan hasil rata-rata rep terakhir sambil menunggu rep berikutnya. Setiap rep beserta kecepatan rata-rata, puncak, dan durasinya masuk ke daftar set; simpan sesi dengan tombol **Selesaikan Set & Simpan**.
  * Jangan mengayun atau memindahkan HP dengan tangan untuk mengukur kecepatan. Ponsel harus dipasang kuat dan searah pada barbel; hasil gerakan tangan bukan pengukuran barbel yang valid.
  * Data bertanda **estimasi belum tervalidasi** sampai diuji pada beberapa HP dan dibandingkan dengan instrumen referensi. Jangan gunakan estimasi untuk keputusan klinis atau resep beban tanpa validasi pelatih.
  * Protokol tes menyimpan gerakan, beban, rentang gerak/tempo, status pemasangan HP, dan frekuensi sampel agar sesi dapat dibandingkan secara konsisten.
  * Alarm pemutus kelelahan (*Velocity Loss Cut-off*) via Web Audio API Synthesizer.
  * Prediksi 1RM (*One-Rep Max*) otomatis dari kurva beban-kecepatan.

### 3. Pemantauan Beban Kerja & Kesiapan Harian
* **Session RPE (sRPE)**: Durasi $\times$ Skala Borg Foster (1-10) untuk kalkulasi beban latihan harian.
* **Hooper Index Daily Wellness**: Evaluasi kualitas tidur, nyeri otot (DOMS), stres, dan kelelahan untuk menghasilkan *Readiness Score* (0-100%).
* **Baterai Tes Fisik Terstandar**: VO2 Max (Bleep / Yo-Yo Test), Sprint 20m/30m, Agility T-Test / Illinois, dan Vertical Jump terhadap norma nasional KONI.
* **Peta Titik Nyeri Tubuh Interaktif**: Penandaan lokasi cedera anatomis (tampak depan & belakang) berskala VAS 1-10.

### 4. Database Cloud Persisten & Autentikasi
* **Google Cloud Firestore**: Sinkronisasi data real-time dengan aturan keamanan *Role-Based Access Control* (`firestore.rules`).
* **Isolasi Data per Akun**: Koleksi Firestore hanya dapat dibaca/ditulis pengguna yang terautentikasi dan memiliki `ownerId` yang cocok. Cache browser juga dipisah per akun; cache lokal tidak terenkripsi dan perangkat bersama tetap perlu dilindungi.
* **Firebase Authentication**: Masuk dengan akun Google untuk isolasi data pelatih dan atlet.
* **Resiliensi Offline**: Penyimpanan *local storage mirror* sehingga aplikasi tetap dapat berjalan saat internet tidak stabil.

---

## 🛠️ Tech Stack

* **Frontend Framework**: React 19, TypeScript
* **Build Tool**: Vite 6, TSX
* **Styling**: Tailwind CSS v4, Lucide React Icons
* **Data Visualization**: Recharts, SVG Biomotor Matrix
* **Database & Auth**: Google Cloud Firestore & Firebase Auth
* **Sensors & Audio**: Web DeviceMotionEvent API, Web Audio API, MediaDevices Camera API

---

## 💻 Panduan Instalasi Lokal

### 1. Klon Repositori
```bash
git clone https://github.com/<username>/athletaphysio.git
cd athletaphysio
```

### 2. Instal Dependensi
```bash
npm install
```

### 3. Konfigurasi Lingkungan (`.env`)
Salin file `.env.example` menjadi `.env`:
```bash
cp .env.example .env
```
Isi variabel yang dibutuhkan (opsional jika menggunakan integrasi Gemini AI / Google Cloud):
```env
GEMINI_API_KEY="YOUR_GEMINI_API_KEY"
APP_URL="http://localhost:3000"
```

### 4. Jalankan Server Pengembangan
```bash
npm run dev
```
Buka browser di `http://localhost:3000`.

Untuk membuka aplikasi dari HP:
1. Sambungkan HP dan komputer ke jaringan Wi-Fi yang sama.
2. Jalankan `npm run dev` di komputer.
3. Buka alamat `http://<IP-komputer>:3000` yang ditampilkan di terminal pada browser HP.

Jika alamat tidak dapat dibuka, izinkan Node.js melewati Windows Firewall pada jaringan privat. Server pengembangan ini hanya dapat diakses dari jaringan lokal; untuk akses dari luar jaringan, aplikasi perlu di-deploy ke layanan hosting.

Sensor gerak HP memerlukan dukungan browser dan, pada beberapa perangkat, HTTPS serta izin Motion & Orientation. Uji VBT di beberapa perangkat dan bandingkan dengan alat referensi sebelum menggunakan angkanya untuk mengubah program latihan. Setelah perubahan aturan akses database, deploy `firestore.rules` ke proyek Firebase yang sesuai sebelum mengaktifkan sinkronisasi cloud.

### 5. Build Produksi
```bash
npm run build
```

### GitHub Pages (demo publik)

Setelah repositori didorong ke branch `main`, workflow GitHub Actions akan membangun dan menerbitkan versi demo secara otomatis. Aktifkan **Settings → Pages → Build and deployment → GitHub Actions** jika Pages belum aktif. Demo tidak menyambung ke Firestore atau mengirim data ke server; data yang dicatat disimpan di `localStorage` browser perangkat tersebut dan tidak disinkronkan dengan perangkat lain. Hasil rekomendasi AI pada demo menggunakan analisis lokal, bukan Gemini.

File `firebase-applet-config.json` berisi konfigurasi proyek lokal dan sengaja tidak diunggah. Workflow Pages menggunakan konfigurasi demo tanpa akses ke proyek Firebase.

---

## 👥 Pengembang & Lisensi
Dikembangkan untuk mendukung performa atlet nasional berbasis ilmu kepelatihan dan sains olahraga.
Universitas Negeri Surabaya (UNESA) - Fakultas Ilmu Keolahragaan dan Kesehatan.
Lisensi: MIT.
