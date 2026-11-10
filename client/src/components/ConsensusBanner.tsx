import type { FC } from 'react'
import { CheckCircle2, AlertCircle, Sparkles, Zap } from 'lucide-react'
import type { AlgorithmResult } from '../types'

interface ConsensusBannerProps {
  results: Record<string, AlgorithmResult>
}

export const ConsensusBanner: FC<ConsensusBannerProps> = ({ results }) => {
  const resultList = Object.values(results)
  if (resultList.length === 0) return null

  // Evaluasi konsensus
  const predictions = resultList.map((r) => r.top_prediction)
  const isConsensus = predictions.every((p) => p === predictions[0])
  const firstPrediction = predictions[0]

  const averageConfidence = (
    (resultList.reduce((acc, curr) => acc + curr.confidence, 0) /
      resultList.length) *
    100
  ).toFixed(2)

  const fastestModel = [...resultList].sort(
    (a, b) => a.processing_time_ms - b.processing_time_ms
  )[0]

  if (resultList.length === 1) {
    const single = resultList[0]
    return (
      <div className="rounded-2xl border border-zinc-200/80 bg-zinc-900 text-white p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-800 border border-zinc-700">
              <Sparkles className="h-5 w-5 text-zinc-200" />
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-400">
                Inferensi Selesai ({single.algorithm_name})
              </p>
              <h3 className="text-base sm:text-lg font-semibold tracking-tight text-white">
                Hasil Prediksi:{' '}
                <span className="font-mono text-emerald-400 font-bold">
                  {single.top_prediction}
                </span>{' '}
                ({single.percentage})
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto text-xs font-mono text-zinc-400 bg-zinc-800/80 px-3 py-1.5 rounded-lg border border-zinc-700">
            <Zap className="h-3.5 w-3.5 text-amber-400" />
            <span>Waktu: {single.processing_time_ms.toFixed(1)} ms</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`rounded-3xl border p-5 sm:p-6 transition-all ${
        isConsensus
          ? 'border-emerald-200 bg-emerald-50/60 text-emerald-950'
          : 'border-zinc-200 bg-zinc-900 text-white'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border ${
              isConsensus
                ? 'bg-emerald-100/80 border-emerald-300 text-emerald-700'
                : 'bg-zinc-800 border-zinc-700 text-zinc-200'
            }`}
          >
            {isConsensus ? (
              <CheckCircle2 className="h-6 w-6 stroke-[2.2]" />
            ) : (
              <AlertCircle className="h-6 w-6 text-amber-400 stroke-[2.2]" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span
                className={`text-[11px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full border ${
                  isConsensus
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    : 'bg-zinc-800 text-zinc-300 border-zinc-700'
                }`}
              >
                {isConsensus ? 'Konsensus Tercapai' : 'Hasil Komparasi Bervariasi'}
              </span>
            </div>

            <h3
              className={`text-base sm:text-xl font-bold tracking-tight mt-1 ${
                isConsensus ? 'text-emerald-900' : 'text-white'
              }`}
            >
              {isConsensus ? (
                <>
                  Seluruh model sepakat:{' '}
                  <span className="font-mono underline underline-offset-4 decoration-emerald-500">
                    {firstPrediction}
                  </span>{' '}
                  (Rata-rata: {averageConfidence}%)
                </>
              ) : (
                'Terdapat perbedaan kandidat teratas antar model'
              )}
            </h3>

            <p
              className={`text-xs mt-1 ${
                isConsensus ? 'text-emerald-700' : 'text-zinc-400'
              }`}
            >
              {isConsensus
                ? `Ketiga/kedua model yang dipilih (${resultList.map((r) => r.algorithm_id.toUpperCase()).join(', ')}) menempatkan mahasiswa ${firstPrediction} di peringkat teratas.`
                : 'Masing-masing arsitektur algoritma (GLCM Texture vs Deep CNN) menangkap pola citra yang berbeda. Bandingkan distribusi probabilitas 5 kandidat teratas di bawah.'}
            </p>
          </div>
        </div>

        {fastestModel && (
          <div
            className={`flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-1 rounded-xl px-3 py-2 border text-xs font-mono shrink-0 ${
              isConsensus
                ? 'bg-emerald-100/50 border-emerald-200 text-emerald-800'
                : 'bg-zinc-800 border-zinc-700 text-zinc-300'
            }`}
          >
            <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-sans">
              Model Tercepat
            </span>
            <span className="font-semibold">
              {fastestModel.algorithm_id.toUpperCase()} ({fastestModel.processing_time_ms.toFixed(1)} ms)
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
