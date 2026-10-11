"use client";

import {
  Check,
  Copy,
  ImagePlus,
  Layers,
  Plus,
  Star,
  Trash2,
  X,
} from "lucide-react";
import Image from "next/image";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { UploadButton } from "@/lib/uploadthing";

export interface VariantItem {
  id?: string;
  sku?: string | null;
  name?: string | null;
  price?: number | null; // Centavos ou reais
  discountPrice?: number | null;
  stock: number;
  isStockUnlimited: boolean;
  /** Fotos individuais desta variante/cor (substituem as fotos gerais do produto na galeria) */
  images?: string[] | null;
  /** @deprecated use images[] — mantido para compatibilidade com dados legados */
  image?: string | null;
  attributes: Record<string, string>;
}

interface VariantMatrixProps {
  cores: string[];
  tamanhos: string[];
  basePrice?: number; // em centavos
  baseStock?: number;
  variants: VariantItem[];
  onChange: (variants: VariantItem[]) => void;
  /** Recebe a URL da imagem selecionada como capa geral */
  onSetCover?: (imageUrl: string) => void;
}

/** Retorna as fotos da variante, com fallback para o campo legado `image` */
function getVariantImages(v: VariantItem): string[] {
  if (v.images && v.images.length > 0) return v.images;
  return v.image ? [v.image] : [];
}

