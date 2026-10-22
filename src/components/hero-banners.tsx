"use client";

import Image from "next/image";
import Link from "next/link";

export function HeroBanners() {
  return (
    <section className="sticky top-0 -z-10 h-screen w-full overflow-hidden bg-neutral-950">
      <div className="relative h-full w-full">
        <Image
          src="/banners/banner1.webp"
          alt="Banner Principal"
          fill
          priority
          className="h-full w-full object-cover object-center brightness-90"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/30 to-black/40" />
      </div>
    </section>
  );
}
