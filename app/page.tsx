"use client";

import dynamic from "next/dynamic";

const HomeClient = dynamic(() => import("@/components/home-client"), {
  ssr: false,
  loading: () => null,
});

export default function Home() {
  return <HomeClient />;
}
