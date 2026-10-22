import FaqSection from "@/components/FaqSection";
// FloatingScrollbar removido daqui, pois já está no Layout
import { Footer } from "@/components/Footer";
import { HeroBanners } from "@/components/hero-banners";
import ProductCatalog from "@/components/ProductCatalog";
import { ServicesSection } from "@/components/services-section";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function Home() {
  return (
    <div className="font-montserrat relative flex min-h-screen flex-col bg-neutral-950">
      <HeroBanners />

      <div className="relative z-10 shadow-2xl" id="catalogo">
        <ProductCatalog />
      </div>

      <div className="relative z-10 bg-neutral-950">
        <ServicesSection />
        <FaqSection />
        <Footer />
      </div>
    </div>
  );
}
