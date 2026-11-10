from contextlib import asynccontextmanager
import logging
import os
from pathlib import Path
from typing import Dict, List

from fastapi import FastAPI, File, HTTPException, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image

from models_loader import model_manager
from preprocessing import load_image_from_bytes
from schemas import (
    AlgorithmResult,
    AllAlgorithmsResponse,
    ClassListResponse,
    HealthResponse,
)

logger = logging.getLogger("uvicorn")

# Memuat konfigurasi dari file .env jika ada
env_path = Path(__file__).resolve().parent / ".env"
if env_path.exists():
    try:
        from dotenv import load_dotenv

        load_dotenv(dotenv_path=env_path)
    except ImportError:
        # Fallback parsing sederhana jika python-dotenv tidak terpasang
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1)
                    k = k.strip()
                    v = v.strip().strip("\"'")
                    if k not in os.environ:
                        os.environ[k] = v


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifecycle event: Memuat semua model machine learning & deep learning
    sekali saat aplikasi pertama kali dijalankan.
    """
    logger.info("Memulai inisialisasi model inferensi...")
    try:
        model_manager.load_all_models()
    except Exception as exc:
        logger.error(f"Gagal memuat model: {exc}")
        raise exc
    yield
    logger.info("Mematikan server dan membersihkan resource...")


app = FastAPI(
    title="Handwriting Classification API - Klasifikasi Citra Tulisan Tangan Mahasiswa",
    description=(
        "Backend FastAPI untuk klasifikasi citra tulisan tangan mahasiswa "
        "menggunakan 3 algoritma: SVM + GLCM, Random Forest + GLCM, dan MobileNetV2."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

# Konfigurasi CORS agar frontend (React/Vite) dapat mengakses API
cors_origins_env = os.environ.get("CORS_ORIGINS", "*")
if cors_origins_env.strip() == "*":
    allowed_origins = ["*"]
else:
    allowed_origins = [o.strip() for o in cors_origins_env.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


async def validate_and_read_image(file: UploadFile) -> Image.Image:
    """
    Memvalidasi file upload dan mengonversinya menjadi objek PIL Image.
    """
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nama file tidak valid.",
        )

    # Validasi content-type jika tersedia
    if file.content_type and not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Tipe file '{file.content_type}' bukan format gambar yang valid.",
        )

    content = await file.read()
    if not content or len(content) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File yang diunggah kosong.",
        )

    try:
        image = load_image_from_bytes(content)
        return image
    except ValueError as val_err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(val_err),
        ) from val_err
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Terjadi kesalahan saat memproses citra: {exc}",
        ) from exc


@app.get("/", summary="Root Status")
def root():
    return {
        "service": "Handwriting Classification API",
        "version": "1.0.0",
        "endpoints": {
            "svm": "POST /api/predict/svm",
            "rf": "POST /api/predict/rf",
            "mobilenetv2": "POST /api/predict/mobilenetv2",
            "all": "POST /api/predict/all",
            "classes": "GET /api/classes",
            "health": "GET /api/health",
            "docs": "GET /docs",
        },
    }


@app.get("/api/health", response_model=HealthResponse, summary="Health Check")
def health_check():
    loaded_status: Dict[str, bool] = {
        "scaler": model_manager.scaler is not None,
        "svm": model_manager.svm_model is not None,
        "rf": model_manager.rf_model is not None,
        "mobilenetv2": model_manager.mobilenet_model is not None,
    }
    return HealthResponse(
        status="ok" if model_manager.is_loaded else "initializing",
        loaded_models=loaded_status,
        total_classes=len(model_manager.classes),
    )


@app.get("/api/classes", response_model=ClassListResponse, summary="Daftar Kelas Mahasiswa")
def get_classes():
    """
    Mengembalikan daftar seluruh kelas/ID mahasiswa yang terdaftar pada model.
    """
    return ClassListResponse(
        total_classes=len(model_manager.class_list),
        classes=model_manager.class_list,
    )


@app.post(
    "/api/predict/svm",
    response_model=AlgorithmResult,
    summary="Prediksi menggunakan SVM + GLCM",
)
async def predict_svm_endpoint(
    file: UploadFile = File(..., description="File citra tulisan tangan (PNG/JPG/JPEG)")
):
    """
    Menerima citra tulisan tangan, mengekstraksi fitur tekstur GLCM,
    dan memprediksi kelas mahasiswa menggunakan model Support Vector Machine (SVM).
    """
    image = await validate_and_read_image(file)
    try:
        result = model_manager.predict_svm(image)
        return result
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Inferensi SVM gagal: {exc}",
        ) from exc


@app.post(
    "/api/predict/rf",
    response_model=AlgorithmResult,
    summary="Prediksi menggunakan Random Forest + GLCM",
)
async def predict_rf_endpoint(
    file: UploadFile = File(..., description="File citra tulisan tangan (PNG/JPG/JPEG)")
):
    """
    Menerima citra tulisan tangan, mengekstraksi fitur tekstur GLCM,
    dan memprediksi kelas mahasiswa menggunakan model Random Forest.
    """
    image = await validate_and_read_image(file)
    try:
        result = model_manager.predict_rf(image)
        return result
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Inferensi Random Forest gagal: {exc}",
        ) from exc


@app.post(
    "/api/predict/mobilenetv2",
    response_model=AlgorithmResult,
    summary="Prediksi menggunakan MobileNetV2 (Deep Learning)",
)
async def predict_mobilenet_endpoint(
    file: UploadFile = File(..., description="File citra tulisan tangan (PNG/JPG/JPEG)")
):
    """
    Menerima citra tulisan tangan, melakukan resize RGB ke 128x128 dan normalisasi,
    lalu memprediksi kelas mahasiswa menggunakan model Deep Learning MobileNetV2.
    """
    image = await validate_and_read_image(file)
    try:
        result = model_manager.predict_mobilenet(image)
        return result
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Inferensi MobileNetV2 gagal: {exc}",
        ) from exc


@app.post(
    "/api/predict/all",
    response_model=AllAlgorithmsResponse,
    summary="Prediksi menggunakan Ketiga Algoritma Sekaligus",
)
async def predict_all_endpoint(
    file: UploadFile = File(..., description="File citra tulisan tangan (PNG/JPG/JPEG)")
):
    """
    Menerima citra tulisan tangan dan menjalankan ketiga algoritma secara bersamaan
    (SVM, Random Forest, MobileNetV2) untuk komparasi hasil dan tingkat keyakinan.
    """
    image = await validate_and_read_image(file)
    try:
        result = model_manager.predict_all(image, filename=file.filename or "uploaded_image")
        return result
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Inferensi gagal: {exc}",
        ) from exc


if __name__ == "__main__":
    import uvicorn

    host = os.environ.get("HOST", "0.0.0.0")
    port = int(os.environ.get("PORT", 8000))

    uvicorn.run("main:app", host=host, port=port, reload=True)
