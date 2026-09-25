import FaqSection from "@/components/FaqSection";
import { Footer } from "@/components/Footer";
import HeroSection from "@/components/HeroSection";
import ProductCatalog from "@/components/ProductCatalog";
import TestimonialsSection from "@/components/TestimonialsSection";

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <div className="font-montserrat relative flex min-h-screen flex-col overflow-x-hidden bg-[#010000] text-white">
      <HeroSection />

      <div className="mt-28" id="catalogo">
        <ProductCatalog />
      </div>

      {/* ADD */}

      <TestimonialsSection />
      <FaqSection />
      <Footer />
    </div>
  );
}
