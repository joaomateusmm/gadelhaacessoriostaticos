"use client";

import { ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react";
import Image from "next/image";
import {
  type MouseEvent,
  type RefObject,
  type TouchEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/utils";

interface ProductGalleryProps {
  images: string[];
  productName: string;
}

const PLACEHOLDER =
  "https://placehold.co/800x800/f5f5f5/a3a3a3.png?text=Sem+Imagem";

/* -------------------------------------------------------------------------- */
/* Hooks auxiliares                                                           */
/* -------------------------------------------------------------------------- */

/** Swipe horizontal para celular. `consumeSwipe` evita abrir/zoomar após arrastar. */
function useSwipe(onPrev: () => void, onNext: () => void, disabled = false) {
  const start = useRef<{ x: number; y: number } | null>(null);
  const swiped = useRef(false);

  return {
    handlers: {
      onTouchStart: (e: TouchEvent) => {
        const t = e.touches[0];
        start.current = { x: t.clientX, y: t.clientY };
        swiped.current = false;
      },
      onTouchEnd: (e: TouchEvent) => {
        if (!start.current || disabled) return;
        const t = e.changedTouches[0];
        const dx = t.clientX - start.current.x;
        const dy = t.clientY - start.current.y;
        start.current = null;
        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
          swiped.current = true;
          if (dx < 0) onNext();
          else onPrev();
        }
      },
    },
    consumeSwipe: () => {
      const value = swiped.current;
      swiped.current = false;
      return value;
    },
  };
}

/** Mantém a miniatura ativa centralizada dentro do próprio container (sem rolar a página). */
function useCenterChild(ref: RefObject<HTMLDivElement | null>, index: number) {
  useEffect(() => {
    const container = ref.current;
    const el = container?.children[index] as HTMLElement | undefined;
    if (!container || !el) return;
    container.scrollTo({
      top: el.offsetTop - container.clientHeight / 2 + el.offsetHeight / 2,
      left: el.offsetLeft - container.clientWidth / 2 + el.offsetWidth / 2,
      behavior: "smooth",
    });
  }, [ref, index]);
}

/** Define o ponto de origem do zoom conforme a posição do mouse/toque. */
function setZoomOrigin(
  layer: HTMLDivElement | null,
  area: HTMLElement,
  clientX: number,
  clientY: number,
) {
  if (!layer) return;
  const rect = area.getBoundingClientRect();
  const x = ((clientX - rect.left) / rect.width) * 100;
  const y = ((clientY - rect.top) / rect.height) * 100;
  layer.style.transformOrigin = `${x}% ${y}%`;
}

/* -------------------------------------------------------------------------- */
/* Miniatura                                                                  */
/* -------------------------------------------------------------------------- */

function Thumb({
  src,
  alt,
  active,
  onClick,
  className,
}: {
  src: string;
  alt: string;
  active: boolean;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={alt}
      aria-current={active}
      className={cn(
        "relative shrink-0 cursor-pointer overflow-hidden border bg-white transition focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 focus-visible:outline-none",
        active
          ? "border-neutral-900"
          : "border-neutral-200 opacity-70 hover:border-neutral-400 hover:opacity-100",
        className,
      )}
    >
      <Image
        src={src}
        alt=""
        fill
        sizes="80px"
        className="object-contain p-0.5"
      />
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/* Lightbox (galeria em tela cheia)                                           */
/* -------------------------------------------------------------------------- */

function Lightbox({
  images,
  productName,
  index,
  onSelect,
  onPrev,
  onNext,
  onClose,
}: {
  images: string[];
  productName: string;
  index: number;
  onSelect: (i: number) => void;
  onPrev: () => void;
  onNext: () => void;
  onClose: () => void;
}) {
  // Guarda QUAL imagem está com zoom: ao trocar de foto o zoom some sozinho
  const [zoomedIndex, setZoomedIndex] = useState<number | null>(null);
  const zoomed = zoomedIndex === index;

  const total = images.length;
  const layerRef = useRef<HTMLDivElement>(null);
  const thumbsRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const swipe = useSwipe(onPrev, onNext, zoomed);

  useCenterChild(thumbsRef, index);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") onPrev();
      else if (e.key === "ArrowRight") onNext();
    };
    window.addEventListener("keydown", onKey);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose, onPrev, onNext]);

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Galeria de fotos de ${productName}`}
      className="fixed inset-0 z-[100] flex flex-col bg-white"
    >
      {/* Barra superior */}
      <div className="flex items-center justify-between gap-4 px-4 py-3 md:px-6">
        <span className="text-sm text-neutral-500 tabular-nums">
          {index + 1} / {total}
        </span>
        <p className="hidden min-w-0 flex-1 truncate text-center text-sm text-neutral-900 uppercase md:block">
          {productName}
        </p>
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Fechar galeria"
          className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-neutral-900 transition hover:bg-neutral-100 focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:outline-none"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      {/* Imagem */}
      <div
        className="relative min-h-0 flex-1 overflow-hidden"
        {...swipe.handlers}
        onMouseMove={(e: MouseEvent<HTMLDivElement>) => {
          if (zoomed)
            setZoomOrigin(
              layerRef.current,
              e.currentTarget,
              e.clientX,
              e.clientY,
            );
        }}
      >
        <button
          type="button"
          aria-label={zoomed ? "Reduzir imagem" : "Ampliar imagem"}
          onClick={(e) => {
            if (swipe.consumeSwipe()) return;
            setZoomOrigin(
              layerRef.current,
              e.currentTarget,
              e.clientX,
              e.clientY,
            );
            setZoomedIndex(zoomed ? null : index);
          }}
          className={cn(
            "absolute inset-0 focus-visible:outline-none",
            zoomed ? "cursor-zoom-out" : "cursor-zoom-in",
          )}
        >
          <div
            ref={layerRef}
            className={cn(
              "absolute inset-0 transition-transform duration-300 ease-out",
              zoomed ? "scale-[2.5]" : "scale-100",
            )}
          >
            <Image
              key={images[index]}
              src={images[index]}
              alt={`${productName} - Imagem ${index + 1}`}
              fill
              sizes="100vw"
              quality={90}
              priority
              className="object-contain p-4 md:p-10 w-full h-full"
            />
          </div>
        </button>

        {total > 1 && !zoomed && (
          <>
            <button
              type="button"
              onClick={onPrev}
              aria-label="Foto anterior"
              className="absolute top-1/2 left-3 hidden h-12 w-12 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-900 shadow-sm transition hover:bg-neutral-50 md:flex"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              type="button"
              onClick={onNext}
              aria-label="Próxima foto"
              className="absolute top-1/2 right-3 hidden h-12 w-12 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-900 shadow-sm transition hover:bg-neutral-50 md:flex"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </>
        )}
      </div>

      {/* Miniaturas */}
      {total > 1 && (
        <div
          ref={thumbsRef}
          className="relative flex gap-2 overflow-x-auto border-t border-neutral-200 p-3 [scrollbar-width:none] md:p-4 [&::-webkit-scrollbar]:hidden [&>:first-child]:ml-auto [&>:last-child]:mr-auto"
        >
          {images.map((src, i) => (
            <Thumb
              key={`${src}-${i}`}
              src={src}
              alt={`Ver foto ${i + 1}`}
              active={i === index}
              onClick={() => onSelect(i)}
              className="h-16 w-16 md:h-20 md:w-20"
            />
          ))}
        </div>
      )}
    </div>,
    document.body,
  );
}

/* -------------------------------------------------------------------------- */
/* Galeria principal                                                          */
/* -------------------------------------------------------------------------- */

export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const safeImages = images.length > 0 ? images : [PLACEHOLDER];
  const total = safeImages.length;

  const [selected, setSelected] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const zoomLayerRef = useRef<HTMLDivElement>(null);
  const thumbsRef = useRef<HTMLDivElement>(null);

  const goPrev = useCallback(
    () => setSelected((i) => (i - 1 + total) % total),
    [total],
  );
  const goNext = useCallback(
    () => setSelected((i) => (i + 1) % total),
    [total],
  );
  const closeLightbox = useCallback(() => setLightboxOpen(false), []);

  const swipe = useSwipe(goPrev, goNext);
  useCenterChild(thumbsRef, selected);

  return (
    <div className="flex flex-col gap-3 md:flex-row-reverse md:gap-4 w-full">
      {/* IMAGEM PRINCIPAL: quadrada no celular/tablet; no desktop preenche a altura disponível */}
      <div
        className="group relative aspect-square w-full min-w-0 overflow-hidden border border-neutral-200 bg-white md:flex-1"
        {...swipe.handlers}
        onMouseMove={(e) =>
          setZoomOrigin(
            zoomLayerRef.current,
            e.currentTarget,
            e.clientX,
            e.clientY,
          )
        }
      >
        <button
          type="button"
          onClick={() => {
            if (swipe.consumeSwipe()) return;
            setLightboxOpen(true);
          }}
          aria-label="Abrir galeria de fotos"
          className="absolute inset-0 cursor-zoom-in focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:outline-none focus-visible:ring-inset"
        >
          {/* Camada de zoom: só aplica em dispositivos com mouse (hover) */}
          <div
            ref={zoomLayerRef}
            className="absolute inset-0 transition-transform duration-200 ease-out group-hover:scale-[2]"
          >
            <Image
              src={safeImages[selected]}
              alt={`${productName} - Imagem ${selected + 1}`}
              fill
              sizes="(min-width: 1024px) 800px, 100vw"
              quality={90}
              priority
              className="object-contain"
            />
          </div>
        </button>

        <span className="pointer-events-none absolute top-3 right-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-neutral-700 shadow-sm">
          <ZoomIn className="h-4 w-4" />
        </span>

        {total > 1 && (
          <>
            <span className="pointer-events-none absolute bottom-3 left-3 z-10 bg-white/90 px-2.5 py-1 text-xs text-neutral-700 tabular-nums shadow-sm">
              {selected + 1} / {total}
            </span>

            {/* Setas: aparecem ao passar o mouse (no celular, use o swipe) */}
            <button
              type="button"
              onClick={goPrev}
              aria-label="Foto anterior"
              className="absolute top-1/2 left-3 z-10 flex h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-900 opacity-0 shadow-sm transition group-hover:opacity-100 hover:bg-neutral-50 focus-visible:opacity-100"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={goNext}
              aria-label="Próxima foto"
              className="absolute top-1/2 right-3 z-10 flex h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-900 opacity-0 shadow-sm transition group-hover:opacity-100 hover:bg-neutral-50 focus-visible:opacity-100"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
      </div>

      {/* MINIATURAS: coluna à esquerda no desktop, linha abaixo no celular */}
      {total > 1 && (
        <div className="md:relative md:w-20 md:shrink-0">
          <div
            ref={thumbsRef}
            className="relative flex gap-2 overflow-x-auto [scrollbar-width:none] md:absolute md:inset-0 md:flex-col md:gap-3 md:overflow-x-hidden md:overflow-y-auto [&::-webkit-scrollbar]:hidden"
          >
            {safeImages.map((src, i) => (
              <Thumb
                key={`${src}-${i}`}
                src={src}
                alt={`Ver foto ${i + 1}`}
                active={i === selected}
                onClick={() => setSelected(i)}
                className="h-16 w-16 md:h-20 md:w-20"
              />
            ))}
          </div>
        </div>
      )}

      {lightboxOpen && (
        <Lightbox
          images={safeImages}
          productName={productName}
          index={selected}
          onSelect={setSelected}
          onPrev={goPrev}
          onNext={goNext}
          onClose={closeLightbox}
        />
      )}
    </div>
  );
}
