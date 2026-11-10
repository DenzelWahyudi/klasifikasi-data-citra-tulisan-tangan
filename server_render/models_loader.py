import gc
import json
import logging
import os
from pathlib import Path
import threading
import time
from typing import Dict, List, Optional

import joblib
import numpy as np
from PIL import Image

from preprocessing import extract_glcm_features, preprocess_for_mobilenet
from schemas import AlgorithmResult, AllAlgorithmsResponse, PredictionCandidate

logger = logging.getLogger("uvicorn")


def get_export_dir() -> Path:
    """
    Menemukan direktori model_export berdasarkan lokasi script atau environment variable.
    """
    env_dir = os.environ.get("MODEL_EXPORT_DIR")
    if env_dir:
        p = Path(env_dir)
        if p.exists() and (p / "classes.json").exists():
            return p
        p_server = Path(__file__).resolve().parent / p
        if p_server.exists() and (p_server / "classes.json").exists():
            return p_server

    possible_dirs = [
        Path(__file__).resolve().parent / "model_export",
        Path(__file__).resolve().parent.parent / "model_export",
        Path("server_render/model_export"),
        Path("server/model_export"),
        Path("model_export"),
    ]
    for d in possible_dirs:
        if d.exists() and (d / "classes.json").exists():
            return d

    raise FileNotFoundError("Direktori 'model_export' tidak ditemukan!")


