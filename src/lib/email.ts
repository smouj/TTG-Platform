import { SITE_CONFIG } from "@/lib/site-config"
import nodemailer from "nodemailer"

export type EmailTemplateKey =
  | "welcome"
  | "tradeConfirmation"
  | "passwordReset"
  | "supportAutoReply"

type SendEmailInput = {
  template: EmailTemplateKey
  to: string
  variables?: Record<string, string | number | boolean | null | undefined>
}

type SendEmailResult =
  | { sent: true }
  | { sent: false; reason: "not_configured" | "request_failed" }

const SITE_URL = process.env.NEXT_PUBLIC_BASE_URL || SITE_CONFIG.canonicalUrl
const FROM_EMAIL = process.env.MAIL_FROM_EMAIL || SITE_CONFIG.supportEmail
const FROM_NAME = process.env.MAIL_FROM_NAME || `${SITE_CONFIG.name} Support`

export const OFFICIAL_EMAIL_SIGNATURE = {
  name: "Firma Profesional Soporte (Mejorada)",
  html:
    `<p style="margin:0 0 8px;font-weight:700;">${SITE_CONFIG.name} Support</p>` +
    `<p style="margin:0;">${SITE_CONFIG.tagline}</p>` +
    `<p style="margin:8px 0 0;"><a href="${SITE_CONFIG.canonicalUrl}">${SITE_CONFIG.canonicalUrl}</a></p>` +
    `<p style="margin:0;"><a href="mailto:${SITE_CONFIG.supportEmail}">${SITE_CONFIG.supportEmail}</a></p>`,
  text: `${SITE_CONFIG.name} Support\n${SITE_CONFIG.tagline}\n${SITE_CONFIG.canonicalUrl}\n${SITE_CONFIG.supportEmail}`,
} as const

export const EMAIL_TEMPLATES: Record<EmailTemplateKey, { hostingerName: string; defaultSubject: string; envTemplateId: string }> = {
  welcome: {
    hostingerName: "Bienvenida - Nuevo Usuario",
    defaultSubject: "Welcome to Trading Tazos Game",
    envTemplateId: "HOSTINGER_TEMPLATE_WELCOME_ID",
  },
  tradeConfirmation: {
    hostingerName: "Confirmacion de Intercambio",
    defaultSubject: "Your TTG trade is confirmed",
    envTemplateId: "HOSTINGER_TEMPLATE_TRADE_CONFIRMATION_ID",
  },
  passwordReset: {
    hostingerName: "Recuperacion de Contrasena",
    defaultSubject: "Reset your Trading Tazos Game password",
    envTemplateId: "HOSTINGER_TEMPLATE_PASSWORD_RESET_ID",
  },
  supportAutoReply: {
    hostingerName: "Respuesta Rapida Soporte",
    defaultSubject: "We received your Trading Tazos Game support request",
    envTemplateId: "HOSTINGER_TEMPLATE_SUPPORT_AUTOREPLY_ID",
  },
}

export function buildPasswordResetUrl(token: string): string {
  return `${SITE_URL}/reset-password?token=${encodeURIComponent(token)}`
}

export function buildEmailVerificationUrl(token: string): string {
  return `${SITE_URL}/verify-email?token=${encodeURIComponent(token)}`
}

export function isTransactionalEmailConfigured(): boolean {
  return Boolean(
    (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) ||
    (process.env.HOSTINGER_EMAIL_API_URL && process.env.HOSTINGER_EMAIL_API_TOKEN)
  )
}

function buildHtmlBody(template: EmailTemplateKey, variables: Record<string, any>): string {
  const sig = OFFICIAL_EMAIL_SIGNATURE
  const vars = { ...variables }

  let body = ""
  switch (template) {
    case "welcome":
      body = `
        <h2>Welcome to ${SITE_CONFIG.name}, ${vars.name || "Trainer"}!</h2>
        <p>Your account has been created. Start collecting tazos, building decks, and battling.</p>
        ${vars.emailVerificationUrl ? `<p><a href="${vars.emailVerificationUrl}" style="display:inline-block;padding:10px 20px;background:#E3350D;color:#fff;text-decoration:none;font-weight:bold;border-radius:4px;">Verify Your Email</a></p>` : ""}
        <p>Or copy this link: ${vars.emailVerificationUrl || ""}</p>
      `
      break
    case "passwordReset":
      body = `
        <h2>Password Reset Request</h2>
        <p>Hi ${vars.name || "Trainer"}, you requested a password reset.</p>
        <p><a href="${vars.resetUrl}" style="display:inline-block;padding:10px 20px;background:#E3350D;color:#fff;text-decoration:none;font-weight:bold;border-radius:4px;">Reset Your Password</a></p>
        <p>This link expires in ${vars.expiresIn || "1 hour"}.</p>
        <p>If you didn't request this, ignore this email.</p>
      `
      break
    case "tradeConfirmation":
      body = `
        <h2>Trade Confirmed!</h2>
        <p>Hi ${vars.name || "Trainer"}, your trade has been processed successfully.</p>
        <p>${vars.tradeDetails || ""}</p>
        <p>Check your collection to see your new tazos.</p>
      `
      break
    case "supportAutoReply":
      body = `
        <h2>We Received Your Message</h2>
        <p>Hi ${vars.name || "Trainer"}, thanks for contacting ${SITE_CONFIG.name} Support.</p>
        <p>We'll get back to you as soon as possible.</p>
      `
      break
  }

  return `
    <div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;color:var(--ttg-black);">
      <div style="background:var(--ttg-black);padding:16px;text-align:center;">
        <h1 style="color:#FFCC00;margin:0;font-size:20px;">${SITE_CONFIG.name}</h1>
        <p style="color:#fff;margin:4px 0 0;font-size:12px;">${SITE_CONFIG.tagline}</p>
      </div>
      <div style="padding:24px;background:#fff;border:2px solid var(--ttg-black);">
        ${body}
      </div>
      <div style="padding:16px;background:#f5f5f5;border:2px solid var(--ttg-black);border-top:0;">
        ${sig.html}
      </div>
    </div>
  `
}

