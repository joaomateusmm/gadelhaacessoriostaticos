"use client";

import Image from "next/image";
import Link from "next/link";

export function HeroBanners() {
  return (
    <section className="relative w-full overflow-hidden bg-neutral-950 pt-[120px] md:pt-[120px]">
      <div className="relative h-[400px] w-full sm:h-[500px] md:h-[600px] lg:h-[700px]">
        <Image
          src="/banners/banner1.jpg"
          alt="Banner Principal"
          fill
          priority
          className="h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/80 via-neutral-950/20 to-transparent" />
      </div>
    </section>
  );
}
