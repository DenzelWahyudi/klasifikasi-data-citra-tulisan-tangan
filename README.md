# 🖋️ Klasifikasi Data Citra Tulisan Tangan Mahasiswa

Sistem *end-to-end* berbasis Web dan REST API untuk mengidentifikasi kepemilikan citra tulisan tangan mahasiswa di antara **51 kelas identitas** menggunakan pendekatan multi-algoritma Machine Learning klasik (**SVM** dan **Random Forest** dengan fitur tekstur **GLCM**) serta Deep Learning (**MobileNetV2 Transfer Learning**).

---

## 📌 Daftar Isi

- [Tentang Proyek](#-tentang-proyek)
- [Teknologi yang Digunakan](#-teknologi-yang-digunakan)
- [Hasil Eksperimen & Evaluasi Model](#-hasil-eksperimen--evaluasi-model)
- [Fitur Utama Aplikasi](#-fitur-utama-aplikasi)
- [Struktur Repositori](#-struktur-repositori)
- [Panduan Menjalankan Aplikasi](#-panduan-menjalankan-aplikasi)
  - [1. Prasyarat](#1-prasyarat)
  - [2. Menjalankan Backend API (FastAPI)](#2-menjalankan-backend-api-fastapi)
  - [3. Menjalankan Frontend Web (React + Vite)](#3-menjalankan-frontend-web-react--vite)
- [Dokumentasi REST API](#-dokumentasi-rest-api)
- [Variabel Lingkungan (Environment Variables)](#-variabel-lingkungan-environment-variables)

---

## 📖 Tentang Proyek

Repositori ini memuat implementasi lengkap penelitian dan aplikasi komputasi citra digital untuk klasifikasi tulisan tangan:
1. **Eksplorasi & Pelatihan Model**: Notebook Jupyter (`UAS_Klasifikasi_Data_Citra_Export.ipynb`) yang mendokumentasikan pemrosesan awal dataset citra, ekstraksi fitur tekstur GLCM Haralick, pengujian 5-Fold Cross Validation, komparasi metrik, dan ekspor model terstandarisasi.
2. **Backend API Server**: Layanan inferensi berkinerja tinggi berbasis FastAPI yang memuat model ke memori (*preloaded in-memory cache*) dan menyediakan endpoint prediksi cepat.
3. **Frontend Web Interface**: Antarmuka web modern bergaya editorial minimalis (terinspirasi dari Midday dan Tailscale) yang memungkinkan pengguna mengunggah citra tulisan tangan, memilih algoritma, dan membandingkan hasil prediksi secara interaktif.

Sistem dilatih untuk mengenali **51 kelas identitas mahasiswa** (misalnya `A220199`, `A240008`, `A240029`, hingga `A250052`).

---

## 🛠️ Teknologi yang Digunakan

### **Backend & Machine Learning**
- **Python 3.10+**
- **FastAPI** & **Uvicorn** (REST API asynchronous berkecepatan tinggi)
- **Scikit-Learn** & **Joblib** (Implementasi SVM, Random Forest, StandardScaler, LabelEncoder)
- **Scikit-Image** (Ekstraksi fitur Gray-Level Co-occurrence Matrix / GLCM)
- **TensorFlow** / **Keras** (Arsitektur MobileNetV2 pre-trained ImageNet)
- **Pillow (PIL)** & **NumPy** (Manipulasi citra dan pemrosesan array)

### **Frontend**
- **React 19** & **TypeScript**
- **Vite** (Build tool dan dev server)
- **Tailwind CSS v4** (Desain UI responsif & typography modern)
- **Lucide React** (Ikon antarmuka)

---

## 📊 Hasil Eksperimen & Evaluasi Model

Seluruh model dievaluasi menggunakan metode **5-Fold Cross Validation** pada data citra berukuran $128 \times 128$ piksel. Fitur tekstur GLCM diekstrak menggunakan 6 properti Haralick (*Contrast, Dissimilarity, Homogeneity, Energy, Correlation, ASM*) pada jarak $d = 1$ dan 4 orientasi sudut ($0^\circ, 45^\circ, 90^\circ, 135^\circ$), menghasilkan 24 fitur per citra.

### **Tabel Rekapitulasi Metrik Evaluasi (5-Fold CV)**

| Nama Algoritma | Rata-Rata Precision | Rata-Rata Recall | Rata-Rata Akurasi | Rata-Rata F1-Score | Waktu Pelatihan / Fold |
|:---|:---:|:---:|:---:|:---:|:---:|
| **Algoritma 1: SVM + GLCM (RBF)** | 58.12% | 57.68% | **57.69%** | 56.09% | ~0.14 detik |
| **Algoritma 2: Random Forest + GLCM (100 Trees)** | 52.04% | 52.32% | **52.48%** | 51.12% | ~1.04 detik |
| **Arsitektur Deep Learning: MobileNetV2** | **79.68%** | **75.95%** | **76.17%** | **75.50%** | ~27.77 detik |

> **Catatan:**
> - Ekstraksi fitur GLCM membutuhkan total waktu komputasi **1.122,21 detik (~18,7 menit)** untuk keseluruhan dataset.
> - **MobileNetV2** menghasilkan performa tertinggi (Akurasi **76.17%**, F1-Score **75.50%**) karena kemampuannya mengekstrak representasi spasial hierarkis secara mendalam langsung dari piksel warna citra.

---

## ✨ Fitur Utama Aplikasi

- **Multi-Model Selector & Toggle**: Fleksibilitas memilih salah satu algoritma atau menjalankan ketiga model sekaligus.
- **Analisis Konsensus Otomatis**: Banner ringkasan yang mengevaluasi apakah model mencapai kesepakatan mutlak (*unanimous agreement*), konsensus mayoritas, atau hasil yang terbagi (*split decision*).
- **Top-5 Confidence Ranking**: Menampilkan 5 kandidat kelas teratas beserta persentase keyakinan dan visualisasi bilah progress.
- **Latency Monitoring**: Menampilkan waktu komputasi inferensi (*processing time*) dalam satuan milidetik (ms).
- **Pemilih Sampel Siap Pakai**: Pilihan cepat (*quick chips*) untuk menguji sampel citra tulisan tangan tanpa perlu mengunggah file manual.
- **Classes Drawer**: Panel samping interaktif untuk mencari dan menelusuri seluruh 51 daftar identitas mahasiswa yang terdaftar dalam model.
- **Health Indicator & Offline Fallback**: Indikator status koneksi API di header dengan petunjuk perintah terminal jika server lokal belum dijalankan.

---

## 📁 Struktur Repositori

```text
klasifikasi-data-citra-tulisan-tangan/
├── client/                               # Frontend web (React 19 + TypeScript + Vite)
│   ├── public/
│   │   └── samples/                      # Citra sampel untuk pengetesan di browser
│   ├── src/
│   │   ├── components/                   # Komponen modular UI (Header, Uploader, Cards, Drawer)
│   │   ├── services/                     # Layanan pemanggilan REST API (api.ts)
│   │   ├── App.tsx                       # Halaman utama aplikasi
│   │   ├── constants.ts                  # Konfigurasi model dan metadata sampel
│   │   └── types.ts                      # Definisi tipe data TypeScript
│   ├── .env.example                      # Contoh konfigurasi URL API frontend
│   └── package.json
│
├── server/                               # Backend REST API (FastAPI)
│   ├── model_export/                     # Bobot model & metadata hasil pelatihan
│   │   ├── classes.json                  # Pemetaan 51 label kelas mahasiswa
│   │   ├── glcm_scaler.joblib            # StandardScaler untuk fitur GLCM
│   │   ├── label_encoder.joblib          # LabelEncoder indeks ke string nama kelas
│   │   ├── metadata.json                 # Konfigurasi ukuran input citra & parameter GLCM
│   │   ├── mobilenetv2_final.keras       # Model Deep Learning MobileNetV2
│   │   ├── mobilenetv2_final.h5          # Backup format H5 MobileNetV2
│   │   ├── rf_glcm_final.joblib          # Model Random Forest Classifier
│   │   └── svm_glcm_final.joblib         # Model SVM Classifier (RBF)
│   ├── main.py                           # Entrypoint aplikasi FastAPI & routing
│   ├── models_loader.py                  # Singleton loader & in-memory model manager
│   ├── preprocessing.py                  # Ekstraksi fitur GLCM & normalisasi piksel
│   ├── schemas.py                        # Skema validasi Pydantic
│   ├── requirements.txt                  # Dependensi pustaka Python
│   └── .env.example                      # Contoh variabel lingkungan server
│
├── design-reference/                     # Referensi desain visual antarmuka
├── UAS_Klasifikasi_Data_Citra_Export.ipynb # Notebook eksperimen, pelatihan, & ekspor model
├── AGENTS.md                             # Pedoman aturan operasional AI Assistant
└── README.md                             # Dokumentasi utama proyek
```

---

## 🚀 Panduan Menjalankan Aplikasi

### 1. Prasyarat

Pastikan perangkat Anda telah terpasang:
- **Python 3.10** atau lebih baru
- **Node.js 18** atau lebih baru (disertai `npm`)
- **Git**

---

### 2. Menjalankan Backend API (FastAPI)

1. Buka terminal dan masuk ke direktori `server`:
   ```bash
   cd server
   ```

2. Buat dan aktifkan *virtual environment* Python:
   ```bash
   # Windows (PowerShell):
   python -m venv venv
   .\venv\Scripts\Activate.ps1

   # Linux / macOS:
   python3 -m venv venv
   source venv/bin/activate
   ```

3. Pasang seluruh dependensi:
   ```bash
   pip install -r requirements.txt
   ```

4. *(Opsional)* Salin file variabel lingkungan:
   ```bash
   cp .env.example .env
   ```

5. Jalankan server Uvicorn:
   ```bash
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

Server akan aktif di `http://localhost:8000`. Dokumentasi interaktif Swagger UI dapat diakses langsung melalui:
👉 **[http://localhost:8000/docs](http://localhost:8000/docs)**

---

### 3. Menjalankan Frontend Web (React + Vite)

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
   cp .env.example .env
   ```
   Pastikan variabel `VITE_API_URL` mengarah ke backend FastAPI (default: `http://localhost:8000`).

4. Jalankan server pengembangan Vite:
   ```bash
   npm run dev
   ```

5. Buka peramban (browser) dan akses alamat lokal yang ditampilkan (biasanya **`http://localhost:5173`**).

---

## 📡 Dokumentasi REST API

Seluruh endpoint inferensi menerima request `POST` berformat `multipart/form-data` dengan field berkas citra `file`.

| Method | Endpoint | Deskripsi |
|:---:|:---|:---|
| `GET` | `/` | Root endpoint informasi API |
| `GET` | `/api/health` | Cek status kesehatan server dan ketersediaan model di memori |
| `GET` | `/api/classes` | Mengambil daftar 51 identitas kelas mahasiswa yang dikenali |
| `POST` | `/api/predict/svm` | Prediksi menggunakan **Support Vector Machine (SVM) + GLCM** |
| `POST` | `/api/predict/rf` | Prediksi menggunakan **Random Forest + GLCM** |
| `POST` | `/api/predict/mobilenetv2` | Prediksi menggunakan **MobileNetV2 (Deep Learning)** |
| `POST` | `/api/predict/all` | Menjalankan ketiga algoritma sekaligus untuk komparasi lengkap |

### **Contoh Respons Prediksi Komparasi (`/api/predict/all`)**

```json
{
  "filename": "sample_1.jpg",
  "total_processing_time_ms": 112.4,
  "results": {
    "svm": {
      "algorithm_id": "svm",
      "algorithm_name": "SVM + GLCM",
      "top_prediction": "A250016",
      "confidence": 0.584,
      "percentage": "58.40%",
      "processing_time_ms": 14.2,
      "top_5": [
        { "rank": 1, "class_name": "A250016", "confidence": 0.584, "percentage": "58.40%" },
        { "rank": 2, "class_name": "A250013", "confidence": 0.121, "percentage": "12.10%" }
      ]
    },
    "rf": {
      "algorithm_id": "rf",
      "algorithm_name": "Random Forest + GLCM",
      "top_prediction": "A250016",
      "confidence": 0.49,
      "percentage": "49.00%",
      "processing_time_ms": 16.5,
      "top_5": [...]
    },
    "mobilenetv2": {
      "algorithm_id": "mobilenetv2",
      "algorithm_name": "MobileNetV2 (Transfer Learning)",
      "top_prediction": "A250016",
      "confidence": 0.9421,
      "percentage": "94.21%",
      "processing_time_ms": 81.7,
      "top_5": [...]
    }
  }
}
```

---

## ⚙️ Variabel Lingkungan (Environment Variables)

### **Server (`server/.env`)**
```env
HOST=0.0.0.0
PORT=8000
MODEL_EXPORT_DIR=model_export
CORS_ORIGINS=*
```

### **Client (`client/.env`)**
```env
VITE_API_URL=http://localhost:8000
```
Untuk deployment produksi, arahkan `VITE_API_URL` ke domain backend publik Anda (misalnya `https://api-kamu.onrender.com`).

---

## 👥 Kontribusi & Lisensi

Proyek ini dikembangkan untuk keperluan akademik dan penelitian komputasi citra digital / klasifikasi pola tulisan tangan mahasiswa.
