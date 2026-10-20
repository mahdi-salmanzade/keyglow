import { useToasts } from '../state/toast'

export function Toasts() {
  const list = useToasts()
  return (
    <div className="toasts" role="status" aria-live="polite">
      {list.map((t) => (
        <div className="toast" key={t.id}>{t.text}</div>
      ))}
    </div>
  )
}
