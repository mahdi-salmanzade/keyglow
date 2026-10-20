import { Search, Star } from 'lucide-react'
import { useMemo, useRef } from 'react'
import { toHex, type Rgb } from '../engine/color'
import type { Preset } from '../engine/types'
import { CATEGORY_ORDER, PRESETS } from '../presets'
import { applyLook, choosePreset, setState, useEditor, type Filter, type SavedLook } from '../state/store'

const strip = (colors: Rgb[]) =>
  colors.length === 1 ? toHex(colors[0]) : `linear-gradient(90deg, ${colors.map(toHex).join(', ')})`

const FILTERS: Filter[] = ['All', 'Starred', ...CATEGORY_ORDER, 'Mine']

const LABEL: Partial<Record<Filter, string>> = { Solid: 'Solids' }

function matches(p: Preset, q: string) {
  if (!q) return true
  const hay = `${p.name} ${p.code} ${p.category} ${(p.tags ?? []).join(' ')}`.toLowerCase()
  return q.split(/\s+/).every((word) => hay.includes(word))
}

export function PresetIndex() {
  const presetId = useEditor((s) => s.presetId)
  const filter = useEditor((s) => s.filter)
  const search = useEditor((s) => s.search)
  const favourites = useEditor((s) => s.favourites)
  const myLooks = useEditor((s) => s.myLooks)
  const searchRef = useRef<HTMLInputElement>(null)

  const q = search.trim().toLowerCase()
  const visible = useMemo(
    () =>
      PRESETS.filter(
        (p) =>
          (filter === 'All' || p.category === filter || (filter === 'Starred' && favourites.includes(p.id))) &&
          matches(p, q),
      ),
    [filter, q, favourites],
  )
  const looks = myLooks.filter((l) => (filter === 'All' || filter === 'Mine') && (!q || l.name.toLowerCase().includes(q)))

  const counts = useMemo(() => {
    const c = new Map<Filter, number>([['All', PRESETS.length], ['Starred', favourites.length], ['Mine', myLooks.length]])
    for (const p of PRESETS) c.set(p.category, (c.get(p.category) ?? 0) + 1)
    return c
  }, [favourites.length, myLooks.length])

  const groups = CATEGORY_ORDER.map((cat) => [cat, visible.filter((p) => p.category === cat)] as const).filter(
    ([, list]) => list.length,
  )

  const toggleStar = (id: string) =>
    setState((s) => ({
      favourites: s.favourites.includes(id) ? s.favourites.filter((f) => f !== id) : [...s.favourites, id],
    }))

  const nothing = !groups.length && !looks.length

  return (
    <nav className="index" aria-label="Preset library">
      <div className="index-head">
        <label className="search">
          <Search aria-hidden="true" />
          <span className="visually-hidden">Search presets</span>
          <input
            ref={searchRef}
            id="preset-search"
            type="search"
            placeholder={`Search ${PRESETS.length} presets`}
            value={search}
            onChange={(e) => setState({ search: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setState({ search: '' })
                searchRef.current?.blur()
              }
              if (e.key === 'Enter' && visible[0]) choosePreset(visible[0].id)
            }}
          />
        </label>
        <div className="filters" role="group" aria-label="Filter by category">
          {FILTERS.map((f) => (
            <button key={f} className="chip" aria-pressed={filter === f} onClick={() => setState({ filter: f })}>
              {LABEL[f] ?? f}
              <span className="n">{counts.get(f) ?? 0}</span>
            </button>
          ))}
        </div>
      </div>
      <ul className="list">
        {looks.length > 0 && (
          <li>
            <h3 className="label">My looks</h3>
            {looks.map((look) => (
              <LookRow key={look.id} look={look} />
            ))}
          </li>
        )}
        {groups.map(([cat, list]) => (
          <li key={cat}>
            <h3 className="label">
              {LABEL[cat] ?? cat} · {list.length}
            </h3>
            {list.map((p) => (
              <div key={p.id} style={{ position: 'relative' }}>
                <button className="row" aria-current={p.id === presetId} onClick={() => choosePreset(p.id)}>
                  <span className="strip" style={{ background: strip(p.swatch) }} />
                  <span className="name">{p.name}</span>
                  <span className="code">{p.code}</span>
                  <span />
                </button>
                <button
                  className={`row-star star${favourites.includes(p.id) ? ' on' : ''}`}
                  onClick={() => toggleStar(p.id)}
                  aria-label={favourites.includes(p.id) ? `Unstar ${p.name}` : `Star ${p.name}`}
                  aria-pressed={favourites.includes(p.id)}
                >
                  <Star fill={favourites.includes(p.id) ? 'currentColor' : 'none'} />
                </button>
              </div>
            ))}
          </li>
        ))}
        {nothing && (
          <li className="empty">
            {filter === 'Mine' && !q ? (
              <>
                <strong>No saved looks yet.</strong> Paint some keys or tune a preset, then use <strong>Save look</strong> in the
                tools panel.
              </>
            ) : filter === 'Starred' && !q ? (
              <>
                <strong>Nothing starred.</strong> Star presets to pin them to the instance rail under the keyboard.
              </>
            ) : (
              <>
                <strong>No presets match “{search.trim()}”.</strong> Try a colour, a mood like “calm”, or a category like “rainbow”.
              </>
            )}
          </li>
        )}
      </ul>
    </nav>
  )
}

function LookRow({ look }: { look: SavedLook }) {
  return (
    <div style={{ position: 'relative' }}>
      <button className="row" onClick={() => applyLook(look)}>
        <span className="strip" style={{ background: strip([look.primary, look.secondary]) }} />
        <span className="name">{look.name}</span>
        <span className="code">Mine</span>
        <span />
      </button>
    </div>
  )
}
