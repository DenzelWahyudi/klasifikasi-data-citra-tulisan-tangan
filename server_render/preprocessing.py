import io
from typing import List, Tuple, Union
import numpy as np
from PIL import Image
from skimage.feature import graycomatrix, graycoprops

TARGET_IMAGE_SIZE = (128, 128)
MOBILENET_IMAGE_SIZE = (224, 224)
GLCM_PROPERTIES = ['contrast', 'dissimilarity', 'homogeneity', 'energy', 'correlation', 'ASM']
GLCM_DISTANCES = [1]
GLCM_ANGLES = [0, np.pi / 4, np.pi / 2, 3 * np.pi / 4]
DEFAULT_BG_COLOR = (230, 230, 230)


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


def crop_text_roi(image: Image.Image, threshold: int = 210, pad: int = 10) -> Image.Image:
    """
    Memotong area kosong di sekitar tulisan tangan agar fokus pada goresan teks.
    """
    gray = image.convert('L')
    arr = np.array(gray)
    mask = arr < threshold
    if not np.any(mask):
        return image
    y_indices = np.where(mask.any(axis=1))[0]
    x_indices = np.where(mask.any(axis=0))[0]
    ymin = max(0, y_indices[0] - pad)
    ymax = min(arr.shape[0], y_indices[-1] + pad)
    xmin = max(0, x_indices[0] - pad)
    xmax = min(arr.shape[1], x_indices[-1] + pad)
    return image.crop((xmin, ymin, xmax, ymax))


def resize_with_letterbox(
    image: Image.Image,
    target_size: Tuple[int, int] = TARGET_IMAGE_SIZE,
    bg_color: Union[int, Tuple[int, int, int]] = DEFAULT_BG_COLOR
) -> Image.Image:
    """
    Mengubah ukuran citra dengan mempertahankan aspek rasio asli (letterbox),
    dan menempatkannya di tengah kanvas berukuran target_size dengan warna latar netral.
    """
    img_copy = image.copy()
    img_copy.thumbnail(target_size, Image.Resampling.LANCZOS)

    if img_copy.mode == 'L':
        fill_val = bg_color if isinstance(bg_color, int) else bg_color[0]
        canvas = Image.new('L', target_size, fill_val)
    else:
        fill_val = bg_color if isinstance(bg_color, tuple) else (bg_color, bg_color, bg_color)
        canvas = Image.new('RGB', target_size, fill_val)
        if img_copy.mode != 'RGB':
            img_copy = img_copy.convert('RGB')

    offset = ((target_size[0] - img_copy.size[0]) // 2, (target_size[1] - img_copy.size[1]) // 2)
    canvas.paste(img_copy, offset)
    return canvas


def extract_glcm_features(image: Image.Image) -> np.ndarray:
    """
    Mengekstraksi 24 fitur tekstur GLCM (6 properti Haralick x 4 orientasi sudut)
    pada citra grayscale berukuran 128x128 yang diproses dengan cropping ROI dan letterboxing.

    6 properti: Contrast, Dissimilarity, Homogeneity, Energy, Correlation, ASM
    4 sudut: 0, 45, 90, 135 derajat
    Total: 24 fitur tekstur untuk mempertahankan informasi arah dan kemiringan goresan.

    Returns:
        np.ndarray: Array 2D berdimensi (1, 24) bertipe float64.
    """
    # 1. Cropping ROI, letterbox ke 128x128 & konversi ke Grayscale ('L')
    cropped_img = crop_text_roi(image)
    lb_img = resize_with_letterbox(cropped_img, target_size=TARGET_IMAGE_SIZE, bg_color=230)
    gray_img = lb_img.convert('L')
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

    # 3. Ekstraksi 24 fitur (6 properti x 4 arah sudut)
    features: List[float] = []
    for prop in GLCM_PROPERTIES:
        val_matrix = graycoprops(glcm, prop)  # shape: (1, 4)
        for angle_idx in range(val_matrix.shape[1]):
            features.append(float(val_matrix[0, angle_idx]))

    # Dimensi (1, 24) untuk input model Scikit-Learn (SVM & Random Forest)
    return np.array([features], dtype=np.float64)


def preprocess_for_mobilenet(
    image: Image.Image,
    target_size: Tuple[int, int] = MOBILENET_IMAGE_SIZE
) -> np.ndarray:
    """
    Melakukan preprocessing citra RGB untuk inferensi MobileNetV2:
    - Cropping area teks (ROI)
    - Letterboxing ke ukuran target (default: 224, 224) dengan warna latar netral (230, 230, 230)
    - Konversi ke RGB
    - Normalisasi piksel ke rentang [-1.0, 1.0]
    - Menambahkan dimensi batch

    Returns:
        np.ndarray: Tensor berdimensi (1, H, W, 3) bertipe float32.
    """
    cropped_img = crop_text_roi(image)
    lb_img = resize_with_letterbox(cropped_img, target_size=target_size, bg_color=DEFAULT_BG_COLOR)
    rgb_img = lb_img.convert('RGB')
    img_arr = (np.array(rgb_img, dtype=np.float32) / 127.5) - 1.0
    return np.expand_dims(img_arr, axis=0)
