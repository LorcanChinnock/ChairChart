"use client";

import dynamic from "next/dynamic";

// Run development assertions
if (process.env.NODE_ENV === "development") {
  import("../utils/devAssertions");
}

const CanvasStage = dynamic(() => import("@/components/CanvasStage"), { ssr: false });

export default function Home() {
  return <CanvasStage />;
}
