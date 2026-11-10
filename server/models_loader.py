import json
import logging
import os
from pathlib import Path
import time
from typing import Dict, List, Optional

import joblib
import numpy as np
from PIL import Image
import tensorflow as tf

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
        Path("server/model_export"),
        Path("model_export"),
    ]
    for d in possible_dirs:
        if d.exists() and (d / "classes.json").exists():
            return d

    raise FileNotFoundError("Direktori 'model_export' tidak ditemukan!")


class ModelManager:
    """
    Singleton-style manager untuk memuat model dan scaler ke memori saat startup,
    serta menyediakan fungsi inferensi untuk masing-masing algoritma.
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

    def load_all_models(self):
        self.export_dir = get_export_dir()
        logger.info(f"Memuat model dari direktori: {self.export_dir}")

        # 1. Muat pemetaan kelas (classes.json)
        classes_path = self.export_dir / "classes.json"
        with open(classes_path, "r", encoding="utf-8") as f:
            self.classes = json.load(f)
        # Urutkan berdasarkan index numerik 0, 1, 2, ...
        self.class_list = [self.classes[str(i)] for i in range(len(self.classes))]
        logger.info(f"Berhasil memuat {len(self.classes)} kelas mahasiswa.")

        # 2. Muat Scaler GLCM
        scaler_path = self.export_dir / "glcm_scaler.joblib"
        self.scaler = joblib.load(scaler_path)
        logger.info("Berhasil memuat GLCM Scaler.")

        # 3. Muat SVM Model
        svm_path = self.export_dir / "svm_glcm_final.joblib"
        self.svm_model = joblib.load(svm_path)
        logger.info("Berhasil memuat model SVM (GLCM).")

        # 4. Muat Random Forest Model
        rf_path = self.export_dir / "rf_glcm_final.joblib"
        self.rf_model = joblib.load(rf_path)
        logger.info("Berhasil memuat model Random Forest (GLCM).")

        # 5. Muat MobileNetV2 Model
        keras_path = self.export_dir / "mobilenetv2_final.keras"
        h5_path = self.export_dir / "mobilenetv2_final.h5"
        if keras_path.exists():
            self.mobilenet_model = tf.keras.models.load_model(keras_path)
            logger.info("Berhasil memuat model MobileNetV2 (.keras).")
        elif h5_path.exists():
            self.mobilenet_model = tf.keras.models.load_model(h5_path)
            logger.info("Berhasil memuat model MobileNetV2 (.h5).")
        else:
            raise FileNotFoundError("File model MobileNetV2 (.keras / .h5) tidak ditemukan!")

        # Warm-up MobileNetV2 untuk menghindari latency pada inferensi pertama
        dummy_input = np.zeros((1, 128, 128, 3), dtype=np.float32)
        _ = self.mobilenet_model.predict(dummy_input, verbose=0)

        self.is_loaded = True
        logger.info("Seluruh model berhasil diinisialisasi dan siap menerima request!")

    def _format_top_k(self, probabilities: np.ndarray, top_k: int = 5) -> List[PredictionCandidate]:
        """
        Mengurutkan probabilitas dan mengambil Top-K kandidat tertinggi.
        """
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
        if not self.is_loaded:
            raise RuntimeError("Model belum dimuat. Server belum siap.")

        t0 = time.perf_counter()
        # 1. Ekstraksi GLCM
        raw_features = extract_glcm_features(image)
        # 2. Standarisasi fitur
        scaled_features = self.scaler.transform(raw_features)
        # 3. Prediksi probabilitas
        probs = self.svm_model.predict_proba(scaled_features)[0]
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
        if not self.is_loaded:
            raise RuntimeError("Model belum dimuat. Server belum siap.")

        t0 = time.perf_counter()
        # 1. Ekstraksi GLCM (Random Forest dilatih dengan raw features)
        raw_features = extract_glcm_features(image)
        # 2. Prediksi probabilitas
        probs = self.rf_model.predict_proba(raw_features)[0]
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
        if not self.is_loaded:
            raise RuntimeError("Model belum dimuat. Server belum siap.")

        t0 = time.perf_counter()
        # 1. Preprocessing RGB & normalisasi
        tensor = preprocess_for_mobilenet(image)
        # 2. Prediksi Deep Learning
        probs = self.mobilenet_model.predict(tensor, verbose=0)[0]
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
