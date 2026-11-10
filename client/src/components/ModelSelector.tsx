import type { FC } from 'react'
import { Check, Cpu, Network, Layers, Sparkles } from 'lucide-react'
import { AVAILABLE_MODELS } from '../constants'

interface ModelSelectorProps {
  selectedModels: ('svm' | 'rf' | 'mobilenetv2')[]
  onToggleModel: (modelId: 'svm' | 'rf' | 'mobilenetv2') => void
  onSelectAll: () => void
  onDeselectAll: () => void
}

export const ModelSelector: FC<ModelSelectorProps> = ({
  selectedModels,
  onToggleModel,
  onSelectAll,
  onDeselectAll,
}) => {
  const allSelected = selectedModels.length === AVAILABLE_MODELS.length
  const noneSelected = selectedModels.length === 0

  const getModelIcon = (id: string) => {
    switch (id) {
      case 'svm':
        return <Layers className="h-4 w-4 text-blue-600" />
      case 'rf':
        return <Network className="h-4 w-4 text-emerald-600" />
      case 'mobilenetv2':
        return <Cpu className="h-4 w-4 text-purple-600" />
      default:
        return <Sparkles className="h-4 w-4 text-zinc-600" />
    }
  }

  return (
    <div className="space-y-3">
      {/* Header & Quick Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <label className="text-sm font-semibold text-zinc-900 tracking-tight flex items-center gap-2">
            <span>Pilih Model Prediksi</span>
            <span className="text-xs font-normal text-zinc-500">
              ({selectedModels.length} dari {AVAILABLE_MODELS.length} dipilih)
            </span>
          </label>
          <p className="text-xs text-zinc-500">
            Anda dapat memilih satu model, dua model, atau ketiga model sekaligus untuk perbandingan komprehensif.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={allSelected ? onDeselectAll : onSelectAll}
            className="text-xs font-medium px-3 py-1.5 rounded-full border border-zinc-200 hover:bg-zinc-100 text-zinc-700 transition-colors"
          >
            {allSelected ? 'Batalkan Semua' : 'Pilih Semua Model'}
          </button>
        </div>
      </div>

      {/* Model Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {AVAILABLE_MODELS.map((model) => {
          const isSelected = selectedModels.includes(model.id)
          return (
            <div
              key={model.id}
              role="button"
              tabIndex={0}
              onClick={() => onToggleModel(model.id)}
              onKeyDown={(e) => {
                if (e.key === ' ' || e.key === 'Enter') {
                  e.preventDefault()
                  onToggleModel(model.id)
                }
              }}
              className={`group relative text-left rounded-2xl p-4 transition-all cursor-pointer border ${
                isSelected
                  ? 'border-zinc-900 bg-white shadow-sm ring-1 ring-zinc-900/10'
                  : 'border-zinc-200/80 bg-zinc-50/50 hover:bg-white hover:border-zinc-300'
              }`}
            >
              {/* Checkbox indicator & Badge */}
              <div className="flex items-start justify-between gap-2 mb-2.5">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-100 group-hover:bg-zinc-200/70 transition-colors">
                    {getModelIcon(model.id)}
                  </div>
                  <span
                    className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium border ${model.tagColor}`}
                  >
                    {model.badge}
                  </span>
                </div>

                <div
                  className={`flex h-5 w-5 items-center justify-center rounded-md border transition-all ${
                    isSelected
                      ? 'bg-zinc-900 border-zinc-900 text-white'
                      : 'border-zinc-300 bg-white group-hover:border-zinc-400'
                  }`}
                >
                  {isSelected && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                </div>
              </div>

              {/* Title & Technique */}
              <h4 className="font-semibold text-zinc-900 text-sm tracking-tight">
                {model.name}
              </h4>
              <p className="text-xs font-medium text-zinc-600 mt-0.5">
                {model.technique}
              </p>

              {/* Description */}
              <p className="text-[12px] text-zinc-500 mt-2 leading-relaxed">
                {model.description}
              </p>
            </div>
          )
        })}
      </div>

      {noneSelected && (
        <p className="text-xs text-rose-600 font-medium">
          ⚠️ Mohon pilih minimal satu model agar inferensi dapat dijalankan.
        </p>
      )}
    </div>
  )
}
