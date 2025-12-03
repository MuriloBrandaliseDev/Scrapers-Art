import { useState, useRef, useEffect } from 'react'
import { X, Maximize2 } from 'lucide-react'
import clsx from 'clsx'

interface TruncatedTextProps {
  text: string | null | undefined
  maxLength?: number
  className?: string
  showExpandIcon?: boolean
}

export default function TruncatedText({ 
  text, 
  maxLength = 50, 
  className = '',
  showExpandIcon = true 
}: TruncatedTextProps) {
  const [showModal, setShowModal] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)

  if (!text) {
    return <span className={clsx('text-[#666]', className)}>N/A</span>
  }

  const shouldTruncate = text.length > maxLength
  const truncatedText = shouldTruncate ? text.slice(0, maxLength) + '...' : text

  // Fechar modal ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setShowModal(false)
      }
    }

    if (showModal) {
      document.addEventListener('mousedown', handleClickOutside)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.body.style.overflow = 'unset'
    }
  }, [showModal])

  // Fechar modal com ESC
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowModal(false)
      }
    }

    if (showModal) {
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [showModal])

  if (!shouldTruncate) {
    return <span className={className}>{text}</span>
  }

  return (
    <>
      <div className={clsx('flex items-center gap-1 group', className)}>
        <span className="text-[#ccc] text-xs">{truncatedText}</span>
        {showExpandIcon && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              setShowModal(true)
            }}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-[#2a2a2a] flex-shrink-0"
            title="Ver texto completo"
          >
            <Maximize2 className="w-3 h-3 text-[#d4af37]" />
          </button>
        )}
      </div>

      {/* Modal para texto completo */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div
            ref={modalRef}
            className="bg-[#151515] border border-[#2a2a2a] rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[#2a2a2a]">
              <h3 className="text-lg font-semibold text-[#d4af37]">Texto Completo</h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 rounded-lg text-[#888] hover:bg-[#1f1f1f] hover:text-[#d4af37] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto flex-1">
              <p className="text-[#ccc] text-sm leading-relaxed whitespace-pre-wrap break-words">
                {text}
              </p>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-[#2a2a2a] flex justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-[#d4af37] text-[#0f0f0f] rounded-lg font-medium hover:bg-[#f4e4bc] transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

