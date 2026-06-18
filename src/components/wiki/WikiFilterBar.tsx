"use client";

interface WikiFilterBarProps {
  filters: { label: string; value: string }[];
  activeFilter: string;
  onChange: (value: string) => void;
  allLabel?: string;
}

export default function WikiFilterBar({
  filters,
  activeFilter,
  onChange,
  allLabel = "Todos",
}: WikiFilterBarProps) {
  return (
    <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filtros">
      <button
        onClick={() => onChange("")}
        className={`px-3 py-1 text-[11px] font-black uppercase border-2 transition-all ${
          activeFilter === ""
            ? "border-ttg-black bg-ttg-black text-white"
            : "border-ttg-black/20 bg-white text-ttg-black/60 hover:border-ttg-black/50"
        }`}
        style={{ boxShadow: activeFilter === "" ? "2px 2px 0 rgba(0,0,0,0.15)" : "none" }}
      >
        {allLabel}
      </button>
      {filters.map((f) => (
        <button
          key={f.value}
          onClick={() => onChange(activeFilter === f.value ? "" : f.value)}
          className={`px-3 py-1 text-[11px] font-black uppercase border-2 transition-all ${
            activeFilter === f.value
              ? "border-ttg-black bg-ttg-black text-white"
              : "border-ttg-black/20 bg-white text-ttg-black/60 hover:border-ttg-black/50"
          }`}
          style={{
            boxShadow:
              activeFilter === f.value ? "2px 2px 0 rgba(0,0,0,0.15)" : "none",
          }}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}
