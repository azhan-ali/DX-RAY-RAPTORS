"use client";

import Header from "@/components/Header";
import HeroScore from "@/components/HeroScore";
import VitalSigns from "@/components/VitalSigns";
import ECGSparklines from "@/components/ECGSparklines";
import CausalChain from "@/components/CausalChain";
import TimeMachine from "@/components/TimeMachine";
import DXGhost from "@/components/DXGhost";
import Recommendations from "@/components/Recommendations";
import BeforeAfter from "@/components/BeforeAfter";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main>
        <HeroScore />
        <VitalSigns />
        <ECGSparklines />
        <CausalChain />
        <TimeMachine />
        <DXGhost />
        <Recommendations />
        <BeforeAfter />
      </main>
      <Footer />
    </div>
  );
}
