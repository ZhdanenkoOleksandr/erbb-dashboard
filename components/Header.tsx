"use client";
import { useMapStore } from "@/store/useMapStore";
export default function Header() {
  const { businesses, isLoading } = useMapStore();
  const stats = [
    { color:"#00FF9F", value: businesses.filter(b=>b.status==="CONNECTED").length, label:"Connected" },
    { color:"#FF4D4F", value: businesses.filter(b=>b.status==="NOT_CONNECTED").length, label:"Not Connected" },
    { color:"#FFC857", value: businesses.filter(b=>b.status==="HIGH_POTENTIAL").length, label:"Potential" },
  ];
  return (
    <header className="absolute top-0 left-0 right-0 z-10 px-4 pt-4 pb-3 flex items-center justify-between pointer-events-none">
      <div className="flex items-center gap-2 pointer-events-auto">
        <div className="w-8 h-8 rounded bg-primary/10 border border-primary/40 flex items-center justify-center">
          <span className="text-primary text-xs font-bold">BB</span>
        </div>
        <div>
          <div className="text-white text-sm font-semibold glitch">BitBon City Scanner</div>
          <div className="text-white/30 text-[10px]">v1.0.0 - live scan</div>
        </div>
      </div>
      {!isLoading && businesses.length > 0 && (
        <div className="flex gap-3 pointer-events-auto">
          {stats.map(({ color, value, label }) => (
            <div key={label} className="bg-[#131920]/80 border border-white/10 rounded px-3 py-1.5 text-center min-w-[64px]">
              <div className="text-sm font-bold" style={{ color }}>{value}</div>
              <div className="text-[9px] text-white/40 uppercase tracking-wide">{label}</div>
            </div>
          ))}
        </div>
      )}
      {isLoading && <div className="flex items-center gap-2 text-xs text-white/50 pointer-events-auto"><span className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />Scanning...</div>}
    </header>
  );
}