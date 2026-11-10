# Handwriting Classification API Server (Render Optimized)

Versi khusus dari Backend FastAPI yang telah dioptimalkan untuk berjalan di **Render Free Tier (RAM 512MB)** tanpa terkena *Out Of Memory (OOM)*.

---

## ⚡ Optimasi Khusus Render

1. **`tensorflow-cpu`**: Menggunakan TensorFlow versi CPU sehingga tidak memuat overhead CUDA/GPU (menghemat ~150–200 MB RAM).
2. **Lazy Loading (On-Demand)**: Saat server startup, sistem hanya memuat metadata ringan (`classes.json` dan scaler). Server menyala instan (<2 detik) dan port langsung terbuka. Model-model besar baru dimuat saat endpoint terkait dipanggil pertama kali.
3. **Pembersihan Memori Otomatis**: Menjalankan garbage collector (`gc.collect()`) setelah prediksi inferensi untuk mencegah akumulasi memori di batas 512MB RAM.

---

## 🚀 Konfigurasi di Dashboard Render

Saat membuat **Web Service** baru di Render:

| Pengaturan | Nilai |
|---|---|
| **Root Directory** | `server_render` |
| **Runtime** | `Python 3` |
| **Build Command** | `pip install --no-cache-dir -r requirements.txt` |
| **Start Command** | `uvicorn main:app --host 0.0.0.0 --port $PORT` |

### Environment Variables di Render:
| Key | Value | Keterangan |
|---|---|---|
| `PYTHON_VERSION` | `3.11.8` | **Sangat Direkomendasikan** untuk kompatibilitas TensorFlow & Scikit-Learn |
| `CORS_ORIGINS` | `*` | Atau domain frontend Anda jika ingin dibatasi |

---

## 📡 Daftar Endpoint API

| Method | Endpoint | Deskripsi |
|---|---|---|
| `GET` | `/` | Informasi root & ringkasan endpoint |
| `GET` | `/api/health` | Status kesiapan server & status pemuatan model |
| `GET` | `/api/classes` | Daftar 51 label kelas mahasiswa yang terdaftar |
| `POST` | `/api/predict/svm` | Prediksi menggunakan **SVM + GLCM** |
| `POST` | `/api/predict/rf` | Prediksi menggunakan **Random Forest + GLCM** |
| `POST` | `/api/predict/mobilenetv2` | Prediksi menggunakan **MobileNetV2 (CPU)** |
| `POST` | `/api/predict/all` | Menjalankan **ketiga algoritma sekaligus** |
