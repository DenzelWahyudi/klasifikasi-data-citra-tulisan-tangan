# Handwriting Classification API Server

Backend FastAPI untuk memproses citra tulisan tangan mahasiswa dan mengklasifikasikan kepemilikannya berdasarkan tiga algoritma (SVM + GLCM, Random Forest + GLCM, dan MobileNetV2).

---

## 🚀 Cara Menjalankan Server

1. **Pastikan berada di direktori backend:**
   ```bash
   cd server
   ```

2. **Install dependensi (jika belum):**
   ```bash
   pip install -r requirements.txt
   ```

3. **Jalankan FastAPI server menggunakan Uvicorn:**
   ```bash
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```
   Server akan aktif di `http://localhost:8000`. Dokumentasi interaktif Swagger UI tersedia di `http://localhost:8000/docs`.

---

## 📡 Daftar Endpoint API

Semua endpoint inferensi menerima request `multipart/form-data` dengan field file `file`.

| Method | Endpoint | Deskripsi |
|---|---|---|
| `GET` | `/` | Informasi root & ringkasan endpoint |
| `GET` | `/api/health` | Status kesiapan server & model yang dimuat |
| `GET` | `/api/classes` | Daftar 51 label kelas mahasiswa yang terdaftar |
| `POST` | `/api/predict/svm` | Prediksi menggunakan **Support Vector Machine (SVM) + GLCM** |
| `POST` | `/api/predict/rf` | Prediksi menggunakan **Random Forest + GLCM** |
| `POST` | `/api/predict/mobilenetv2` | Prediksi menggunakan **MobileNetV2 (Deep Learning)** |
| `POST` | `/api/predict/all` | Menjalankan **ketiga algoritma sekaligus** untuk komparasi |

---

## 📦 Struktur Respons JSON

### Endpoint Tunggal (`/api/predict/svm`, `/api/predict/rf`, `/api/predict/mobilenetv2`):
```json
{
  "algorithm_id": "mobilenetv2",
  "algorithm_name": "MobileNetV2 (Transfer Learning)",
  "top_prediction": "A250016",
  "confidence": 0.9421,
  "percentage": "94.21%",
  "processing_time_ms": 78.5,
  "top_5": [
    {
      "rank": 1,
      "class_name": "A250016",
      "confidence": 0.9421,
      "percentage": "94.21%"
    },
    {
      "rank": 2,
      "class_name": "A250013",
      "confidence": 0.0312,
      "percentage": "3.12%"
    }
  ]
}
```

### Endpoint Komparasi Seluruh Algoritma (`/api/predict/all`):
```json
{
  "filename": "tulisan_sample.png",
  "total_processing_time_ms": 156.8,
  "results": {
    "svm": { ... },
    "rf": { ... },
    "mobilenetv2": { ... }
  }
}
```

---

## 💻 Contoh Penggunaan dari Frontend (Fetch API)

```javascript
const formData = new FormData();
formData.append("file", imageFile);

// Panggil salah satu algoritma:
const response = await fetch("http://localhost:8000/api/predict/mobilenetv2", {
  method: "POST",
  body: formData,
});
const result = await response.json();
console.log(result.top_prediction, result.percentage);

// Atau panggil ketiga algoritma sekaligus:
const compareResponse = await fetch("http://localhost:8000/api/predict/all", {
  method: "POST",
  body: formData,
});
const compareResult = await compareResponse.json();
console.log(compareResult.results);
```