function buildTextBody(template: EmailTemplateKey, variables: Record<string, any>): string {
  const sig = OFFICIAL_EMAIL_SIGNATURE
  const vars = { ...variables }

  let body = ""
  switch (template) {
    case "welcome":
      body = `Welcome to ${SITE_CONFIG.name}, ${vars.name || "Trainer"}!\n\nYour account has been created. Verify your email: ${vars.emailVerificationUrl || ""}\n\nStart collecting tazos, building decks, and battling at ${SITE_URL}`
      break
    case "passwordReset":
      body = `Hi ${vars.name || "Trainer"},\n\nReset your password: ${vars.resetUrl}\n\nThis link expires in ${vars.expiresIn || "1 hour"}.\n\nIf you didn't request this, ignore this email.`
      break
    case "tradeConfirmation":
      body = `Hi ${vars.name || "Trainer"},\n\nYour trade has been processed.\n${vars.tradeDetails || ""}\n\nCheck your collection: ${SITE_URL}/app/collection`
      break
    case "supportAutoReply":
      body = `Hi ${vars.name || "Trainer"},\n\nWe received your message. ${SITE_CONFIG.name} Support will get back to you soon.\n\n${SITE_URL}`
      break
  }

  return `${body}\n\n---\n${sig.text}`
}

/** Primary: SMTP via nodemailer. Fallback: Hostinger HTTP API. */
export async function sendTransactionalEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const template = EMAIL_TEMPLATES[input.template]
  const vars = {
    siteName: SITE_CONFIG.name,
    siteUrl: SITE_URL,
    supportEmail: SITE_CONFIG.supportEmail,
    tagline: SITE_CONFIG.tagline,
    ...input.variables,
  }

  // ── SMTP (primary) ──
  const smtpHost = process.env.SMTP_HOST
  const smtpUser = process.env.SMTP_USER
  const smtpPass = process.env.SMTP_PASS

  if (smtpHost && smtpUser && smtpPass) {
    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: parseInt(process.env.SMTP_PORT || "465"),
        secure: process.env.SMTP_SECURE !== "false",
        auth: { user: smtpUser, pass: smtpPass },
      })

      await transporter.sendMail({
        from: { name: FROM_NAME, address: FROM_EMAIL },
        replyTo: SITE_CONFIG.supportEmail,
        to: input.to,
        subject: template.defaultSubject,
        html: buildHtmlBody(input.template, vars),
        text: buildTextBody(input.template, vars),
      })

      console.log(`[email] ${input.template} sent to ${input.to} via SMTP`)
      return { sent: true }
    } catch (error) {
      console.error(`[email] ${input.template} SMTP failed:`, error)
      // Fall through to HTTP API
    }
  }

  // ── HTTP API (fallback) ──
  const endpoint = process.env.HOSTINGER_EMAIL_API_URL
  const token = process.env.HOSTINGER_EMAIL_API_TOKEN

  if (!endpoint || !token) {
    console.warn(`[email] skipped ${input.template}: SMTP failed and HTTP API is not configured`)
    return { sent: false, reason: "not_configured" }
  }

  const templateId = process.env[template.envTemplateId]
  const payload = {
    template: template.hostingerName,
    templateId,
    subject: template.defaultSubject,
    from: { name: FROM_NAME, email: FROM_EMAIL },
    replyTo: SITE_CONFIG.supportEmail,
    to: input.to,
    variables: {
      ...vars,
      signatureName: OFFICIAL_EMAIL_SIGNATURE.name,
      signatureHtml: OFFICIAL_EMAIL_SIGNATURE.html,
      signatureText: OFFICIAL_EMAIL_SIGNATURE.text,
    },
  }

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const body = await response.text().catch(() => "")
      console.error(`[email] ${input.template} HTTP API failed: ${response.status} ${body.slice(0, 300)}`)
      return { sent: false, reason: "request_failed" }
    }

    console.log(`[email] ${input.template} sent to ${input.to} via HTTP API`)
    return { sent: true }
  } catch (error) {
    console.error(`[email] ${input.template} HTTP API failed:`, error)
    return { sent: false, reason: "request_failed" }
  }
}

export function sendTransactionalEmailSoon(input: SendEmailInput): void {
  sendTransactionalEmail(input).catch((error) => {
    console.error(`[email] ${input.template} failed:`, error)
  })
}
