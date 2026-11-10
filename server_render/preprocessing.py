import io
from typing import List
import numpy as np
from PIL import Image
from skimage.feature import graycomatrix, graycoprops

TARGET_IMAGE_SIZE = (128, 128)
GLCM_PROPERTIES = ['contrast', 'dissimilarity', 'homogeneity', 'energy', 'correlation', 'ASM']
GLCM_DISTANCES = [1]
GLCM_ANGLES = [0, np.pi / 4, np.pi / 2, 3 * np.pi / 4]


def load_image_from_bytes(image_bytes: bytes) -> Image.Image:
    """
    Membaca byte citra dan memvalidasi integritas format gambar.
    """
    try:
        image = Image.open(io.BytesIO(image_bytes))
        image.load()
        return image
    except Exception as exc:
        raise ValueError(f"File yang diunggah bukan citra yang valid atau rusak: {exc}") from exc


def extract_glcm_features(image: Image.Image) -> np.ndarray:
    """
    Mengekstraksi 6 fitur tekstur GLCM (Contrast, Dissimilarity, Homogeneity, Energy, Correlation, ASM)
    pada citra grayscale berukuran 128x128 dengan d=1 dan 4 arah sudut.
    
    Returns:
        np.ndarray: Array 2D berdimensi (1, 6) berisi nilai rata-rata dari setiap fitur.
    """
    # 1. Konversi ke Grayscale ('L') & resize ke 128x128
    gray_img = image.convert('L').resize(TARGET_IMAGE_SIZE)
    img_arr = np.array(gray_img, dtype=np.uint8)

    # 2. Hitung matriks GLCM
    glcm = graycomatrix(
        img_arr,
        distances=GLCM_DISTANCES,
        angles=GLCM_ANGLES,
        levels=256,
        symmetric=True,
        normed=True
    )

    # 3. Ekstraksi nilai rata-rata dari 6 fitur statistik
    features: List[float] = [
        float(np.mean(graycoprops(glcm, prop)))
        for prop in GLCM_PROPERTIES
    ]

    # Dimensi (1, 6) untuk input model Scikit-Learn
    return np.array([features], dtype=np.float64)


def preprocess_for_mobilenet(image: Image.Image) -> np.ndarray:
    """
    Melakukan preprocessing citra RGB untuk inferensi MobileNetV2:
    - Konversi ke RGB
    - Resize ke (128, 128)
    - Normalisasi piksel ke rentang [0.0, 1.0] (div_255)
    - Menambahkan dimensi batch

    Returns:
        np.ndarray: Tensor berdimensi (1, 128, 128, 3) bertipe float32.
    """
    rgb_img = image.convert('RGB').resize(TARGET_IMAGE_SIZE)
    img_arr = np.array(rgb_img, dtype=np.float32) / 255.0
    return np.expand_dims(img_arr, axis=0)
