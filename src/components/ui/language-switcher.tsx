// ============================================================
// Trading Tazos Game — Language Switcher
// Dropdown to change the UI language.
// ============================================================
"use client"

import { useI18n } from "@/lib/i18n"
import { Globe } from "lucide-react"

export default function LanguageSwitcher() {
  const { lang, setLang, langs } = useI18n()

  return (
    <div className="relative group">
      <button className="flex items-center gap-1 px-2 py-1.5 bg-white border-2 border-[#1a1a1a]/30 rounded text-[10px] font-bold text-[#1a1a1a]/60 hover:border-[#1a1a1a] hover:text-[#1a1a1a] transition-all uppercase tracking-wider">
        <Globe className="w-3 h-3" />
        {lang}
      </button>
      <div className="absolute right-0 top-full mt-1 bg-white border-2 border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a] rounded z-50 hidden group-hover:block min-w-[140px]">
        <div className="max-h-[200px] overflow-y-auto custom-scrollbar py-1">
          {langs.map((l) => (
            <button
              key={l.code}
              onClick={() => setLang(l.code)}
              className={`w-full text-left px-3 py-1.5 text-xs hover:bg-[#FFCB0510] transition-colors ${
                lang === l.code
                  ? "font-black text-[#1a1a1a] bg-[#FFCB0530]"
                  : "font-bold text-[#1a1a1a]/60"
              }`}
            >
              {l.nativeLabel}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
