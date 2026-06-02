// ============================================================
// Trading Tazos Game — i18n Core
// Context, hooks, language detection, and utilities.
// ============================================================
"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import type { Lang, Dictionary } from "./types"
import { LANGS } from "./types"
import en from "./locales/en"
import es from "./locales/es"
import pt from "./locales/pt"
import de from "./locales/de"
import fr from "./locales/fr"
import it from "./locales/it"
import ja from "./locales/ja"
import ko from "./locales/ko"
import zh from "./locales/zh"
import ru from "./locales/ru"

const DICTIONARIES: Record<Lang, Dictionary> = {
  en, es, pt, de, fr, it, ja, ko, zh, ru,
}

// ---- Language Detection ----

export function detectLang(requestedLangs?: readonly string[]): Lang {
  const FULL_MAP: Record<string, Lang> = {
    en: "en", "en-us": "en", "en-gb": "en",
    es: "es", "es-es": "es", "es-mx": "es", "es-ar": "es",
    pt: "pt", "pt-br": "pt", "pt-pt": "pt",
    de: "de", "de-de": "de", "de-at": "de", "de-ch": "de",
    fr: "fr", "fr-fr": "fr", "fr-ca": "fr", "fr-be": "fr",
    it: "it", "it-it": "it", "it-ch": "it",
    ja: "ja", "ja-jp": "ja",
    ko: "ko", "ko-kr": "ko",
    zh: "zh", "zh-cn": "zh", "zh-tw": "zh", "zh-hk": "zh",
    ru: "ru", "ru-ru": "ru",
  }

  const sources = requestedLangs || (typeof navigator !== "undefined" ? navigator.languages || [navigator.language] : [])

  for (const lang of sources) {
    const code = FULL_MAP[lang.trim().toLowerCase()]
    if (code) return code
  }

  return "en"
}

const STORAGE_KEY = "ttg-lang"

export function getSavedLang(): Lang | null {
  if (typeof localStorage === "undefined") return null
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved && DICTIONARIES[saved as Lang]) return saved as Lang
  } catch { /* ignore */ }
  return null
}

// ---- Context ----

interface I18nContextType {
  lang: Lang
  t: Dictionary
  setLang: (lang: Lang) => void
  langs: typeof LANGS
}

const I18nContext = createContext<I18nContextType | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => getSavedLang() || detectLang())

  const setLang = useCallback((newLang: Lang) => {
    setLangState(newLang)
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(STORAGE_KEY, newLang)
    }
  }, [])

  // Listen for language changes from other tabs
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue && DICTIONARIES[e.newValue as Lang]) {
        setLangState(e.newValue as Lang)
      }
    }
    window.addEventListener("storage", onStorage)
    return () => window.removeEventListener("storage", onStorage)
  }, [])

  const t = DICTIONARIES[lang]

  return (
    <I18nContext.Provider value={{ lang, t, setLang, langs: LANGS }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n(): I18nContextType {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error("useI18n must be used within I18nProvider")
  return ctx
}

// ---- Utility: get dictionary for a specific lang (non-hook) ----
export function getDict(lang: Lang): Dictionary {
  return DICTIONARIES[lang]
}
