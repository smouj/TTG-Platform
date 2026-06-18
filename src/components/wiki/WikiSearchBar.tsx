"use client";
import { useState, useEffect, useRef } from "react";
import { Search, X } from "lucide-react";

interface WikiSearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
}

export default function WikiSearchBar({
  onSearch,
  placeholder = "Buscar por nombre, ID o tipo...",
}: WikiSearchBarProps) {
  const [value, setValue] = useState("");
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onSearch(value);
    }, 200);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value, onSearch]);

  return (
    <div className="relative w-full max-w-md">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ttg-black/40" />
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-8 py-2 text-sm font-bold border-2 border-ttg-black bg-white text-ttg-black placeholder:text-ttg-black/30 outline-none"
        style={{ boxShadow: "2px 2px 0 var(--ttg-black)" }}
        aria-label="Buscar en el wiki"
      />
      {value && (
        <button
          onClick={() => setValue("")}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center hover:bg-ttg-black/10"
          aria-label="Limpiar búsqueda"
        >
          <X className="w-3 h-3 text-ttg-black/50" />
        </button>
      )}
    </div>
  );
}