class ModelManager:
    """
    Model Manager yang dioptimalkan untuk Render Free Tier (RAM 512MB).
    Menerapkan Lazy Loading (On-Demand Loading) sehingga model-model berat
    hanya dimuat ke RAM saat pertama kali endpoint dipanggil.
    """

    def __init__(self):
        self.export_dir: Optional[Path] = None
        self.classes: Dict[str, str] = {}
        self.class_list: List[str] = []
        self.scaler = None
        self.svm_model = None
        self.rf_model = None
        self.mobilenet_model = None
        self.is_loaded: bool = False
        self._lock = threading.Lock()

    def ensure_metadata_loaded(self):
        """
        Memuat metadata ringan (classes, scaler) yang hanya memakan sedikit RAM (~10-20MB).
        Ini dipanggil saat startup server agar server langsung siap dan port segera terbuka.
        """
        if self.is_loaded:
            return

        with self._lock:
            if self.is_loaded:
                return

            self.export_dir = get_export_dir()
            logger.info(f"[Render Optimized] Memuat metadata dari: {self.export_dir}")

            # 1. Muat pemetaan kelas (classes.json)
            classes_path = self.export_dir / "classes.json"
            with open(classes_path, "r", encoding="utf-8") as f:
                self.classes = json.load(f)
            self.class_list = [self.classes[str(i)] for i in range(len(self.classes))]
            logger.info(f"Berhasil memuat {len(self.classes)} kelas mahasiswa.")

            # 2. Muat Scaler GLCM
            scaler_path = self.export_dir / "glcm_scaler.joblib"
            self.scaler = joblib.load(scaler_path)
            logger.info("Berhasil memuat GLCM Scaler.")

            self.is_loaded = True
            logger.info("Metadata & Scaler siap. Model berat (SVM, RF, MobileNet) siap dimuat secara On-Demand.")

    def load_all_models(self):
        """
        Pada versi Render ini, startup hanya memuat metadata agar penggunaan RAM
        tetap sangat rendah (<60MB) dan proses deploy lolos dari batas 512MB RAM.
        """
        self.ensure_metadata_loaded()

    def get_svm(self):
        """Memuat model SVM secara lazy (hanya saat dibutuhkan)."""
        if self.svm_model is None:
            with self._lock:
                if self.svm_model is None:
                    self.ensure_metadata_loaded()
                    svm_path = self.export_dir / "svm_glcm_final.joblib"
                    logger.info("Memuat model SVM (GLCM) ke memori...")
                    self.svm_model = joblib.load(svm_path)
                    logger.info("Model SVM (GLCM) berhasil dimuat.")
        return self.svm_model

    def get_rf(self):
        """Memuat model Random Forest secara lazy (hanya saat dibutuhkan)."""
        if self.rf_model is None:
            with self._lock:
                if self.rf_model is None:
                    self.ensure_metadata_loaded()
                    rf_path = self.export_dir / "rf_glcm_final.joblib"
                    logger.info("Memuat model Random Forest (GLCM) ke memori...")
                    self.rf_model = joblib.load(rf_path)
                    logger.info("Model Random Forest (GLCM) berhasil dimuat.")
        return self.rf_model

    def get_mobilenet(self):
        """Memuat model MobileNetV2 secara lazy (hanya saat dibutuhkan)."""
        if self.mobilenet_model is None:
            with self._lock:
                if self.mobilenet_model is None:
                    self.ensure_metadata_loaded()
                    keras_path = self.export_dir / "mobilenetv2_final.keras"
                    h5_path = self.export_dir / "mobilenetv2_final.h5"

                    # Import tensorflow hanya saat dibutuhkan untuk menghemat RAM saat startup
                    import tensorflow as tf

                    logger.info("Memuat model MobileNetV2 (CPU) ke memori...")
                    if keras_path.exists():
                        self.mobilenet_model = tf.keras.models.load_model(keras_path)
                        logger.info("Berhasil memuat model MobileNetV2 (.keras).")
                    elif h5_path.exists():
                        self.mobilenet_model = tf.keras.models.load_model(h5_path)
                        logger.info("Berhasil memuat model MobileNetV2 (.h5).")
                    else:
                        raise FileNotFoundError("File model MobileNetV2 tidak ditemukan!")

                    # Warm-up satu kali
                    dummy = np.zeros((1, 128, 128, 3), dtype=np.float32)
                    _ = self.mobilenet_model.predict(dummy, verbose=0)
        return self.mobilenet_model

    def _format_top_k(self, probabilities: np.ndarray, top_k: int = 5) -> List[PredictionCandidate]:
        sorted_indices = np.argsort(probabilities)[::-1][:top_k]
        candidates = []
        for rank, idx in enumerate(sorted_indices, start=1):
            class_name = self.classes.get(str(idx), f"Unknown-{idx}")
            prob = float(probabilities[idx])
            candidates.append(
                PredictionCandidate(
                    rank=rank,
                    class_name=class_name,
                    confidence=round(prob, 4),
                    percentage=f"{prob * 100:.2f}%",
                )
            )
        return candidates

    def predict_svm(self, image: Image.Image) -> AlgorithmResult:
        self.ensure_metadata_loaded()
        svm_model = self.get_svm()

        t0 = time.perf_counter()
        raw_features = extract_glcm_features(image)
        scaled_features = self.scaler.transform(raw_features)
        probs = svm_model.predict_proba(scaled_features)[0]
        elapsed_ms = (time.perf_counter() - t0) * 1000

        top_idx = int(np.argmax(probs))
        top_name = self.classes.get(str(top_idx), f"Unknown-{top_idx}")
        top_prob = float(probs[top_idx])

        return AlgorithmResult(
            algorithm_id="svm",
            algorithm_name="Support Vector Machine (SVM) + GLCM",
            top_prediction=top_name,
            confidence=round(top_prob, 4),
            percentage=f"{top_prob * 100:.2f}%",
            processing_time_ms=round(elapsed_ms, 2),
            top_5=self._format_top_k(probs, top_k=5),
        )

    def predict_rf(self, image: Image.Image) -> AlgorithmResult:
        self.ensure_metadata_loaded()
        rf_model = self.get_rf()

        t0 = time.perf_counter()
        raw_features = extract_glcm_features(image)
        probs = rf_model.predict_proba(raw_features)[0]
        elapsed_ms = (time.perf_counter() - t0) * 1000

        top_idx = int(np.argmax(probs))
        top_name = self.classes.get(str(top_idx), f"Unknown-{top_idx}")
        top_prob = float(probs[top_idx])

        return AlgorithmResult(
            algorithm_id="rf",
            algorithm_name="Random Forest + GLCM",
            top_prediction=top_name,
            confidence=round(top_prob, 4),
            percentage=f"{top_prob * 100:.2f}%",
            processing_time_ms=round(elapsed_ms, 2),
            top_5=self._format_top_k(probs, top_k=5),
        )

    def predict_mobilenet(self, image: Image.Image) -> AlgorithmResult:
        self.ensure_metadata_loaded()
        mobilenet_model = self.get_mobilenet()

        t0 = time.perf_counter()
        tensor = preprocess_for_mobilenet(image)
        probs = mobilenet_model.predict(tensor, verbose=0)[0]
        elapsed_ms = (time.perf_counter() - t0) * 1000

        top_idx = int(np.argmax(probs))
        top_name = self.classes.get(str(top_idx), f"Unknown-{top_idx}")
        top_prob = float(probs[top_idx])

        return AlgorithmResult(
            algorithm_id="mobilenetv2",
            algorithm_name="MobileNetV2 (Transfer Learning)",
            top_prediction=top_name,
            confidence=round(top_prob, 4),
            percentage=f"{top_prob * 100:.2f}%",
            processing_time_ms=round(elapsed_ms, 2),
            top_5=self._format_top_k(probs, top_k=5),
        )

    def predict_all(self, image: Image.Image, filename: str) -> AllAlgorithmsResponse:
        t0 = time.perf_counter()
        svm_res = self.predict_svm(image)
        rf_res = self.predict_rf(image)
        mb_res = self.predict_mobilenet(image)
        total_elapsed_ms = (time.perf_counter() - t0) * 1000

        # Bersihkan memori residual
        gc.collect()

        return AllAlgorithmsResponse(
            filename=filename,
            total_processing_time_ms=round(total_elapsed_ms, 2),
            results={
                "svm": svm_res,
                "rf": rf_res,
                "mobilenetv2": mb_res,
            },
        )


model_manager = ModelManager()
