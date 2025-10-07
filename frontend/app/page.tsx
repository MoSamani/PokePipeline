'use client'
import { useEffect, useState } from 'react'
import styles from './page.module.css'

// Define PRow as a dictionary for the name and URL to save it
type PRow = { name: string; url?: string }
// Define PDetail as a dictionary for the Pokemon features and type of them
type PDetail = {
  types?: string
  abilities?: string
  base_experience?: number
  height_m?: number
  weight_kg?: number
  sprite_url?: string | null
}

// Define HomePage component to render Pokemon names, URL and Features.
export default function HomePage() {
  // Local state for managing data, loading and errors
  const [rows, setRows] = useState<PRow[]>([])
  const [loading, setLoading] = useState(false)
  const [ingesting, setIngesting] = useState(false)
  const [limit, setLimit] = useState(25)
  const [offset, setOffset] = useState(0)
  const [err, setErr] = useState<string | null>(null)

  // Toggle the detail view for a specific Pokémon
  // If the detail is already open, close it
  // If not yet loaded, fetch detailed data from the API and store it in state
  // Then open the detail view
  const [details, setDetails] = useState<Record<string, PDetail>>({})
  const [openDetail, setOpenDetail] = useState<Record<string, boolean>>({})
  const toggleDetail = async (name: string) => {
    if (openDetail[name]) {
      setOpenDetail((prev) => ({ ...prev, [name]: !prev[name] }))
      return
    }
    if (!details[name]) {
      try {
        const res = await fetch(
          `/api/pokemon/detail?name=${encodeURIComponent(name)}`
        )
        if (!res.ok) throw new Error(`GET /api/pokemon/detail → ${res.status}`)
        const d: PDetail = await res.json()
        setDetails((prev) => ({ ...prev, [name]: d }))
      } catch (e: any) {
        setErr(e.message)
        return
      }
    }
    setOpenDetail((prev) => ({ ...prev, [name]: true }))
  }

  // Map of name → expanded (open) state
  // Save/Cache URLs if it's  not already in the dataset
  const [open, setOpen] = useState<Record<string, boolean>>({})
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
          const detail = details?.[r.name]
          const isDetailOpen = !!openDetail?.[r.name]

          return (
            <li key={r.name} className={styles.card}>
              <div className={styles.row}>
                <div className={styles.clickable} onClick={() => toggleRow(r)}>
                  <div className={styles.name}>{r.name}</div>
                  <span className={styles.chev}>{isOpen ? '▾' : '▸'}</span>
                </div>

                <button
                  className={styles.linkBtn}
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleDetail(r.name)
                  }}
                >
                  More Info
                </button>
              </div>

              {isOpen && url && (
                <div className={styles.url}>
                  <a href={url} target="_blank" rel="noopener noreferrer">
                    {url}
                  </a>
                </div>
              )}

              {isDetailOpen && detail && (
                <div className={styles.detailBox}>
                  {detail.sprite_url && (
                    <img
                      className={styles.sprite}
                      src={detail.sprite_url}
                      alt={r.name}
                    />
                  )}
                  <div>
                    <b>Types:</b> {detail.types || '—'}
                  </div>
                  <div>
                    <b>Abilities:</b> {detail.abilities || '—'}
                  </div>
                  <div>
                    <b>Base XP:</b> {detail.base_experience ?? '—'}
                  </div>
                  <div>
                    <b>Height:</b>{' '}
                    {detail.height_m != null ? `${detail.height_m} m` : '—'}
                  </div>
                  <div>
                    <b>Weight:</b>{' '}
                    {detail.weight_kg != null ? `${detail.weight_kg} kg` : '—'}
                  </div>
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
