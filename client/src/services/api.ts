import type {
  AlgorithmResult,
  AllAlgorithmsResponse,
  HealthResponse,
  ClassListResponse,
} from '../types'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export async function checkServerHealth(): Promise<HealthResponse> {
  const res = await fetch(`${API_BASE}/api/health`, {
    headers: { Accept: 'application/json' },
  })
  if (!res.ok) {
    throw new Error(`Health check gagal dengan status ${res.status}`)
  }
  return res.json()
}

export async function getClassList(): Promise<ClassListResponse> {
  const res = await fetch(`${API_BASE}/api/classes`, {
    headers: { Accept: 'application/json' },
  })
  if (!res.ok) {
    throw new Error(`Gagal memuat daftar kelas dengan status ${res.status}`)
  }
  return res.json()
}

export async function predictSingleModel(
  modelId: 'svm' | 'rf' | 'mobilenetv2',
  file: File
): Promise<AlgorithmResult> {
  const formData = new FormData()
  formData.append('file', file)

  const res = await fetch(`${API_BASE}/api/predict/${modelId}`, {
    method: 'POST',
    body: formData,
  })

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(
      errorData.detail || `Prediksi model ${modelId} gagal (${res.status})`
    )
  }

  return res.json()
}

export async function predictAllModels(file: File): Promise<AllAlgorithmsResponse> {
  const formData = new FormData()
  formData.append('file', file)

  const res = await fetch(`${API_BASE}/api/predict/all`, {
    method: 'POST',
    body: formData,
  })

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(
      errorData.detail || `Prediksi gabungan gagal (${res.status})`
    )
  }

  return res.json()
}

export async function runPrediction(
  file: File,
  selectedModels: ('svm' | 'rf' | 'mobilenetv2')[]
): Promise<Record<string, AlgorithmResult>> {
  if (selectedModels.length === 0) {
    throw new Error('Pilih minimal satu model untuk melakukan klasifikasi.')
  }

  // Jika ketiga model dipilih, gunakan endpoint /api/predict/all untuk efisiensi
  if (
    selectedModels.length === 3 &&
    selectedModels.includes('svm') &&
    selectedModels.includes('rf') &&
    selectedModels.includes('mobilenetv2')
  ) {
    const allRes = await predictAllModels(file)
    return allRes.results
  }

  // Jika hanya sebagian model dipilih, panggil endpoint secara paralel
  const promises = selectedModels.map(async (modelId) => {
    const result = await predictSingleModel(modelId, file)
    return { modelId, result }
  })

  const resultsArray = await Promise.all(promises)
  const resultsMap: Record<string, AlgorithmResult> = {}
  resultsArray.forEach(({ modelId, result }) => {
    resultsMap[modelId] = result
  })

  return resultsMap
}