export function VariantMatrix({
  cores,
  tamanhos,
  baseStock = 0,
  variants,
  onChange,
  onSetCover,
}: VariantMatrixProps) {
  const [globalStock, setGlobalStock] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [coverError, setCoverError] = useState(false);

  // Gera a matriz cartesiana de Cores x Tamanhos
  const gerarCombinacoes = () => {
    const combinacoes: VariantItem[] = [];

    const listCores = cores.length > 0 ? cores : [""];
    const listTamanhos = tamanhos.length > 0 ? tamanhos : [""];

    if (cores.length === 0 && tamanhos.length === 0) return;

    for (const cor of listCores) {
      for (const tam of listTamanhos) {
        const attrs: Record<string, string> = {};
        if (cor) attrs["Cor"] = cor;
        if (tam) attrs["Tamanho"] = tam;

        const labelParts = [cor, tam].filter(Boolean);
        const name = labelParts.join(" / ");

        // Procura se já existia no estado atual
        const existing = variants.find((v) => {
          const vCor = v.attributes?.["Cor"] || v.attributes?.["cor"] || "";
          const vTam =
            v.attributes?.["Tamanho"] || v.attributes?.["tamanho"] || "";
          return (cor ? vCor === cor : true) && (tam ? vTam === tam : true);
        });

        if (existing) {
          combinacoes.push(existing);
        } else {
          combinacoes.push({
            sku: "",
            name: name,
            price: null,
            discountPrice: null,
            stock: baseStock || 0,
            isStockUnlimited: false,
            images: [],
            attributes: attrs,
          });
        }
      }
    }

    onChange(combinacoes);
  };

  const aplicarEstoqueGlobal = () => {
    const val = parseInt(globalStock, 10);
    if (isNaN(val)) return;
    const updated = variants.map((v) => ({
      ...v,
      stock: val,
    }));
    onChange(updated);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const updateItem = (index: number, updates: Partial<VariantItem>) => {
    const updated = [...variants];
    updated[index] = { ...updated[index], ...updates };
    onChange(updated);
  };

  const removeItem = (index: number) => {
    const updated = variants.filter((_, i) => i !== index);
    onChange(updated);
  };

  /** Define uma imagem da variante como capa geral do produto */
  const handleSetCover = (url: string) => {
    if (!onSetCover) {
      console.error(
        "[VariantMatrix] A prop `onSetCover` não foi passada pelo componente pai.",
      );
      setCoverError(true);
      return;
    }
    setCoverError(false);
    onSetCover(url);
    setCoverUrl(url);
  };

  /** Adiciona uma ou mais fotos (URLs) à variante */
  const addImages = (variantIndex: number, urls: string[]) => {
    const current = getVariantImages(variants[variantIndex]);
    updateItem(variantIndex, {
      images: [...current, ...urls],
    });
  };

  /** Remove uma foto específica da variante pelo índice da foto */
  const removeImage = (variantIndex: number, imageIndex: number) => {
    const current = getVariantImages(variants[variantIndex]);
    updateItem(variantIndex, {
      images: current.filter((_, i) => i !== imageIndex),
      image: null,
    });
  };

  return (
    <Card className="rounded-none border-neutral-800 bg-neutral-950 shadow-none">
      <CardHeader>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 font-mono text-sm font-bold tracking-normal text-white uppercase">
              <Layers className="h-5 w-5 text-orange-500" /> Matriz de Variações
              e Estoque
            </CardTitle>
            <CardDescription className="font-mono text-xs text-neutral-500">
              Cada variante pode ter fotos, estoque e preço exclusivos.
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={gerarCombinacoes}
              className="h-8 rounded-none border-neutral-800 bg-neutral-900 font-mono text-xs text-orange-400 hover:border-orange-500 hover:text-white"
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" /> Gerar Combinações
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {variants.length > 0 ? (
          <>
            {/* Barra de ação em lote */}
            <div className="flex flex-wrap items-center gap-3 rounded border border-neutral-900 bg-neutral-900/50 p-2.5">
              <span className="font-mono text-xs text-neutral-400">
                Aplicar Estoque em Lote:
              </span>
              <Input
                type="number"
                placeholder="Ex: 10"
                value={globalStock}
                onChange={(e) => setGlobalStock(e.target.value)}
                className="h-8 w-24 rounded-none border-neutral-800 bg-neutral-950 font-mono text-xs text-white"
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={aplicarEstoqueGlobal}
                className="h-8 rounded-none border-neutral-800 font-mono text-xs text-neutral-300 hover:text-white"
              >
                {copied ? (
                  <Check className="mr-1.5 h-3.5 w-3.5 text-green-500" />
                ) : (
                  <Copy className="mr-1.5 h-3.5 w-3.5" />
                )}
                Aplicar a Todas ({variants.length})
              </Button>
            </div>

            {/* Cards de Variante (substituem a tabela para comportar galeria de fotos) */}
            <div className="space-y-3">
              {variants.map((v, idx) => {
                const cor =
                  v.attributes?.["Cor"] || v.attributes?.["cor"] || "-";
                const tam =
                  v.attributes?.["Tamanho"] || v.attributes?.["tamanho"] || "-";
                // Compatibilidade: se tiver image legado e images vazio, mostra o legado
                const variantImages = getVariantImages(v);

                return (
                  <div
                    key={idx}
                    className="rounded border border-neutral-800 bg-neutral-900/30"
                  >
                    {/* Cabeçalho da variante */}
                    <div className="flex flex-wrap items-center gap-3 border-b border-neutral-800 p-3">
                      <span className="inline-block rounded bg-neutral-800 px-2.5 py-1 font-mono text-xs font-bold text-orange-400">
                        {cor} / {tam}
                      </span>

                      {/* SKU */}
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[10px] text-neutral-500 uppercase">
                          SKU:
                        </span>
                        <Input
                          placeholder="SKU-VAR"
                          value={v.sku || ""}
                          onChange={(e) =>
                            updateItem(idx, { sku: e.target.value })
                          }
                          className="h-7 w-28 rounded-none border-neutral-800 bg-neutral-950 font-mono text-xs text-white"
                        />
                      </div>

                      {/* Estoque */}
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[10px] text-neutral-500 uppercase">
                          Estoque:
                        </span>
                        <Input
                          type="number"
                          min={0}
                          disabled={v.isStockUnlimited}
                          value={v.stock}
                          onChange={(e) =>
                            updateItem(idx, {
                              stock: parseInt(e.target.value, 10) || 0,
                            })
                          }
                          className="h-7 w-20 rounded-none border-neutral-800 bg-neutral-950 font-mono text-xs text-white"
                        />
                      </div>

                      {/* Ilimitado */}
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[10px] text-neutral-500 uppercase">
                          Ilimitado:
                        </span>
                        <Switch
                          checked={v.isStockUnlimited}
                          onCheckedChange={(checked) =>
                            updateItem(idx, { isStockUnlimited: checked })
                          }
                        />
                      </div>

                      {/* Preço */}
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[10px] text-neutral-500 uppercase">
                          Preço R$:
                        </span>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Padrão"
                          value={
                            v.price != null ? (v.price / 100).toFixed(2) : ""
                          }
                          onChange={(e) => {
                            const val = e.target.value;
                            updateItem(idx, {
                              price: val
                                ? Math.round(parseFloat(val) * 100)
                                : null,
                            });
                          }}
                          className="h-7 w-24 rounded-none border-neutral-800 bg-neutral-950 font-mono text-xs text-white"
                        />
                      </div>

                      {/* Botão remover variante */}
                      <div className="ml-auto">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(idx)}
                          className="h-7 w-7 p-0 text-neutral-600 hover:text-red-400"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                    {/* --- GALERIA DE FOTOS DA VARIANTE --- */}
                    <div className="p-3">
                      <div className="mb-2 flex items-center gap-2">
                        <ImagePlus className="h-3.5 w-3.5 text-neutral-500" />
                        <span className="font-mono text-[10px] text-neutral-400 uppercase">
                          Fotos da variante{" "}
                          <span className="text-orange-400">{cor}</span>
                          {variantImages.length > 0 && (
                            <span className="ml-1 text-neutral-600">
                              ({variantImages.length} foto
                              {variantImages.length !== 1 ? "s" : ""})
                            </span>
                          )}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-start gap-2">
                        {/* Thumbnails das fotos já carregadas */}
                        {variantImages.map((imgUrl, imgIdx) => {
                          const isCover = coverUrl === imgUrl;
                          return (
                            <div
                              key={imgIdx}
                              className={`group relative h-24 w-24 shrink-0 overflow-hidden rounded border bg-neutral-900 ${
                                isCover
                                  ? "border-emerald-500 ring-2 ring-emerald-500/60"
                                  : "border-neutral-700"
                              }`}
                            >
                              <Image
                                src={imgUrl}
                                alt={`${cor} - foto ${imgIdx + 1}`}
                                fill
                                sizes="96px"
                                className="object-cover"
                              />

                              {/* Selo de capa atual */}
                              {isCover && (
                                <span className="absolute top-1 left-1 z-10 flex items-center gap-1 rounded bg-emerald-600 px-1.5 py-0.5 font-mono text-[9px] font-bold text-white">
                                  <Check className="h-3 w-3" /> CAPA
                                </span>
                              )}

                              {/* Índice da foto */}
                              <span className="absolute top-1 right-1 z-10 rounded bg-black/60 px-1 font-mono text-[9px] text-white/80">
                                {imgIdx + 1}
                              </span>

                              {/* Overlay com botões de ação (sempre visível no mobile) */}
                              <div className="absolute inset-0 z-20 flex flex-col items-stretch justify-end gap-1.5 bg-black/50 p-1.5 opacity-100 transition-opacity focus-within:opacity-100 md:opacity-0 md:group-hover:opacity-100">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleSetCover(imgUrl);
                                  }}
                                  className="flex h-8 w-full cursor-pointer items-center justify-center gap-1 rounded bg-emerald-600 font-mono text-[10px] font-bold text-white transition hover:bg-emerald-500 active:scale-95"
                                  title="Definir como capa do produto"
                                >
                                  <Star
                                    className={`h-4 w-4 ${isCover ? "fill-current" : ""}`}
                                  />
                                  {isCover ? "É A CAPA" : "CAPA"}
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    removeImage(idx, imgIdx);
                                  }}
                                  className="flex h-8 w-full cursor-pointer items-center justify-center gap-1 rounded bg-red-600 font-mono text-[10px] font-bold text-white transition hover:bg-red-500 active:scale-95"
                                  title="Remover foto"
                                >
                                  <X className="h-4 w-4" /> REMOVER
                                </button>
                              </div>
                            </div>
                          );
                        })}

                        {/* Botão de adicionar mais fotos */}
                        <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded border border-dashed border-neutral-700 bg-neutral-900/50">
                          <UploadButton
                            endpoint="imageUploader"
                            onClientUploadComplete={(res) => {
                              if (res && res.length > 0) {
                                addImages(
                                  idx,
                                  res.map((f) => f.url),
                                );
                              }
                            }}
                            onUploadError={(error) => {
                              console.error("Erro ao fazer upload:", error);
                            }}
                            appearance={{
                              button:
                                "h-full w-full rounded-none bg-transparent font-mono text-[10px] text-orange-400 hover:text-orange-300 ut-uploading:bg-neutral-800",
                              allowedContent: "hidden",
                              container: "h-full w-full",
                            }}
                            content={{
                              button: (
                                <div className="flex flex-col items-center gap-1">
                                  <ImagePlus className="h-5 w-5" />
                                  <span className="text-[9px]">Adicionar</span>
                                </div>
                              ),
                            }}
                          />
                        </div>
                      </div>

                      {coverError && (
                        <p className="mt-2 font-mono text-[10px] text-red-400">
                          Não foi possível definir a capa: o componente pai não
                          passou a prop onSetCover ao VariantMatrix.
                        </p>
                      )}

                      {variantImages.length === 0 && (
                        <p className="mt-1 font-mono text-[10px] text-neutral-600">
                          Sem fotos — será usada a galeria padrão do produto.
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="rounded border border-dashed border-neutral-800 p-6 text-center">
            <p className="font-mono text-xs text-neutral-500">
              Nenhuma combinação gerada ainda. Selecione Cores e Tamanhos acima
              e clique em{" "}
              <strong className="text-orange-400">
                &quot;Gerar Combinações&quot;
              </strong>{" "}
              para criar as variações de estoque independente.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
