import { useRef, useState, type FC } from 'react'
import { UploadCloud, X, Sparkles, CheckCircle2 } from 'lucide-react'
import { SAMPLE_IMAGES, type SampleImage } from '../constants'

interface ImageUploaderProps {
  currentFile: File | null
  previewUrl: string | null
  onFileSelect: (file: File) => void
  onClearFile: () => void
  isLoading: boolean
}

export const ImageUploader: FC<ImageUploaderProps> = ({
  currentFile,
  previewUrl,
  onFileSelect,
  onClearFile,
  isLoading,
}) => {
  const [isDragOver, setIsDragOver] = useState(false)
  const [isLoadingSample, setIsLoadingSample] = useState(false)
  const [activeSampleId, setActiveSampleId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0]
      if (file.type.startsWith('image/')) {
        setActiveSampleId(null)
        onFileSelect(file)
      }
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      setActiveSampleId(null)
      onFileSelect(file)
    }
  }

  const handleSelectSample = async (sample: SampleImage) => {
    if (isLoading || isLoadingSample) return
    setIsLoadingSample(true)
    try {
      const response = await fetch(sample.path)
      const blob = await response.blob()
      const file = new File([blob], sample.name, { type: blob.type || 'image/jpeg' })
      setActiveSampleId(sample.id)
      onFileSelect(file)
    } catch (err) {
      console.error('Gagal memuat sampel gambar:', err)
    } finally {
      setIsLoadingSample(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }

  return (
    <div className="space-y-4">
      {/* Upload Dropzone or Image Preview */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-zinc-900 tracking-tight flex items-center gap-2">
            <span>Unggah Citra Tulisan Tangan</span>
          </label>
          {currentFile && (
            <button
              type="button"
              onClick={() => {
                setActiveSampleId(null)
                onClearFile()
              }}
              disabled={isLoading}
              className="inline-flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 font-medium transition-colors disabled:opacity-50"
            >
              <X className="h-3.5 w-3.5" />
              <span>Hapus Gambar</span>
            </button>
          )}
        </div>

        {!previewUrl ? (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`group relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 sm:p-12 text-center cursor-pointer transition-all ${
              isDragOver
                ? 'border-zinc-900 bg-zinc-100/70'
                : 'border-zinc-300/80 bg-zinc-50/60 hover:border-zinc-400 hover:bg-zinc-50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              onChange={handleFileChange}
              className="hidden"
            />

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white border border-zinc-200/80 shadow-xs group-hover:scale-105 transition-transform mb-3">
              <UploadCloud className="h-6 w-6 text-zinc-700" />
            </div>

            <p className="text-sm font-medium text-zinc-900">
              <span className="text-zinc-900 font-semibold underline decoration-zinc-400 underline-offset-2">
                Pilih file citra
              </span>{' '}
              atau seret & letakkan di sini
            </p>
            <p className="text-xs text-zinc-500 mt-1">
              Mendukung format PNG, JPG, JPEG, atau WebP (potongan foto tulisan tangan mahasiswa)
            </p>
          </div>
        ) : (
          <div className="relative overflow-hidden rounded-2xl border border-zinc-200/80 bg-zinc-950 p-3 sm:p-4 text-white shadow-inner">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              {/* Image Frame */}
              <div className="relative max-h-48 w-full sm:w-auto flex items-center justify-center bg-zinc-900/90 rounded-xl p-2 border border-zinc-800">
                <img
                  src={previewUrl}
                  alt="Pratinjau Tulisan Tangan"
                  className="max-h-40 max-w-full rounded object-contain"
                />
              </div>

              {/* Metadata & Actions */}
              <div className="flex-1 min-w-0 space-y-2 text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[11px] font-medium text-emerald-300 border border-emerald-500/30">
                    <CheckCircle2 className="h-3 w-3" />
                    Citra Siap Diproses
                  </span>
                  {activeSampleId && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-zinc-800 px-2 py-0.5 text-[11px] font-medium text-zinc-300 border border-zinc-700">
                      Sampel #{activeSampleId}
                    </span>
                  )}
                </div>

                <div>
                  <h4 className="text-sm font-medium text-zinc-100 truncate">
                    {currentFile?.name}
                  </h4>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Ukuran: {currentFile ? formatFileSize(currentFile.size) : '0 B'} • Tipe: {currentFile?.type || 'image'}
                  </p>
                </div>

                <div className="pt-1 flex items-center justify-center sm:justify-start gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading}
                    className="text-xs font-medium px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-colors"
                  >
                    Ganti Citra Lain
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Sample Selector */}
      <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/70 p-4 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-700">
            <Sparkles className="h-3.5 w-3.5 text-zinc-500" />
            <span>Atau Uji Cepat dengan Sampel Tulisan:</span>
          </div>
          <span className="text-[11px] text-zinc-400">Klik salah satu sampel di bawah</span>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {SAMPLE_IMAGES.map((sample) => {
            const isSelected = activeSampleId === sample.id
            return (
              <button
                key={sample.id}
                type="button"
                onClick={() => handleSelectSample(sample)}
                disabled={isLoading || isLoadingSample}
                className={`group flex flex-col items-center rounded-xl p-1.5 border transition-all text-left bg-white ${
                  isSelected
                    ? 'border-zinc-900 ring-2 ring-zinc-900/10 shadow-xs'
                    : 'border-zinc-200 hover:border-zinc-400 hover:shadow-xs'
                }`}
              >
                <div className="relative h-12 w-full rounded-lg overflow-hidden bg-zinc-100 flex items-center justify-center border border-zinc-100">
                  <img
                    src={sample.path}
                    alt={sample.label}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                    loading="lazy"
                  />
                </div>
                <span className="mt-1 text-[11px] font-medium text-zinc-600 truncate w-full text-center">
                  {sample.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
