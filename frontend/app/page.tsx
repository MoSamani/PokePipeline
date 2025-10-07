'use client'
import { useEffect, useState } from 'react'
import styles from './page.module.css'

// Define PRow as a dictionary for the name and URL to save it
type PRow = { name: string; url?: string }

// Define HomePage component to render Pokemon names and URL.
export default function HomePage() {
  // Local state for managing data, loading and errors
  const [rows, setRows] = useState<PRow[]>([])
  const [loading, setLoading] = useState(false)
  const [ingesting, setIngesting] = useState(false)
  const [limit, setLimit] = useState(25)
  const [offset, setOffset] = useState(0)
  const [err, setErr] = useState<string | null>(null)

  // Map of name → expanded (open) state
  const [open, setOpen] = useState<Record<string, boolean>>({})
  // Save/Cache URLs if it's  not already in the dataset
  const [urlCache, setUrlCache] = useState<Record<string, string>>({})

  // Fetch up to 10 items
  const load = async () => {
    setLoading(true)
    setErr(null)
    try {
      const r = await fetch('/api/pokemon?limit=10')
      if (!r.ok) throw new Error(`GET /api/pokemon → ${r.status}`)
      const data: PRow[] = await r.json()
      setRows(data)
    } catch (e: any) {
      setErr(e.message)
    } finally {
      setLoading(false)
    }
  }

  // Read data and save them in db
  const ingest = async () => {
    setIngesting(true)
    setErr(null)
    try {
      const r = await fetch(`/api/ingest?limit=${limit}&offset=${offset}`, {
        method: 'POST',
      })
      if (!r.ok) throw new Error(`POST /api/ingest → ${r.status}`)
      await load()
    } catch (e: any) {
      setErr(e.message)
    } finally {
      setIngesting(false)
    }
  }

  const toggleRow = async (row: PRow) => {
    // Toggel the state of open
    if (open[row.name]) {
      setOpen((prev) => ({ ...prev, [row.name]: !prev[row.name] }))
      return
    }
    // if URL exists then open
    if (row.url) {
      setOpen((prev) => ({ ...prev, [row.name]: true }))
      return
    }
    // Check if url existes, fetch it and cache it
    try {
      const res = await fetch(
        `/api/pokemon/url?name=${encodeURIComponent(row.name)}`
      )
      if (res.ok) {
        const { url } = await res.json()
        setUrlCache((prev) => ({ ...prev, [row.name]: url }))
        setOpen((prev) => ({ ...prev, [row.name]: true }))
      } else {
        setErr(`URL nicht gefunden für ${row.name}`)
      }
    } catch (e: any) {
      setErr(e.message)
    }
  }

  // Run once on mount (and again on remounts)
  useEffect(() => {
    load()
  }, [])

  return (
    <main className={styles.main}>
      <h1>Pokémon API</h1>

      <div className={styles.controls}>
        <label>
          Limit:
          <input
            type="number"
            value={limit}
            min={1}
            max={200}
            onChange={(e) => setLimit(parseInt(e.target.value || '0', 10))}
            className={`${styles.input} ${styles['input--small']}`}
          />
        </label>
        <label>
          Offset:
          <input
            type="number"
            value={offset}
            min={0}
            onChange={(e) => setOffset(parseInt(e.target.value || '0', 10))}
            className={styles.input}
          />
        </label>

        <button onClick={ingest} disabled={ingesting} className={styles.btn}>
          {ingesting ? 'Importiere…' : 'Import starten'}
        </button>
        <button onClick={load} disabled={loading} className={styles.btn}>
          {loading ? 'Lade…' : 'Aktualisieren'}
        </button>
      </div>

      {err && <p className={styles.error}>Fehler: {err}</p>}

      <ul className={styles.list}>
        {rows.map((r) => {
          const url = r.url ?? urlCache[r.name]
          const isOpen = !!open[r.name]
          return (
            <li key={r.name} className={styles.card}>
              <div className={styles.clickable} onClick={() => toggleRow(r)}>
                <div className={styles.name}>{r.name}</div>
                <span className={styles.chev}>{isOpen ? '▾' : '▸'}</span>
              </div>
              {isOpen && url && (
                <div className={styles.url}>
                  <a href={url} target="_blank">
                    {url}
                  </a>
                </div>
              )}
            </li>
          )
        })}
      </ul>

      {!rows.length && !loading && <p>Noch keine Daten. Starte den Import.</p>}
    </main>
  )
}
