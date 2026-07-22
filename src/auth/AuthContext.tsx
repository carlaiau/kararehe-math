import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import { authErrorMessage, neonAuth, neonConfigured } from "@/services/neon"
import type { AuthUser } from "@/types/game"

/* eslint-disable react-refresh/only-export-components -- the provider and its hook form one public context API. */

interface AuthContextValue {
  configured: boolean
  pending: boolean
  user: AuthUser | null
  signUp: (email: string, password: string, displayName: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  sendVerificationCode: (email: string) => Promise<void>
  verifyEmailCode: (email: string, code: string) => Promise<void>
  requestPasswordReset: (email: string) => Promise<void>
  resetPassword: (password: string, token: string) => Promise<void>
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export class EmailVerificationRequiredError extends Error {
  constructor() {
    super("Enter the six-digit code from your verification email.")
    this.name = "EmailVerificationRequiredError"
  }
}

function mapUser(value: unknown): AuthUser | null {
  if (!value || typeof value !== "object") return null
  const user = value as Record<string, unknown>
  if (typeof user.id !== "string" || typeof user.email !== "string") return null
  return {
    id: user.id,
    email: user.email,
    name: typeof user.name === "string" ? user.name : "Learner",
    emailVerified: user.emailVerified === true,
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState(neonConfigured)
  const [user, setUser] = useState<AuthUser | null>(null)

  const refresh = async () => {
    if (!neonAuth) {
      setPending(false)
      setUser(null)
      return
    }
    try {
      const result = await neonAuth.getSession()
      setUser(mapUser(result.data?.user))
    } catch {
      setUser(null)
    } finally {
      setPending(false)
    }
  }

  useEffect(() => {
    queueMicrotask(() => void refresh())
    const handleFocus = () => void refresh()
    window.addEventListener("focus", handleFocus)
    return () => window.removeEventListener("focus", handleFocus)
  }, [])

  const value = useMemo<AuthContextValue>(() => ({
    configured: neonConfigured,
    pending,
    user,
    async signUp(email, password, displayName) {
      if (!neonAuth) throw new Error("Account services are not configured yet.")
      const result = await neonAuth.signUp.email({
        email,
        password,
        name: displayName,
        callbackURL: window.location.origin,
      })
      if (result.error) throw new Error(authErrorMessage(result.error, "Could not create the account."))
      await refresh()
    },
    async signIn(email, password) {
      if (!neonAuth) throw new Error("Account services are not configured yet.")
      const result = await neonAuth.signIn.email({ email, password })
      if (result.error) {
        const message = authErrorMessage(result.error, "Could not sign in.")
        const code = "code" in result.error && typeof result.error.code === "string" ? result.error.code : ""
        if (code === "EMAIL_NOT_VERIFIED" || /email.*not.*verified/i.test(message)) throw new EmailVerificationRequiredError()
        throw new Error(message)
      }
      await refresh()
    },
    async signOut() {
      if (neonAuth) await neonAuth.signOut()
      setUser(null)
    },
    async sendVerificationCode(email) {
      if (!neonAuth) throw new Error("Account services are not configured yet.")
      const result = await neonAuth.emailOtp.sendVerificationOtp({ email, type: "email-verification" })
      if (result.error) throw new Error(authErrorMessage(result.error, "Could not send another verification code."))
    },
    async verifyEmailCode(email, code) {
      if (!neonAuth) throw new Error("Account services are not configured yet.")
      const result = await neonAuth.emailOtp.verifyEmail({ email, otp: code })
      if (result.error) throw new Error(authErrorMessage(result.error, "That verification code was not accepted."))
      await refresh()
    },
    async requestPasswordReset(email) {
      if (!neonAuth) throw new Error("Account services are not configured yet.")
      const result = await neonAuth.requestPasswordReset({ email, redirectTo: window.location.origin })
      if (result.error) throw new Error(authErrorMessage(result.error, "Could not send the password reset email."))
    },
    async resetPassword(password, token) {
      if (!neonAuth) throw new Error("Account services are not configured yet.")
      const result = await neonAuth.resetPassword({ newPassword: password, token })
      if (result.error) throw new Error(authErrorMessage(result.error, "Could not reset the password."))
    },
    refresh,
  }), [pending, user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error("useAuth must be used inside AuthProvider")
  return value
}
