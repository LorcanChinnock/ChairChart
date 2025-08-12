"use client";

import dynamic from "next/dynamic";

const CanvasStage = dynamic(() => import("@/components/CanvasStage"), { ssr: false });

export default function Home() {
  return <CanvasStage />;
}
