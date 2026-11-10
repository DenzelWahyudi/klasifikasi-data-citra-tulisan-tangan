import { useState, type FC } from 'react'
import { X, Search, Database } from 'lucide-react'

interface ClassesDrawerProps {
  isOpen: boolean
  onClose: () => void
  classes: string[]
}

export const ClassesDrawer: FC<ClassesDrawerProps> = ({
  isOpen,
  onClose,
  classes,
}) => {
  const [searchTerm, setSearchTerm] = useState('')

  if (!isOpen) return null

  const filtered = classes.filter((c) =>
    c.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-zinc-200 max-h-[85vh] flex flex-col"
        role="dialog"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-100 text-zinc-800">
              <Database className="h-4.5 w-4.5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-zinc-900 tracking-tight">
                Daftar Kelas Mahasiswa Terdaftar
              </h3>
              <p className="text-xs text-zinc-500">
                Total {classes.length} label/ID mahasiswa yang dipelajari oleh model
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search */}
        <div className="pt-4 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Cari ID Mahasiswa (contoh: A25...)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 py-2 pl-9 pr-4 text-xs font-mono text-zinc-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900"
            />
          </div>
        </div>

        {/* Class badges grid */}
        <div className="flex-1 overflow-y-auto py-3 pr-1 space-y-2">
          {filtered.length === 0 ? (
            <p className="text-center text-xs text-zinc-400 py-8">
              Tidak ada kelas mahasiswa yang cocok dengan pencarian "{searchTerm}"
            </p>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {filtered.map((item, index) => (
                <div
                  key={item}
                  className="flex items-center justify-between rounded-xl border border-zinc-100 bg-zinc-50 px-2.5 py-1.5 text-xs font-mono text-zinc-800 hover:bg-zinc-100 transition-colors"
                >
                  <span className="text-[10px] text-zinc-400 font-sans">
                    #{index + 1}
                  </span>
                  <span className="font-semibold">{item}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500">
          <span>Menampilkan {filtered.length} dari {classes.length} kelas</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-full bg-zinc-900 text-white hover:bg-black font-medium transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  )
}
