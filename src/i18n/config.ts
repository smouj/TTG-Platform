// i18n configuration for TTG-Platform
// 10 supported locales with RTL support for Arabic
export const locales = ["en", "es", "fr", "de", "it", "pt", "ja", "zh", "ko", "ar"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

export const localeLabels: Record<Locale, { label: string; native: string; dir: "ltr" | "rtl" }> = {
  en: { label: "English", native: "English", dir: "ltr" },
  es: { label: "Spanish", native: "Español", dir: "ltr" },
  fr: { label: "French", native: "Français", dir: "ltr" },
  de: { label: "German", native: "Deutsch", dir: "ltr" },
  it: { label: "Italian", native: "Italiano", dir: "ltr" },
  pt: { label: "Portuguese", native: "Português", dir: "ltr" },
  ja: { label: "Japanese", native: "日本語", dir: "ltr" },
  zh: { label: "Chinese", native: "简体中文", dir: "ltr" },
  ko: { label: "Korean", native: "한국어", dir: "ltr" },
  ar: { label: "Arabic", native: "العربية", dir: "rtl" },
};
