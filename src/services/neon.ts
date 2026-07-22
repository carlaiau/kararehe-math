import { createClient } from "@neondatabase/neon-js"

const authUrl = import.meta.env.VITE_NEON_AUTH_URL?.trim()
const dataApiUrl = import.meta.env.VITE_NEON_DATA_API_URL?.trim()

export const neonConfigured = Boolean(authUrl && dataApiUrl)

export const neon = neonConfigured
  ? createClient({
      auth: { url: authUrl! },
      dataApi: { url: dataApiUrl! },
    })
  : null

type NeonAuthCallResult = Promise<{ error: { code?: string; message?: string } | null }>

type NeonAuthWithEmailOtp = NonNullable<typeof neon>["auth"] & {
  emailOtp: {
    sendVerificationOtp: (input: { email: string; type: "email-verification" }) => NeonAuthCallResult
    verifyEmail: (input: { email: string; otp: string }) => NeonAuthCallResult
  }
}

// neon-js 0.6 beta currently narrows the integrated auth client to Better
// Auth's base surface even though Neon enables its email OTP client plugin.
export const neonAuth = neon?.auth as NeonAuthWithEmailOtp | null

export function authErrorMessage(error: unknown, fallback: string) {
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
    return error.message
  }
  return fallback
}
