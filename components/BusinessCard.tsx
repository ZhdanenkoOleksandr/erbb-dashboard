"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMapStore } from "@/store/useMapStore";
import { STATUS_COLORS, STATUS_LABELS } from "@/lib/types";
import { connectBusiness } from "@/lib/api";
import Card from "@/components/UI/Card";
import Button from "@/components/UI/Button";
export default function BusinessCard() {
  const { selected, selectBusiness } = useMapStore();
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);
  if (!selected) return null;
  const color = STATUS_COLORS[selected.status];
  return (
    <AnimatePresence>
      <motion.div key={selected.id} initial={{ opacity:0, x:40 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:40 }} transition={{ type:"spring", stiffness:300, damping:28 }} className="absolute bottom-8 right-4 w-72 z-10">
        <Card glowColor={color} className="p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-white font-semibold text-base">{selected.name}</h2>
              {selected.category && <p className="text-white/40 text-xs mt-0.5">{selected.category}</p>}
            </div>
            <button onClick={() => { selectBusiness(undefined); setConnected(false); }} className="text-white/40 hover:text-white/80 text-lg">x</button>
          </div>
          <div className="flex items-center gap-2 mb-4">
            <span className="w-2 h-2 rounded-full" style={{ background: color, boxShadow: `0 0 6px ${color}` }} />
            <span className="text-xs font-semibold" style={{ color }}>{STATUS_LABELS[selected.status]}</span>
          </div>
          {selected.auraScore !== undefined && (
            <div className="mb-4">
              <div className="flex justify-between text-xs text-white/50 mb-1"><span>Aura Score</span><span style={{ color }}>{selected.auraScore}/100</span></div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <motion.div initial={{ width:0 }} animate={{ width:`${selected.auraScore}%` }} transition={{ duration:0.8 }} className="h-full rounded-full" style={{ background: color }} />
              </div>
            </div>
          )}
          {selected.address && <div className="text-xs text-white/50 mb-1"><span className="text-white/30">ADDRESS  </span>{selected.address}</div>}
          {selected.phone && <div className="text-xs text-white/50 mb-4"><span className="text-white/30">PHONE    </span>{selected.phone}</div>}
          <div className="flex gap-2 mt-2">
            {selected.status==="NOT_CONNECTED" && !connected && <Button variant="primary" loading={connecting} onClick={async () => { setConnecting(true); await connectBusiness(selected.id); setConnecting(false); setConnected(true); }} className="flex-1">Connect Business</Button>}
            {connected && <div className="flex-1 text-center text-xs text-primary py-2">Connected successfully</div>}
            {selected.status!=="NOT_CONNECTED" && <Button variant="ghost" className="flex-1">View Details</Button>}
          </div>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}