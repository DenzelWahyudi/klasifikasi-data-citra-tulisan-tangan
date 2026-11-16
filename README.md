# Klasifikasi Data Citra Tulisan Tangan Mahasiswa

Sistem *end-to-end* berbasis Web dan REST API untuk mengidentifikasi kepemilikan citra tulisan tangan mahasiswa di antara **51 kelas identitas** menggunakan pendekatan multi-algoritma Machine Learning klasik (**SVM** dan **Random Forest** dengan ekstraksi fitur tekstur **GLCM Haralick**) serta Deep Learning (**MobileNetV2 Transfer Learning**).

---

## Daftar Isi

- [Tentang Proyek](#tentang-proyek)
- [Akses Dataset Mentah](#akses-dataset-mentah)
- [Teknologi yang Digunakan](#teknologi-yang-digunakan)
- [Pipeline Pra-Pemrosesan Citra](#pipeline-pra-pemrosesan-citra)
- [Hasil Eksperimen & Evaluasi Model](#hasil-eksperimen--evaluasi-model)
- [Fitur Utama Aplikasi Web](#fitur-utama-aplikasi-web)
- [Struktur Repositori](#struktur-repositori)
- [Arsitektur Backend: Lokal vs Render Cloud](#arsitektur-backend-lokal-vs-render-cloud)
- [Panduan Menjalankan Aplikasi Secara Lokal](#panduan-menjalankan-aplikasi-secara-lokal)
  - [1. Prasyarat Sistem](#1-prasyarat-sistem)
  - [2. Menjalankan Backend API Lokal (`server/`)](#2-menjalankan-backend-api-lokal-server)
  - [3. Menjalankan Frontend Web (`client/`)](#3-menjalankan-frontend-web-client)
- [Panduan Deployment ke Cloud (Render & Vercel)](#panduan-deployment-ke-cloud-render--vercel)
  - [1. Deployment Backend ke Render (`server_render/`)](#1-deployment-backend-ke-render-server_render)
  - [2. Deployment Frontend ke Vercel / Netlify](#2-deployment-frontend-ke-vercel--netlify)
- [Dokumentasi Lengkap REST API](#dokumentasi-lengkap-rest-api)
  - [Daftar Endpoint](#daftar-endpoint)
  - [Skema Respons JSON: Endpoint Tunggal](#skema-respons-json-endpoint-tunggal)
  - [Skema Respons JSON: Endpoint Komparasi](#skema-respons-json-endpoint-komparasi-apipredictall)
  - [Contoh Integrasi Frontend (JavaScript Fetch API)](#contoh-integrasi-frontend-javascript-fetch-api)
- [Variabel Lingkungan (Environment Variables)](#variabel-lingkungan-environment-variables)
- [Kontribusi & Lisensi](#kontribusi--lisensi)

---

## Tentang Proyek

Repositori ini memuat implementasi komprehensif penelitian komputasi citra digital untuk klasifikasi kepemilikan tulisan tangan mahasiswa:
1. **Eksplorasi & Pelatihan Model**: Notebook Jupyter (`Klasifikasi_Data_Citra_Export.ipynb`) yang mendokumentasikan pemrosesan awal dataset citra, pemotongan Region of Interest (ROI), letterboxing, ekstraksi fitur tekstur GLCM Haralick, pengujian 5-Fold Stratified Cross Validation, visualisasi komparasi metrik, serta ekspor bobot model terstandarisasi.
2. **Backend REST API**: Layanan inferensi berbasis FastAPI dengan dukungan dua mode arsitektur:
   - **`server/`**: Mode *Eager Loading* untuk lingkungan pengembangan lokal berkecepatan tinggi.
   - **`server_render/`**: Mode *Lazy Loading* & hemat memori (`tensorflow-cpu`, `gc.collect()`) yang dirancang khusus untuk hosting cloud berkapasitas terbatas (Render Free Tier 512MB RAM).
3. **Frontend Web Interface**: Antarmuka web modern bergaya editorial minimalis menggunakan React 19, TypeScript, dan Tailwind CSS v4 untuk mengunggah citra tulisan tangan, memilih algoritma, membandingkan prediksi secara *real-time*, menelusuri 51 kelas mahasiswa, dan mengakses dataset mentah.

Sistem dilatih untuk mengenali **51 kelas identitas mahasiswa** (mulai dari `A220199`, `A240008`, `A240029`, hingga `A250052`) dari total **2.782 citra tulisan tangan**.

---

## Akses Dataset Mentah

Dataset citra tulisan tangan mentah yang digunakan untuk melatih dan mengevaluasi seluruh model dapat diakses publik melalui tautan Google Drive berikut:

🔗 **[Google Drive: Dataset Citra Tulisan Tangan](https://drive.google.com/drive/folders/18UY9zQHOQ68EhoRDoGf3jj9ZWEnBbqXe?usp=drive_link)**

- **Total Sampel**: 2.782 citra tulisan tangan
- **Jumlah Kelas**: 51 identitas mahasiswa unik
- **Format File**: JPG / PNG / JPEG

---

## Teknologi yang Digunakan

### **Backend & Machine Learning**
- **Python 3.10+** (Disarankan Python 3.11 untuk kompatibilitas cloud)
- **FastAPI** & **Uvicorn** (REST API asynchronous berkinerja tinggi)
- **Scikit-Learn** & **Joblib** (Implementasi SVM RBF, Random Forest, StandardScaler, LabelEncoder)
- **Scikit-Image** (Ekstraksi fitur Gray-Level Co-occurrence Matrix / GLCM Haralick)
- **TensorFlow** / **Keras** (`tensorflow` lokal, `tensorflow-cpu` untuk deployment cloud)
- **Pillow (PIL)** & **NumPy** (Manipulasi citra, pemotongan ROI, letterboxing, dan pemrosesan array numerik)
- **Pydantic v2** (Validasi data & serialisasi skema respons)

### **Frontend**
- **React 19** & **TypeScript**
- **Vite** (Build tool super cepat & dev server dengan reverse proxy)
- **Tailwind CSS v4** (`@tailwindcss/vite` untuk penataan antarmuka responsif)
- **Lucide React** (Koleksi ikon antarmuka modern)
- **React Compiler (Babel)** (Optimasi rendering komponen otomatis)

---

## Pipeline Pra-Pemrosesan Citra

Untuk memastikan model berfokus pada goresan teks tulisan tangan tanpa terdistorsi oleh orientasi atau margin kosong, diterapkan alur pra-pemrosesan terstandarisasi:

1. **Pemotongan Area Teks / ROI (`crop_text_roi`)**:
   - Citra dikonversi ke grayscale dan binerisasi adaptif (threshold intensitas $< 210$).
   - Menghitung koordinat pembatas goresan teks terluar dan memotong area kosong (*whitespace margin*) di sekitarnya dengan *padding* 10 piksel.
2. **Letterbox Resizing (`resize_with_letterbox`)**:
   - Mengubah ukuran citra dengan mempertahankan aspek rasio asli (*aspect-ratio preservation*) menggunakan interpolasi Lanczos.
   - Menempatkan citra di tengah kanvas kanonik dengan warna latar netral abu-abu muda `rgb(230, 230, 230)` agar tidak menimbulkan distorsi peregangan pada proporsi goresan huruf.
3. **Penyaluran Input Spesifik Model**:
   - **SVM & Random Forest (+ GLCM)**:
     - Menggunakan citra Grayscale berukuran $128 \times 128$ piksel.
     - Ekstraksi 24 fitur tekstur GLCM (6 properti Haralick $\times$ 4 orientasi sudut pada jarak $d = 1$).
     - Normalisasi fitur dengan `StandardScaler`.
   - **MobileNetV2 (Deep Learning)**:
     - Menggunakan citra RGB berukuran $224 \times 224 \times 3$ piksel.
     - Normalisasi nilai piksel ke rentang $[-1.0, 1.0]$ (`mobilenet_v2_range`).

---

## Hasil Eksperimen & Evaluasi Model

Seluruh model dievaluasi menggunakan metode **5-Fold Stratified Cross Validation** pada 2.782 citra dari 51 kelas identitas mahasiswa. Fitur tekstur GLCM diekstrak menggunakan 6 properti Haralick (*Contrast, Dissimilarity, Homogeneity, Energy, Correlation, ASM*) pada jarak $d = 1$ dan 4 orientasi sudut ($0^\circ, 45^\circ, 90^\circ, 135^\circ$), menghasilkan 24 fitur per citra.

### **Tabel Rekapitulasi Metrik Evaluasi (5-Fold CV)**

| Nama Algoritma | Rata-Rata Precision | Rata-Rata Recall | Rata-Rata Akurasi | Rata-Rata F1-Score | Waktu Pelatihan / Fold |
|:---|:---:|:---:|:---:|:---:|:---:|
| **Algoritma 1: SVM + GLCM (RBF, $C=10.0$)** | **63.75%** | **61.91%** | **61.50%** | **61.08%** | **~0.39 detik** |
| **Algoritma 2: Random Forest + GLCM (100 Trees)** | 60.04% | 59.27% | 59.35% | 58.47% | ~2.25 detik |
| **Arsitektur Deep Learning: MobileNetV2** | 58.56% | 49.27% | 49.46% | 47.48% | ~265.54 detik |

> **Catatan Analisis Eksperimen:**
> - Ekstraksi fitur GLCM memerlukan total waktu komputasi **1.064,33 detik (~17,7 menit)** untuk keseluruhan 2.782 citra (rata-rata **~0,38 detik per citra**).
> - **SVM + GLCM (RBF)** mencatatkan performa terbaik di antara seluruh model dengan Akurasi **61.50%** dan F1-Score **61.08%**, didukung efisiensi waktu pelatihan yang luar biasa cepat (**~0.39 detik per fold**).
> - **Random Forest + GLCM** juga menghasilkan akurasi yang kompetitif sebesar **59.35%** dengan kestabilan estimasi probabilitas ensemble 100 pohon keputusan.
> - **MobileNetV2** mencatatkan Akurasi **49.46%** dan F1-Score **47.48%** dengan waktu komputasi pelatihan terpanjang (~265.54 detik per fold). Pada data goresan tulisan tangan dengan 51 kelas berukuran sampel terbatas, representasi tekstur Haralick 24-dimensi berbasis arah goresan terbukti lebih efektif dan diskriminatif dibandingkan ekstraksi konvolusional tanpa augmentasi skala besar.

---

## Fitur Utama Aplikasi Web

- **Multi-Model Selector & Toggle**: Fleksibilitas memilih salah satu algoritma atau menjalankan ketiga model sekaligus untuk komparasi langsung.
- **Analisis Konsensus Otomatis**: Banner ringkasan cerdas yang mengevaluasi apakah model mencapai kesepakatan mutlak (*unanimous agreement*), konsensus mayoritas, atau hasil yang terbagi (*split decision*).
- **Top-5 Confidence Ranking**: Menampilkan 5 kandidat kelas teratas beserta persentase keyakinan dan bilah visualisasi progres.
- **Latency Monitoring**: Menampilkan waktu komputasi inferensi (*processing time*) dalam satuan milidetik (ms) untuk mengamati efisiensi tiap model.
- **Pemilih Sampel Siap Pakai**: Pilihan cepat (*quick chips*) untuk menguji sampel citra tulisan tangan tanpa perlu mengunggah file manual.
- **Classes Drawer**: Panel samping interaktif untuk mencari dan menelusuri seluruh 51 identitas mahasiswa yang terdaftar dalam model.
- **Akses Dataset Mentah**: Bagian kartu akses langsung ke folder Google Drive dataset citra asli.
- **Health Indicator & Offline Fallback**: Indikator status koneksi API di header dengan petunjuk instruksi jika server lokal belum aktif.

---

## Struktur Repositori

```text
klasifikasi-data-citra-tulisan-tangan/
├── client/                               # Frontend Web (React 19 + TypeScript + Vite)
│   ├── public/
│   │   ├── samples/                      # Citra sampel pengujian cepat (sample_A250002.jpg, dst)
│   │   └── favicon.svg                   # Favicon antarmuka web
│   ├── src/
│   │   ├── components/                   # Komponen modular UI (Header, Uploader, Drawer, dll)
│   │   ├── services/                     # Layanan pemanggilan REST API (api.ts)
│   │   ├── App.tsx                       # Halaman utama aplikasi web
│   │   ├── constants.ts                  # Metadata sampel, konfigurasi model, & URL dataset
│   │   ├── types.ts                      # Definisi kontrak tipe data TypeScript
│   │   ├── index.css                     # Pengaturan Tailwind CSS v4 & font
│   │   └── main.tsx                      # Entrypoint React DOM
│   ├── .env.example                      # Contoh konfigurasi URL API frontend
│   ├── package.json                      # Dependensi JavaScript & skrip npm
│   └── vite.config.ts                    # Konfigurasi Vite & reverse proxy (/api -> :8000)
│
├── server/                               # Backend REST API Lokal (FastAPI - Eager Loading)
│   ├── model_export/                     # Bobot model & metadata hasil pelatihan
│   │   ├── classes.json                  # Pemetaan 51 label kelas mahasiswa
│   │   ├── glcm_scaler.joblib            # StandardScaler untuk fitur GLCM
│   │   ├── label_encoder.joblib          # LabelEncoder indeks ke string nama kelas
│   │   ├── metadata.json                 # Konfigurasi ukuran input citra & parameter GLCM
│   │   ├── mobilenetv2_final.keras       # Model Deep Learning MobileNetV2
│   │   ├── mobilenetv2_final.h5          # Backup format H5 MobileNetV2
│   │   ├── rf_glcm_final.joblib          # Model Random Forest Classifier
│   │   └── svm_glcm_final.joblib         # Model SVM Classifier (RBF)
│   ├── main.py                           # Entrypoint aplikasi FastAPI & routing API
│   ├── models_loader.py                  # In-memory eager loader untuk inferensi lokal
│   ├── preprocessing.py                  # Ekstraksi fitur GLCM, ROI cropping, & letterboxing
│   ├── schemas.py                        # Skema validasi Pydantic v2
│   ├── requirements.txt                  # Dependensi Python backend lokal
│   └── .env.example                      # Variabel lingkungan server lokal
│
├── server_render/                        # Backend REST API Cloud (Khusus Render Free Tier)
│   ├── model_export/                     # Bobot model yang sama dengan server/
│   ├── main.py                           # Entrypoint FastAPI kompatibel Render
│   ├── models_loader.py                  # Lazy loading (on-demand) & auto-GC pembersih RAM
│   ├── preprocessing.py                  # Ekstraksi fitur GLCM & preprocessing identik server/
│   ├── schemas.py                        # Skema Pydantic identik dengan server/
│   ├── requirements.txt                  # Dependensi ringan (tensorflow-cpu & scikit-learn~=1.6.1)
│   └── .env.example                      # Variabel lingkungan Render
│
├── Klasifikasi_Data_Citra_Export.ipynb   # Notebook eksperimen, pelatihan, & ekspor model
├── AGENTS.md                             # Pedoman aturan operasional sinkronisasi server
└── README.md                             # Dokumentasi utama proyek
```

---

## Arsitektur Backend: Lokal vs Render Cloud

Repositori ini menyediakan dua folder backend dengan tujuan yang spesifik:

| Karakteristik | `server/` (Pengembangan Lokal) | `server_render/` (Deployment Cloud Render) |
|---|---|---|
| **Tujuan Utama** | Pengembangan lokal di laptop/PC developer | Menghindari OOM pada Render Free Tier (RAM 512MB) |
| **Strategi Pemuatan Model** | **Eager Loading**: Semua model dimuat ke RAM saat server dinyalakan | **Lazy Loading (On-Demand)**: Hanya metadata ringan yang dimuat saat *startup*; model berat baru dimuat saat endpoint dipanggil |
| **Varian TensorFlow** | `tensorflow>=2.15.0` (Standar dengan pustaka lengkap) | `tensorflow-cpu>=2.15.0` (Menghemat ~150–200 MB RAM tanpa overhead GPU) |
| **Manajemen Memori** | Mengandalkan *garbage collection* bawaan Python | Melakukan `gc.collect()` eksplisit setelah setiap proses inferensi |
| **Waktu Startup Server** | ~5–10 detik (karena memuat semua bobot model) | **< 2 detik** (port segera terbuka sehingga lolos health-check Render) |

> [!IMPORTANT]
> Sesuai pedoman proyek di `AGENTS.md`, setiap pembaruan logika endpoint atau pra-pemrosesan di `server/` wajib disinkronkan ke `server_render/` agar kedua lingkungan tetap konsisten.

---

## Panduan Menjalankan Aplikasi Secara Lokal

### 1. Prasyarat Sistem

Pastikan perangkat Anda telah terpasang:
- **Python 3.10** atau lebih baru
- **Node.js 18** atau lebih baru (disertai `npm`)
- **Git**

---

### 2. Menjalankan Backend API Lokal (`server/`)

1. Buka terminal dan masuk ke direktori `server`:
   ```bash
   cd server
   ```

2. Buat dan aktifkan *virtual environment* Python:
   ```bash
   # Windows (PowerShell):
   python -m venv venv
   .\venv\Scripts\Activate.ps1

   # Windows (Command Prompt):
   python -m venv venv
   .\venv\Scripts\activate.bat

   # Linux / macOS:
   python3 -m venv venv
   source venv/bin/activate
   ```

3. Pasang dependensi pustaka:
   ```bash
   pip install -r requirements.txt
   ```

4. *(Opsional)* Buat file `.env` dari contoh yang tersedia:
   ```bash
   # Windows (PowerShell):
   Copy-Item .env.example .env

   # Linux / macOS:
   cp .env.example .env
   ```

5. Jalankan server Uvicorn:
   ```bash
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

Server akan aktif di `http://localhost:8000`. Dokumentasi interaktif Swagger UI dapat diakses langsung melalui:
**[http://localhost:8000/docs](http://localhost:8000/docs)**

---

### 3. Menjalankan Frontend Web (`client/`)

1. Buka terminal baru dan masuk ke direktori `client`:
   ```bash
   cd client
   ```

2. Pasang dependensi JavaScript:
   ```bash
   npm install
   ```

3. *(Opsional)* Salin file konfigurasi environment:
   ```bash
   # Windows (PowerShell):
   Copy-Item .env.example .env

   # Linux / macOS:
   cp .env.example .env
   ```
   > Secara bawaan, Vite telah dikonfigurasi dengan reverse proxy ke `http://localhost:8000`. Jika Anda mengubah port backend, sesuaikan nilai `VITE_API_URL` pada `.env`.

4. Jalankan server pengembangan Vite:
   ```bash
   npm run dev
   ```

5. Buka peramban dan akses alamat yang ditampilkan:
   **`http://localhost:5173`**

#### **Daftar Skrip npm pada Client:**
- `npm run dev`: Menjalankan dev server Vite dengan fitur Hot Module Replacement (HMR).
- `npm run build`: Melakukan type-check TypeScript (`tsc -b`) dan kompilasi produksi ke direktori `dist/`.
- `npm run preview`: Meninjau build hasil produksi secara lokal.
- `npm run lint`: Memeriksa kualitas kode menggunakan ESLint.
- `npm run format`: Merapikan format kode dengan Prettier.

---

## Panduan Deployment ke Cloud (Render & Vercel)

### 1. Deployment Backend ke Render (`server_render/`)

Directori `server_render/` telah dioptimalkan agar tidak terkena batas memori (*Out Of Memory*).

1. Buat **Web Service** baru di [Dashboard Render](https://dashboard.render.com).
2. Hubungkan repositori GitHub ini.
3. Atur konfigurasi dasar Web Service:
   | Pengaturan | Nilai |
   |---|---|
   | **Name** | `handwriting-classification-api` (bebas) |
   | **Root Directory** | `server_render` |
   | **Runtime** | `Python 3` |
   | **Build Command** | `pip install --no-cache-dir -r requirements.txt` |
   | **Start Command** | `uvicorn main:app --host 0.0.0.0 --port $PORT` |
   | **Instance Type** | `Free` (512 MB RAM) |

4. Tambahkan **Environment Variables** di Render:
   | Key | Value | Catatan |
   |---|---|---|
   | `PYTHON_VERSION` | `3.11.8` | **Sangat disarankan** demi kompatibilitas TensorFlow & Scikit-Learn |
   | `CORS_ORIGINS` | `*` | Atau isi dengan URL frontend Anda (misal `https://aplikasi-kamu.vercel.app`) |

---

### 2. Deployment Frontend ke Vercel / Netlify

1. Hubungkan repositori ke [Vercel](https://vercel.com) atau [Netlify](https://www.netlify.com).
2. Tentukan pengaturan build frontend:
   - **Root Directory**: `client`
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Tambahkan Environment Variable:
   - `VITE_API_URL`: Isi dengan URL backend Render Anda (contoh: `https://handwriting-classification-api.onrender.com`).

---

## Dokumentasi Lengkap REST API

Seluruh endpoint inferensi menerima request `POST` berformat `multipart/form-data` dengan field berkas citra bernilai `file`. Format citra yang didukung meliputi PNG, JPG, JPEG, BMP, dan WebP.

### **Daftar Endpoint**

| Method | Endpoint | Deskripsi |
|:---:|:---|:---|
| `GET` | `/` | Root status layanan dan ringkasan endpoint |
| `GET` | `/api/health` | Cek status kesehatan server dan ketersediaan model di memori |
| `GET` | `/api/classes` | Mengambil daftar 51 identitas kelas mahasiswa yang dikenali |
| `POST` | `/api/predict/svm` | Prediksi menggunakan **Support Vector Machine (SVM) + GLCM** |
| `POST` | `/api/predict/rf` | Prediksi menggunakan **Random Forest + GLCM** |
| `POST` | `/api/predict/mobilenetv2` | Prediksi menggunakan **MobileNetV2 (Deep Learning)** |
| `POST` | `/api/predict/all` | Menjalankan **ketiga algoritma sekaligus** untuk komparasi |

---

### **Skema Respons JSON: Endpoint Tunggal**

Contoh respons dari `/api/predict/mobilenetv2`, `/api/predict/svm`, atau `/api/predict/rf`:

```json
{
  "algorithm_id": "svm",
  "algorithm_name": "SVM + GLCM",
  "top_prediction": "A250016",
  "confidence": 0.6375,
  "percentage": "63.75%",
  "processing_time_ms": 14.5,
  "top_5": [
    {
      "rank": 1,
      "class_name": "A250016",
      "confidence": 0.6375,
      "percentage": "63.75%"
    },
    {
      "rank": 2,
      "class_name": "A250013",
      "confidence": 0.1210,
      "percentage": "12.10%"
    },
    {
      "rank": 3,
      "class_name": "A250002",
      "confidence": 0.0525,
      "percentage": "5.25%"
    },
    {
      "rank": 4,
      "class_name": "A250041",
      "confidence": 0.0351,
      "percentage": "3.51%"
    },
    {
      "rank": 5,
      "class_name": "A240008",
      "confidence": 0.0234,
      "percentage": "2.34%"
    }
  ]
}
```

---

### **Skema Respons JSON: Endpoint Komparasi (`/api/predict/all`)**

```json
{
  "filename": "sample_A250016.jpg",
  "total_processing_time_ms": 98.4,
  "results": {
    "svm": {
      "algorithm_id": "svm",
      "algorithm_name": "SVM + GLCM",
      "top_prediction": "A250016",
      "confidence": 0.6375,
      "percentage": "63.75%",
      "processing_time_ms": 14.2,
      "top_5": [
        { "rank": 1, "class_name": "A250016", "confidence": 0.6375, "percentage": "63.75%" },
        { "rank": 2, "class_name": "A250013", "confidence": 0.1210, "percentage": "12.10%" }
      ]
    },
    "rf": {
      "algorithm_id": "rf",
      "algorithm_name": "Random Forest + GLCM",
      "top_prediction": "A250016",
      "confidence": 0.5935,
      "percentage": "59.35%",
      "processing_time_ms": 16.5,
      "top_5": [
        { "rank": 1, "class_name": "A250016", "confidence": 0.5935, "percentage": "59.35%" }
      ]
    },
    "mobilenetv2": {
      "algorithm_id": "mobilenetv2",
      "algorithm_name": "MobileNetV2 (Transfer Learning)",
      "top_prediction": "A250016",
      "confidence": 0.4946,
      "percentage": "49.46%",
      "processing_time_ms": 67.7,
      "top_5": [
        { "rank": 1, "class_name": "A250016", "confidence": 0.4946, "percentage": "49.46%" }
      ]
    }
  }
}
```

---

### **Contoh Integrasi Frontend (JavaScript Fetch API)**

```javascript
// Siapkan berkas citra dalam objek FormData
const formData = new FormData();
formData.append("file", imageFile);

// 1. Memanggil salah satu algoritma (misal SVM + GLCM):
const singleResponse = await fetch("http://localhost:8000/api/predict/svm", {
  method: "POST",
  body: formData,
});
const singleResult = await singleResponse.json();
console.log("Prediksi:", singleResult.top_prediction, "Keyakinan:", singleResult.percentage);

// 2. Memanggil ketiga algoritma sekaligus untuk komparasi:
const compareResponse = await fetch("http://localhost:8000/api/predict/all", {
  method: "POST",
  body: formData,
});
const compareResult = await compareResponse.json();
console.log("Hasil SVM:", compareResult.results.svm.top_prediction);
console.log("Hasil Random Forest:", compareResult.results.rf.top_prediction);
console.log("Hasil MobileNetV2:", compareResult.results.mobilenetv2.top_prediction);
```

---

## Variabel Lingkungan (Environment Variables)

### **Backend (`server/.env` atau `server_render/.env`)**
```env
# Host dan Port layanan API
HOST=0.0.0.0
PORT=8000

# Path direktori model (default otomatis mencari di model_export)
MODEL_EXPORT_DIR=model_export

# Domain frontend yang diizinkan untuk CORS (gunakan * untuk mengizinkan semua origin)
CORS_ORIGINS=*
```

### **Frontend (`client/.env`)**
```env
# URL endpoint backend API FastAPI
VITE_API_URL=http://localhost:8000
```
Untuk tahap produksi di cloud, sesuaikan nilai `VITE_API_URL` dengan domain backend publik Anda (misalnya `https://handwriting-classification-api.onrender.com`).

---

## Kontribusi & Lisensi

Proyek ini dikembangkan untuk keperluan akademik dan penelitian komputasi citra digital / klasifikasi pola citra tulisan tangan mahasiswa.
