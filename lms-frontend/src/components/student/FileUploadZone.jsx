import { useState, useRef, useCallback } from 'react'

const ACCEPTED = ['.pdf', '.docx']
const ACCEPTED_MIME = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function FileUploadZone({ onFileSelect }) {
  const [dragActive, setDragActive] = useState(false)
  const [file, setFile]             = useState(null)
  const [error, setError]           = useState('')
  const inputRef                    = useRef(null)

  const validate = useCallback(f => {
    if (!f) return 'No file selected.'
    const ext = '.' + f.name.split('.').pop().toLowerCase()
    if (!ACCEPTED.includes(ext) && !ACCEPTED_MIME.includes(f.type)) {
      return 'Only .pdf or .docx files are accepted.'
    }
    if (f.size > 20 * 1024 * 1024) return 'File must be under 20 MB.'
    return null
  }, [])

  const accept = useCallback(f => {
    const err = validate(f)
    if (err) { setError(err); return }
    setError('')
    setFile(f)
    onFileSelect?.(f)
  }, [validate, onFileSelect])

  const onDrop = useCallback(e => {
    e.preventDefault()
    setDragActive(false)
    const f = e.dataTransfer.files?.[0]
    if (f) accept(f)
  }, [accept])

  const onDragOver = e => { e.preventDefault(); setDragActive(true) }
  const onDragLeave = () => setDragActive(false)
  const onInputChange = e => { if (e.target.files?.[0]) accept(e.target.files[0]) }

  const fileIcon = file?.name.endsWith('.pdf') ? '📄' : '📝'

  return (
    <div>
      <div
        onClick={() => inputRef.current?.click()}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        className={`relative cursor-pointer rounded-2xl flex flex-col items-center justify-center py-14 px-8 transition-all ${dragActive ? 'drag-active' : ''}`}
        style={{
          border:     `2px dashed ${dragActive ? 'var(--plum-500)' : 'var(--plum-300)'}`,
          background: dragActive ? 'var(--plum-50)' : 'var(--cream)',
        }}
        role="button"
        tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && inputRef.current?.click()}
        aria-label="Upload file"
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx"
          className="hidden"
          onChange={onInputChange}
        />

        {file ? (
          <>
            <span className="text-4xl mb-3">{fileIcon}</span>
            <p className="font-medium text-sm mb-1" style={{ color: 'var(--plum-900)' }}>
              {file.name}
            </p>
            <p className="text-xs mb-4" style={{ color: 'var(--plum-400)' }}>
              {formatBytes(file.size)}
            </p>
            <button
              onClick={e => { e.stopPropagation(); setFile(null); onFileSelect?.(null) }}
              className="text-xs px-3 py-1.5 rounded-md transition-all"
              style={{ background: 'white', color: 'var(--plum-500)', border: '1px solid var(--warm-gray)' }}
            >
              Remove file
            </button>
          </>
        ) : (
          <>
            <div className="text-4xl mb-4">☁️</div>
            <p className="font-medium text-sm mb-1" style={{ color: 'var(--plum-800)' }}>
              Drag & drop your file here
            </p>
            <p className="text-xs mb-4" style={{ color: 'var(--plum-400)' }}>
              or click to browse
            </p>
            <div className="flex gap-2">
              {ACCEPTED.map(ext => (
                <span key={ext} className="text-xs px-2.5 py-1 rounded-full font-medium"
                      style={{ background: 'var(--plum-100)', color: 'var(--plum-700)' }}>
                  {ext}
                </span>
              ))}
            </div>
            <p className="text-xs mt-3" style={{ color: 'var(--plum-300)' }}>Max 20 MB</p>
          </>
        )}
      </div>

      {error && (
        <p className="mt-2 text-xs" style={{ color: '#b91c1c' }}>⚠ {error}</p>
      )}
    </div>
  )
}
