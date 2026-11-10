import type { FC } from 'react'
import { Clock, Award, Layers, Network, Cpu } from 'lucide-react'
import type { AlgorithmResult } from '../types'

interface PredictionCardProps {
  result: AlgorithmResult
  isConsensusTop?: boolean
}

export const PredictionCard: FC<PredictionCardProps> = ({
  result,
  isConsensusTop = false,
}) => {
  const getAlgorithmMeta = (id: string) => {
    switch (id) {
      case 'svm':
        return {
          icon: <Layers className="h-4 w-4 text-blue-600" />,
          accent: 'blue',
          tag: 'SVM + GLCM',
          borderHighlight: 'border-blue-200/80',
          barColor: 'bg-blue-600',
        }
      case 'rf':
        return {
          icon: <Network className="h-4 w-4 text-emerald-600" />,
          accent: 'emerald',
          tag: 'Random Forest',
          borderHighlight: 'border-emerald-200/80',
          barColor: 'bg-emerald-600',
        }
      case 'mobilenetv2':
        return {
          icon: <Cpu className="h-4 w-4 text-purple-600" />,
          accent: 'purple',
          tag: 'MobileNetV2 CNN',
          borderHighlight: 'border-purple-200/80',
          barColor: 'bg-purple-600',
        }
      default:
        return {
          icon: <Award className="h-4 w-4 text-zinc-600" />,
          accent: 'zinc',
          tag: result.algorithm_name,
          borderHighlight: 'border-zinc-200',
          barColor: 'bg-zinc-900',
        }
    }
  }

  const meta = getAlgorithmMeta(result.algorithm_id)
  const confidencePercent = Math.min(100, Math.max(0, result.confidence * 100))

  return (
    <div
      className={`relative flex flex-col rounded-3xl border bg-white p-5 sm:p-6 shadow-xs transition-all hover:shadow-md ${
        isConsensusTop ? 'border-zinc-900 ring-1 ring-zinc-900/10' : 'border-zinc-200/80'
      }`}
    >
      {/* Card Header: Algorithm Info & Inference Time */}
      <div className="flex items-start justify-between gap-3 pb-3.5 border-b border-zinc-100">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-zinc-100">
            {meta.icon}
          </div>
          <div className="min-w-0">
            <h4
              className="text-sm font-semibold text-zinc-900 tracking-tight leading-tight"
              title={result.algorithm_name}
            >
              {result.algorithm_name}
            </h4>
            <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider block mt-0.5">
              {meta.tag}
            </span>
          </div>
        </div>

        <div
          className="inline-flex shrink-0 items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-mono font-medium text-zinc-600 border border-zinc-200/50"
          title="Waktu Inferensi Model"
        >
          <Clock className="h-3 w-3 text-zinc-400" />
          <span>{result.processing_time_ms.toFixed(1)} ms</span>
        </div>
      </div>

      {/* Hero Prediction: Top Class in Structured Container */}
      <div className="my-4 rounded-2xl bg-zinc-50/80 border border-zinc-200/70 p-3.5 sm:p-4 space-y-3">
        {/* Label and Rank Badge */}
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
            Prediksi Teratas
          </span>
          <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200">
            Peringkat #1
          </span>
        </div>

        {/* Prediction ID and Confidence Percentage */}
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-900 font-mono">
            {result.top_prediction}
          </span>

          <div className="text-right shrink-0">
            <span className="text-xl sm:text-2xl font-bold font-mono text-zinc-900 block leading-tight">
              {result.percentage}
            </span>
            <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider block mt-0.5">
              Keyakinan
            </span>
          </div>
        </div>

        {/* Primary Confidence Progress Bar */}
        <div className="w-full bg-zinc-200/70 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ease-out ${meta.barColor}`}
            style={{ width: `${confidencePercent}%` }}
          />
        </div>
      </div>

      {/* Top 5 Ranked Candidates */}
      <div className="mt-auto pt-3.5 border-t border-zinc-100 space-y-2.5">
        <div className="flex items-center justify-between text-xs font-medium text-zinc-500">
          <span>5 Kandidat Teratas</span>
          <span>Probabilitas</span>
        </div>

        <div className="space-y-1.5">
          {result.top_5.map((candidate) => {
            const candidatePercent = Math.min(100, Math.max(0, candidate.confidence * 100))
            const isTop = candidate.rank === 1

            return (
              <div
                key={candidate.class_name}
                className={`flex items-center justify-between gap-2 rounded-xl px-2.5 py-1.5 text-xs transition-colors ${
                  isTop
                    ? 'bg-zinc-100/90 font-medium text-zinc-900'
                    : 'text-zinc-600 hover:bg-zinc-50'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={`flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full text-[10px] font-mono ${
                      isTop
                        ? 'bg-zinc-900 text-white font-bold'
                        : 'bg-zinc-200 text-zinc-600'
                    }`}
                  >
                    {candidate.rank}
                  </span>
                  <span className="font-mono text-zinc-900 truncate">
                    {candidate.class_name}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="w-14 sm:w-16 bg-zinc-200/80 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${isTop ? meta.barColor : 'bg-zinc-400'}`}
                      style={{ width: `${candidatePercent}%` }}
                    />
                  </div>
                  <span className="font-mono text-right w-12 sm:w-14 text-[11px] sm:text-xs">
                    {candidate.percentage}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
