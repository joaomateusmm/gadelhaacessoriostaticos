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
    // REMOVIDO: overflow-x-hidden (Isso causava o travamento do scroll)
    <div className="font-montserrat relative flex min-h-screen flex-col bg-neutral-950">
      <HeroBanners />

      <div className="mt-5" id="catalogo">
        <ProductCatalog />
      </div>

      <ServicesSection />

      <FaqSection />

      <Footer />
    </div>
  );
}
