"use client";
import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { fetchBusinesses } from "@/lib/api";
import { useMapStore } from "@/store/useMapStore";
import { STATUS_COLORS, Business } from "@/lib/types";
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";
export default function MapView() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const { businesses, setBusinesses, selectBusiness, filters, setLoading } = useMapStore();
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;
    const initMap = (center: [number, number]) => {
      const map = new mapboxgl.Map({ container: mapContainerRef.current!, style: "mapbox://styles/mapbox/dark-v11", center, zoom: 14, attributionControl: false });
      map.addControl(new mapboxgl.NavigationControl(), "bottom-right");
      mapRef.current = map;
      map.on("load", () => { setLoading(true); fetchBusinesses().then((data) => { setBusinesses(data); addMarkers(map, data); }).finally(() => setLoading(false)); });
    };
    navigator.geolocation
      ? navigator.geolocation.getCurrentPosition((p) => initMap([p.coords.longitude, p.coords.latitude]), () => initMap([30.5234, 50.4501]))
      : initMap([30.5234, 50.4501]);
    return () => { mapRef.current?.remove(); mapRef.current = null; };
  }, []);
  const addMarkers = (map: mapboxgl.Map, data: Business[]) => {
    markersRef.current.forEach((m) => m.remove()); markersRef.current = [];
    data.forEach((b) => {
      const el = document.createElement("div");
      const color = STATUS_COLORS[b.status];
      const cls = b.status==="CONNECTED" ? "marker-connected" : b.status==="NOT_CONNECTED" ? "marker-not-connected" : "marker-high-potential";
      el.className = `w-4 h-4 rounded-full cursor-pointer ${cls}`;
      el.style.cssText = `background:${color};border:2px solid ${color}88`;
      el.onclick = () => selectBusiness(b);
      markersRef.current.push(new mapboxgl.Marker(el).setLngLat([b.lng, b.lat]).addTo(map));
    });
  };
  useEffect(() => {
    if (!mapRef.current || !businesses.length) return;
    const filtered = businesses.filter((b) =>
      !(b.status==="CONNECTED" && !filters.showConnected) &&
      !(b.status==="NOT_CONNECTED" && !filters.showNotConnected) &&
      !(b.status==="HIGH_POTENTIAL" && !filters.showHighPotential)
    );
    addMarkers(mapRef.current, filtered);
  }, [filters, businesses]);
  return <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" />;
}