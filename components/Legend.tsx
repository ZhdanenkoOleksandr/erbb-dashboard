"use client";
import { useMapStore } from "@/store/useMapStore";
import { STATUS_COLORS } from "@/lib/types";
const ITEMS = [
  { key: "showConnected" as const, color: STATUS_COLORS.CONNECTED, label: "Connected", cls: "marker-connected" },
  { key: "showNotConnected" as const, color: STATUS_COLORS.NOT_CONNECTED, label: "Not Connected", cls: "marker-not-connected" },
  { key: "showHighPotential" as const, color: STATUS_COLORS.HIGH_POTENTIAL, label: "High Potential", cls: "marker-high-potential" },
];
export default function Legend() {
  const { filters, setFilters } = useMapStore();
  return (
    <div className="absolute bottom-8 left-4 z-10 bg-[#131920]/90 border border-white/10 rounded-lg p-3 backdrop-blur-sm">
      <p className="text-[10px] text-white/30 uppercase tracking-widest mb-2">Filter</p>
      <div className="flex flex-col gap-2">
        {ITEMS.map(({ key, color, label, cls }) => (
          <button key={key} onClick={() => setFilters({ [key]: !filters[key] })} className={`flex items-center gap-2 text-xs transition-opacity ${filters[key] ? "opacity-100" : "opacity-40"}`}>
            <span className={`w-3 h-3 rounded-full flex-shrink-0 ${filters[key] ? cls : ""}`} style={{ background: color, border: `1.5px solid ${color}88` }} />
            <span className="text-white/70">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}