from typing import Dict, List
from pydantic import BaseModel, Field


class PredictionCandidate(BaseModel):
    rank: int = Field(..., description="Peringkat kandidat (1 adalah yang tertinggi)")
    class_name: str = Field(..., description="Label/ID Mahasiswa")
    confidence: float = Field(..., description="Skor probabilitas (0.0 - 1.0)")
    percentage: str = Field(..., description="Persentase keyakinan (format: XX.XX%)")


class AlgorithmResult(BaseModel):
    algorithm_id: str = Field(..., description="Identifier algoritma ('svm', 'rf', 'mobilenetv2')")
    algorithm_name: str = Field(..., description="Nama lengkap algoritma")
    top_prediction: str = Field(..., description="Hasil prediksi kelas mahasiswa tertinggi")
    confidence: float = Field(..., description="Skor probabilitas prediksi tertinggi")
    percentage: str = Field(..., description="Persentase keyakinan prediksi tertinggi")
    processing_time_ms: float = Field(..., description="Waktu komputasi inferensi dalam milidetik")
    top_5: List[PredictionCandidate] = Field(..., description="5 kandidat teratas beserta skornya")


class AllAlgorithmsResponse(BaseModel):
    filename: str = Field(..., description="Nama file citra yang diunggah")
    total_processing_time_ms: float = Field(..., description="Total waktu pemrosesan seluruh algoritma")
    results: Dict[str, AlgorithmResult] = Field(..., description="Hasil inferensi dari masing-masing algoritma")


class ClassListResponse(BaseModel):
    total_classes: int = Field(..., description="Jumlah total kelas mahasiswa")
    classes: List[str] = Field(..., description="Daftar nama/ID kelas mahasiswa")


class HealthResponse(BaseModel):
    status: str = Field(..., description="Status operasional backend")
    loaded_models: Dict[str, bool] = Field(..., description="Status pemuatan tiap model")
    total_classes: int = Field(..., description="Jumlah kelas yang terdaftar")
