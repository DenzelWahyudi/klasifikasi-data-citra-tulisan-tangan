import { useState, useEffect, useRef } from 'react'
import {
  Sparkles,
  ArrowRight,
  AlertTriangle,
  RefreshCw,
  Terminal,
  CheckCircle,
  RotateCcw,
} from 'lucide-react'
import { Header } from './components/Header'
import { ModelSelector } from './components/ModelSelector'
import { ImageUploader } from './components/ImageUploader'
import { PredictionCard } from './components/PredictionCard'
import { ConsensusBanner } from './components/ConsensusBanner'
import { ClassesDrawer } from './components/ClassesDrawer'
import { AVAILABLE_MODELS } from './constants'
import {
  checkServerHealth,
  getClassList,
  runPrediction,
} from './services/api'
import type { AlgorithmResult, HealthResponse } from './types'

export function App() {
  // State pilihan model: Default belum memilih model apapun
  const [selectedModels, setSelectedModels] = useState<
    ('svm' | 'rf' | 'mobilenetv2')[]
  >([])

  // State citra
  const [currentFile, setCurrentFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  // State inferensi & hasil
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<Record<string, AlgorithmResult> | null>(
    null
  )
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // State backend & kelas
  const [backendHealth, setBackendHealth] = useState<HealthResponse | null>(null)
  const [isCheckingHealth, setIsCheckingHealth] = useState(false)
  const [classesList, setClassesList] = useState<string[]>([])
  const [isClassesOpen, setIsClassesOpen] = useState(false)

  const resultsRef = useRef<HTMLDivElement>(null)

  // Muat status health dan daftar kelas secara asinkron saat komponen dimuat
  useEffect(() => {
    let ignore = false
    async function loadInitialData() {
      try {
        const [healthRes, classesRes] = await Promise.allSettled([
          checkServerHealth(),
          getClassList(),
        ])
        if (ignore) return
        if (healthRes.status === 'fulfilled') {
          setBackendHealth(healthRes.value)
        } else {
          setBackendHealth(null)
        }
        if (classesRes.status === 'fulfilled') {
          setClassesList(classesRes.value.classes)
        }
      } catch {
        if (!ignore) setBackendHealth(null)
      }
    }
    loadInitialData()
    return () => {
      ignore = true
    }
  }, [])

  // Handler cek ulang manual
  const handleRecheckHealth = async () => {
    setIsCheckingHealth(true)
    try {
      const health = await checkServerHealth()
      setBackendHealth(health)

      const classesData = await getClassList()
      setClassesList(classesData.classes)
    } catch {
      setBackendHealth(null)
    } finally {
      setIsCheckingHealth(false)
    }
  }

  // Handler toggle model
  const handleToggleModel = (modelId: 'svm' | 'rf' | 'mobilenetv2') => {
    setSelectedModels((prev) =>
      prev.includes(modelId)
        ? prev.filter((id) => id !== modelId)
        : [...prev, modelId]
    )
  }

  const handleSelectAllModels = () => {
    setSelectedModels(['svm', 'rf', 'mobilenetv2'])
  }

  const handleDeselectAllModels = () => {
    setSelectedModels([])
  }

  // Handler file
  const handleFileSelect = (file: File) => {
    setCurrentFile(file)
    setErrorMessage(null)

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
  }

  const handleClearFile = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    setCurrentFile(null)
    setPreviewUrl(null)
    setResults(null)
    setErrorMessage(null)
  }

  // Eksekusi prediksi
  const handlePredict = async () => {
    if (!currentFile) {
      setErrorMessage('Silakan pilih atau unggah citra tulisan tangan terlebih dahulu.')
      return
    }
    if (selectedModels.length === 0) {
      setErrorMessage('Pilih minimal satu model machine learning untuk memproses gambar.')
      return
    }

    setIsLoading(true)
    setErrorMessage(null)

    try {
      const predictionResults = await runPrediction(currentFile, selectedModels)
      setResults(predictionResults)

      // Gulir halus ke bagian hasil
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 150)
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Terjadi kegagalan saat menghubungi server inferensi.'
      setErrorMessage(msg)
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetAll = () => {
    handleClearFile()
    setResults(null)
    setErrorMessage(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen bg-[#fbfbfb] text-zinc-900 flex flex-col">
      {/* Top Navigation */}
      <Header
        backendHealth={backendHealth}
        isCheckingHealth={isCheckingHealth}
        onRecheckHealth={handleRecheckHealth}
        onOpenClasses={() => setIsClassesOpen(true)}
      />

      {/* Main Content Container */}
      <main className="flex-1 mx-auto w-full max-w-6xl px-4 sm:px-6 py-8 sm:py-12 space-y-8 sm:space-y-10">
        {/* Backend Offline Warning Banner */}
        {backendHealth === null && !isCheckingHealth && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-amber-900 shadow-xs">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs sm:text-sm">
                <p className="font-semibold text-amber-950">
                  Backend API Server belum aktif di http://localhost:8000
                </p>
                <p className="text-amber-800 leading-relaxed">
                  Untuk menjalankan inferensi secara lokal, buka terminal dan jalankan server FastAPI:
                </p>
                <div className="mt-2 inline-flex items-center gap-2 rounded-lg bg-amber-100/90 px-3 py-1 font-mono text-xs text-amber-950 border border-amber-200">
                  <Terminal className="h-3.5 w-3.5" />
                  <span>cd server && uvicorn main:app --reload --host 0.0.0.0 --port 8000</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Hero Section (Midday & Tailscale Editorial Style) */}
        <section className="text-center space-y-4 max-w-3xl mx-auto pt-2 sm:pt-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3.5 py-1 text-xs font-medium text-zinc-700 shadow-xs">
            <span className="flex h-1.5 w-1.5 rounded-full bg-zinc-900" />
            <span>Sistem Klasifikasi Citra Digital • Multi-Model AI</span>
          </div>

          <h1 className="font-serif-title text-4xl sm:text-5xl lg:text-6xl font-normal tracking-tight text-zinc-900 leading-[1.12]">
            Identifikasi Pemilik Tulisan Tangan Mahasiswa
          </h1>

          <p className="text-sm sm:text-base text-zinc-600 leading-relaxed max-w-2xl mx-auto">
            Unggah potongan citra tulisan tangan mahasiswa dan bandingkan hasil prediksi kepemilikannya
            secara langsung menggunakan tiga pendekatan algoritma: <strong className="text-zinc-900">SVM + GLCM</strong>,{' '}
            <strong className="text-zinc-900">Random Forest + GLCM</strong>, dan{' '}
            <strong className="text-zinc-900">MobileNetV2 (Deep CNN)</strong>.
          </p>
        </section>

        {/* Interactive Workspace Card */}
        <div className="rounded-3xl border border-zinc-200/80 bg-white p-6 sm:p-8 shadow-xs space-y-8">
          {/* Section 1: Model Selection */}
          <section>
            <ModelSelector
              selectedModels={selectedModels}
              onToggleModel={handleToggleModel}
              onSelectAll={handleSelectAllModels}
              onDeselectAll={handleDeselectAllModels}
            />
          </section>

          <hr className="border-zinc-100" />

          {/* Section 2: Image Upload & Sample Selection */}
          <section>
            <ImageUploader
              currentFile={currentFile}
              previewUrl={previewUrl}
              onFileSelect={handleFileSelect}
              onClearFile={handleClearFile}
              isLoading={isLoading}
            />
          </section>

          {/* Error Message */}
          {errorMessage && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs sm:text-sm text-rose-800 flex items-start gap-3">
              <AlertTriangle className="h-4.5 w-4.5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-rose-900">Gagal Memproses Citra</p>
                <p className="mt-0.5">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Action CTA Button */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-zinc-500">
              {currentFile && selectedModels.length > 0 ? (
                <span className="flex items-center gap-1.5 text-emerald-700 font-medium">
                  <CheckCircle className="h-4 w-4" />
                  Siap memproses dengan {selectedModels.length} model terpilih
                </span>
              ) : (
                <span>Pilih citra dan tentukan model sebelum memulai inferensi</span>
              )}
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              {results && (
                <button
                  type="button"
                  onClick={handleResetAll}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full border border-zinc-200 px-5 py-3 text-xs sm:text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
                >
                  <RotateCcw className="h-4 w-4 text-zinc-500" />
                  <span>Ulangi Pengujian</span>
                </button>
              )}

              <button
                type="button"
                onClick={handlePredict}
                disabled={isLoading || !currentFile || selectedModels.length === 0}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-zinc-900 px-7 py-3 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-black transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Mengekstrak Fitur & Memprediksi...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 text-amber-300" />
                    <span>Klasifikasikan Tulisan Tangan</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Results Section */}
        {results && (
          <section ref={resultsRef} className="space-y-6 pt-4 animate-in fade-in duration-300">
            {/* Section Title */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-serif-title text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-900">
                  Hasil Klasifikasi & Komparasi Model
                </h2>
                <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
                  Menampilkan probabilitas prediksi tertinggi dan distribusi 5 kandidat teratas
                </p>
              </div>

              <span className="text-xs font-mono font-medium text-zinc-500 bg-zinc-100 px-3 py-1 rounded-full border border-zinc-200">
                {Object.keys(results).length} Algoritma Dievaluasi
              </span>
            </div>

            {/* Consensus / Agreement Summary Banner */}
            <ConsensusBanner results={results} />

            {/* Model Results Grid */}
            <div
              className={`grid gap-4 sm:gap-6 ${
                Object.keys(results).length === 1
                  ? 'grid-cols-1 max-w-xl mx-auto'
                  : Object.keys(results).length === 2
                  ? 'grid-cols-1 md:grid-cols-2'
                  : 'grid-cols-1 md:grid-cols-3'
              }`}
            >
              {AVAILABLE_MODELS.filter((m) => results[m.id]).map((model) => {
                const res = results[model.id]
                return <PredictionCard key={model.id} result={res} />
              })}
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-zinc-200/80 bg-white py-8 mt-16 text-center text-xs text-zinc-500">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 Proyek Klasifikasi Citra Tulisan Tangan Mahasiswa</p>
          <div className="flex items-center gap-4">
            <span>FastAPI Backend</span>
            <span>•</span>
            <span>GLCM Haralick + SVM & RF</span>
            <span>•</span>
            <span>MobileNetV2 CNN</span>
          </div>
        </div>
      </footer>

      {/* Classes Drawer / Modal */}
      <ClassesDrawer
        isOpen={isClassesOpen}
        onClose={() => setIsClassesOpen(false)}
        classes={classesList}
      />
    </div>
  )
}

export default App
