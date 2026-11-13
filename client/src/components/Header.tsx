import type { FC } from 'react'
import { Database, Sparkles, RefreshCw } from 'lucide-react'
import type { HealthResponse } from '../types'

interface HeaderProps {
  backendHealth: HealthResponse | null
  isCheckingHealth: boolean
  onRecheckHealth: () => void
  onOpenClasses: () => void
}

export const Header: FC<HeaderProps> = ({
  backendHealth,
  isCheckingHealth,
  onRecheckHealth,
  onOpenClasses,
}) => {
  const isOnline = backendHealth?.status === 'ok'
  const loadedCount = backendHealth
    ? Object.values(backendHealth.loaded_models).filter(Boolean).length
    : 0

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-200/80 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-900 text-white shadow-sm">
            <Sparkles className="h-4.5 w-4.5 text-zinc-100" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-zinc-900 tracking-tight text-sm sm:text-base">
                Foren AI
              </span>
              <span className="hidden sm:inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 border border-zinc-200">
                UAS Klasifikasi Citra
              </span>
            </div>
            <p className="hidden md:block text-[11px] text-zinc-500">
              Identifikasi Tulisan Tangan Mahasiswa Berbasis Multi-Model
            </p>
          </div>
        </div>

        {/* Action Controls & Backend Status */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Health Status Pill */}
          <div
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
              isOnline
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200/80'
                : 'bg-amber-50 text-amber-800 border-amber-200/80'
            }`}
            title={
              isOnline
                ? `Backend Online — ${loadedCount}/4 modul aktif`
                : 'Backend tidak merespons pada localhost:8000'
            }
          >
            <span
              className={`h-2 w-2 rounded-full ${
                isOnline
                  ? 'bg-emerald-500 animate-pulse'
                  : 'bg-amber-500 animate-ping'
              }`}
            />
            <span className="hidden xs:inline">
              {isOnline ? `Backend Online (${loadedCount}/4)` : 'Backend Offline'}
            </span>
            <button
              onClick={onRecheckHealth}
              disabled={isCheckingHealth}
              aria-label="Cek status backend"
              className="ml-0.5 text-zinc-400 hover:text-zinc-700 disabled:opacity-50 transition-transform active:rotate-180"
            >
              <RefreshCw
                className={`h-3 w-3 ${isCheckingHealth ? 'animate-spin' : ''}`}
              />
            </button>
          </div>

          {/* Classes Info Button */}
          <button
            onClick={onOpenClasses}
            className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 shadow-xs hover:bg-zinc-50 hover:border-zinc-300 transition-all"
          >
            <Database className="h-3.5 w-3.5 text-zinc-500" />
            <span>51 Mahasiswa</span>
          </button>
        </div>
      </div>
    </header>
  )
}
