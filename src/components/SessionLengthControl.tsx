import type { SessionLength } from "@/types/game"

export function SessionLengthControl({ value, onChange }: { value: SessionLength; onChange: (value: SessionLength) => void }) {
  return (
    <label className="session-length-control">
      <span className="sr-only">Session length</span>
      <select
        value={value}
        onChange={(event) => onChange(Number(event.target.value) as SessionLength)}
        aria-label="Questions in each new session"
      >
        <option value={10}>10</option>
        <option value={20}>20</option>
        <option value={30}>30</option>
      </select>
      <span>questions</span>
    </label>
  )
}
