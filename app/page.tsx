"use client";
import MapView from "@/components/MapView";
import BusinessCard from "@/components/BusinessCard";
import Header from "@/components/Header";
import Legend from "@/components/Legend";
export default function Home() {
  return (
    <main className="relative w-screen h-screen overflow-hidden bg-bg">
      <MapView />
      <Header />
      <Legend />
      <BusinessCard />
    </main>
  );
}