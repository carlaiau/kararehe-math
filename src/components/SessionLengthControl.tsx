import type { SessionLength } from "@/types/game"

export function SessionLengthControl({ value, onChange, options = [10, 20, 30], label = "Questions in each new session" }: { value: SessionLength; onChange: (value: SessionLength) => void; options?: SessionLength[]; label?: string }) {
  return (
    <label className="session-length-control">
      <span className="sr-only">Session length</span>
      <select
        value={value}
        onChange={(event) => onChange(Number(event.target.value) as SessionLength)}
        aria-label={label}
      >
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
      <span>questions</span>
    </label>
  )
}
