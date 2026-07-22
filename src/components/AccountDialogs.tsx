import { useMemo, useState, type FormEvent } from "react"
import { Download, LogOut, UserRound } from "lucide-react"
import { EmailVerificationRequiredError, useAuth } from "@/auth/AuthContext"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { pendingProfileKey } from "@/storage/progressStorage"
import type { LearnerProfile, StoredGameData } from "@/types/game"

type AuthMode = "sign-in" | "sign-up" | "verify" | "forgot" | "reset" | "sent"

export function AuthDialog({ open, onOpenChange, initialMode = "sign-in" }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialMode?: "sign-in" | "sign-up"
}) {
  const auth = useAuth()
  const resetToken = new URLSearchParams(window.location.search).get("token")
  const [mode, setMode] = useState<AuthMode>(resetToken ? "reset" : initialMode)
  const [email, setEmail] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [password, setPassword] = useState("")
  const [passwordConfirmation, setPasswordConfirmation] = useState("")
  const [verificationCode, setVerificationCode] = useState("")
  const [birthMonth, setBirthMonth] = useState("")
  const [birthYear, setBirthYear] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setError("")
    setNotice("")
    try {
      if (mode === "sign-up") {
        if (password !== passwordConfirmation) throw new Error("The passwords do not match.")
        await auth.signUp(email, password, displayName.trim())
        localStorage.setItem(pendingProfileKey(email), JSON.stringify({
          birthMonth: birthMonth ? Number(birthMonth) : null,
          birthYear: birthYear ? Number(birthYear) : null,
        }))
        setMode("verify")
      } else if (mode === "verify") {
        if (!/^\d{6}$/.test(verificationCode)) throw new Error("Enter the six-digit code from your email.")
        await auth.verifyEmailCode(email, verificationCode)
        if (password) await auth.signIn(email, password)
        setVerificationCode("")
        setMode("sign-in")
        onOpenChange(false)
      } else if (mode === "forgot") {
        await auth.requestPasswordReset(email)
        setMode("sent")
      } else if (mode === "reset" && resetToken) {
        await auth.resetPassword(password, resetToken)
        window.history.replaceState({}, "", window.location.pathname)
        setMode("sign-in")
        setPassword("")
      } else {
        await auth.signIn(email, password)
        onOpenChange(false)
      }
    } catch (caught) {
      if (caught instanceof EmailVerificationRequiredError) {
        setMode("verify")
      } else {
        setError(caught instanceof Error ? caught.message : "Something went wrong.")
      }
    } finally {
      setBusy(false)
    }
  }

  const title = mode === "sign-up" ? "Create a learner account"
    : mode === "verify" ? "Enter your verification code"
    : mode === "forgot" ? "Reset your password"
      : mode === "reset" ? "Choose a new password"
        : mode === "sent" ? "Check your email"
          : "Sign in"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>
          {mode === "sign-up"
            ? "Save progress across devices. For a child, use a parent or guardian email and a nickname rather than a full name."
            : mode === "verify" ? "Verify the email address for this learner account."
            : mode === "sent" ? "We sent the next step to your email address."
              : "Accounts are optional — the game still works without one."}
        </DialogDescription>
        {!auth.configured ? (
          <p className="account-notice">Account services need the Neon environment variables described in the project README.</p>
        ) : mode === "sent" ? (
          <div className="mt-6 space-y-3">
            <p className="text-muted-foreground">Open the email, follow the link, then return here. You can safely close this dialog.</p>
            <Button className="w-full" onClick={() => { setMode("sign-in"); onOpenChange(false) }}>Done</Button>
          </div>
        ) : mode === "verify" ? (
          <form className="account-form" onSubmit={submit}>
            <p>We sent a six-digit code to <strong>{email}</strong>. It expires in 10 minutes.</p>
            <label>
              Verification code
              <input
                required
                className="verification-code-input"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6}"
                maxLength={6}
                value={verificationCode}
                onChange={(event) => setVerificationCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                aria-describedby="verification-code-help"
              />
            </label>
            <p id="verification-code-help" className="text-sm text-muted-foreground">Enter the numbers shown in the signup email.</p>
            {notice && <p className="account-notice" role="status">{notice}</p>}
            {error && <p className="account-error" role="alert">{error}</p>}
            <Button className="w-full" type="submit" disabled={busy || verificationCode.length !== 6}>{busy ? "Checking…" : "Verify email"}</Button>
            <div className="account-links">
              <button type="button" disabled={busy} onClick={async () => {
                setBusy(true); setError(""); setNotice("")
                try { await auth.sendVerificationCode(email); setNotice("A new code is on its way.") }
                catch (caught) { setError(caught instanceof Error ? caught.message : "Could not send another code.") }
                finally { setBusy(false) }
              }}>Send a new code</button>
              <button type="button" onClick={() => { setVerificationCode(""); setMode("sign-in") }}>Back to sign in</button>
            </div>
          </form>
        ) : (
          <form className="account-form" onSubmit={submit}>
            {mode === "sign-up" && (
              <label>Display name<input required maxLength={60} autoComplete="nickname" value={displayName} onChange={(event) => setDisplayName(event.target.value)} /></label>
            )}
            {mode !== "reset" && (
              <label>Email<input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label>
            )}
            {mode !== "forgot" && (
              <label>Password<input required minLength={8} type="password" autoComplete={mode === "sign-in" ? "current-password" : "new-password"} value={password} onChange={(event) => setPassword(event.target.value)} /></label>
            )}
            {mode === "sign-up" && <>
              <label>Confirm password<input required minLength={8} type="password" autoComplete="new-password" value={passwordConfirmation} onChange={(event) => setPasswordConfirmation(event.target.value)} /></label>
              <div className="profile-birth-fields">
                <label>Birth month (optional)<select value={birthMonth} onChange={(event) => setBirthMonth(event.target.value)}><option value="">Not set</option>{Array.from({ length: 12 }, (_, index) => <option key={index + 1} value={index + 1}>{new Date(2020, index).toLocaleString("en-NZ", { month: "long" })}</option>)}</select></label>
                <label>Birth year (optional)<input type="number" min="2000" max={new Date().getFullYear()} value={birthYear} onChange={(event) => setBirthYear(event.target.value)} /></label>
              </div>
            </>}
            {error && <p className="account-error" role="alert">{error}</p>}
            <Button className="w-full" type="submit" disabled={busy}>{busy ? "Working…" : title}</Button>
            <div className="account-links">
              {mode === "sign-in" && <><button type="button" onClick={() => setMode("sign-up")}>Create account</button><button type="button" onClick={() => setMode("forgot")}>Forgot password?</button></>}
              {mode !== "sign-in" && <button type="button" onClick={() => setMode("sign-in")}>Back to sign in</button>}
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

export function VerificationDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const auth = useAuth()
  const [code, setCode] = useState("")
  const [message, setMessage] = useState("")
  const [busy, setBusy] = useState(false)
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>Verify your email</DialogTitle>
        <DialogDescription>Cloud progress starts after the account email is verified.</DialogDescription>
        <form className="account-form" onSubmit={async (event) => {
          event.preventDefault()
          if (!auth.user) return
          setBusy(true); setMessage("")
          try {
            await auth.verifyEmailCode(auth.user.email, code)
            setCode("")
            onOpenChange(false)
          } catch (caught) { setMessage(caught instanceof Error ? caught.message : "That verification code was not accepted.") }
          finally { setBusy(false) }
        }}>
          <p>Enter the six-digit code sent to <strong>{auth.user?.email}</strong>.</p>
          <label>Verification code<input required className="verification-code-input" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} /></label>
          {message && <p className="account-notice" role="status">{message}</p>}
          <Button className="w-full" type="submit" disabled={busy || code.length !== 6}>{busy ? "Checking…" : "Verify email"}</Button>
          <Button className="w-full" disabled={busy} onClick={async () => {
            setBusy(true)
            try {
              if (!auth.user) return
              await auth.sendVerificationCode(auth.user.email)
              setMessage("A fresh verification code is on its way.")
            }
            catch (caught) { setMessage(caught instanceof Error ? caught.message : "Could not send the email.") }
            finally { setBusy(false) }
          }} type="button" variant="outline">Send a new code</Button>
          <Button variant="outline" className="w-full" type="button" onClick={async () => {
            await auth.signOut()
            onOpenChange(false)
          }}>Sign out</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function ProfileDialog({ open, onOpenChange, profile, data, syncMessage, onSave, onExport }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  profile: LearnerProfile | null
  data: StoredGameData
  syncMessage: string
  onSave: (values: Pick<LearnerProfile, "displayName" | "birthMonth" | "birthYear">) => Promise<void>
  onExport: () => void
}) {
  const auth = useAuth()
  const [displayName, setDisplayName] = useState(profile?.displayName ?? auth.user?.name ?? "")
  const [birthMonth, setBirthMonth] = useState(profile?.birthMonth ? String(profile.birthMonth) : "")
  const [birthYear, setBirthYear] = useState(profile?.birthYear ? String(profile.birthYear) : "")
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState("")
  const learningMs = useMemo(() => data.attempts.reduce((sum, attempt) => sum + Math.min(300_000, attempt.activeDurationMs ?? attempt.responseMs), 0), [data.attempts])

  const duration = learningMs < 60_000 ? `${Math.round(learningMs / 1000)} sec`
    : learningMs < 3_600_000 ? `${Math.round(learningMs / 60_000)} min`
      : `${Math.floor(learningMs / 3_600_000)} hr ${Math.round((learningMs % 3_600_000) / 60_000)} min`

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="account-profile-dialog">
        <DialogTitle><span className="inline-flex items-center gap-2"><UserRound className="size-5" /> Learner profile</span></DialogTitle>
        <DialogDescription>{syncMessage || "Progress is saved to this account and cached on this device."}</DialogDescription>
        <div className="profile-stats"><div><strong>{data.attempts.length}</strong><span>questions answered</span></div><div><strong>{duration}</strong><span>learning time</span></div></div>
        <form className="account-form" onSubmit={async (event) => {
          event.preventDefault(); setBusy(true); setMessage("")
          try {
            await onSave({ displayName: displayName.trim(), birthMonth: birthMonth ? Number(birthMonth) : null, birthYear: birthYear ? Number(birthYear) : null })
            setMessage("Profile saved.")
          } catch (caught) { setMessage(caught instanceof Error ? caught.message : "Could not save.") }
          finally { setBusy(false) }
        }}>
          <label>Display name<input required maxLength={60} value={displayName} onChange={(event) => setDisplayName(event.target.value)} /></label>
          <div className="profile-birth-fields">
            <label>Birth month (optional)<select value={birthMonth} onChange={(event) => setBirthMonth(event.target.value)}><option value="">Not set</option>{Array.from({ length: 12 }, (_, index) => <option key={index + 1} value={index + 1}>{new Date(2020, index).toLocaleString("en-NZ", { month: "long" })}</option>)}</select></label>
            <label>Birth year (optional)<input type="number" min="2000" max={new Date().getFullYear()} value={birthYear} onChange={(event) => setBirthYear(event.target.value)} /></label>
          </div>
          <label>Email<input disabled value={auth.user?.email ?? ""} /></label>
          <p className="verification-status">✓ Email verified</p>
          {message && <p className="account-notice" role="status">{message}</p>}
          <Button type="submit" disabled={!profile || busy}>{busy ? "Saving…" : "Save profile"}</Button>
        </form>
        <div className="profile-actions">
          <Button variant="outline" onClick={onExport}><Download className="size-4" /> Export JSON</Button>
          <Button variant="outline" onClick={async () => {
            await auth.signOut()
            onOpenChange(false)
          }}><LogOut className="size-4" /> Sign out</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function GuestImportDialog({ open, guestData, onImport, onFresh, busy }: { open: boolean; guestData: StoredGameData; onImport: () => void; onFresh: () => void; busy: boolean }) {
  return (
    <Dialog open={open} onOpenChange={() => undefined}>
      <DialogContent hideClose>
        <DialogTitle>Keep this device’s progress?</DialogTitle>
        <DialogDescription>This account is ready. Choose what to do with the guest learning history on this device.</DialogDescription>
        <div className="profile-stats"><div><strong>{guestData.attempts.length}</strong><span>guest questions</span></div><div><strong>{guestData.sessions.length}</strong><span>guest sessions</span></div></div>
        <div className="mt-6 grid gap-3">
          <Button disabled={busy} onClick={onImport}>Import this device’s progress</Button>
          <Button disabled={busy} variant="outline" onClick={onFresh}>Start fresh</Button>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">After this choice, the separate guest copy is removed so it cannot reappear after sign out.</p>
      </DialogContent>
    </Dialog>
  )
}
