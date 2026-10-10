"use client";

import { Check, Copy, ImagePlus, Layers, Plus, Trash2, X } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
}

export function VariantMatrix({
  cores,
  tamanhos,
  baseStock = 0,
  variants,
  onChange,
}: VariantMatrixProps) {
  const [globalStock, setGlobalStock] = useState<string>("");
  const [copied, setCopied] = useState(false);

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
          const vTam = v.attributes?.["Tamanho"] || v.attributes?.["tamanho"] || "";
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

  return (
    <Card className="rounded-none border-neutral-800 bg-neutral-950 shadow-none">
      <CardHeader>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 font-mono text-sm font-bold tracking-normal text-white uppercase">
              <Layers className="h-5 w-5 text-orange-500" /> Matriz de Variações e Estoque
            </CardTitle>
            <CardDescription className="font-mono text-xs text-neutral-500">
              Gerencie estoque e preço exclusivo por combinação de Cor e Tamanho.
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

            {/* Tabela de Variantes */}
            <div className="overflow-x-auto border border-neutral-800">
              <table className="w-full text-left font-mono text-xs text-neutral-300">
                <thead className="border-b border-neutral-800 bg-neutral-900 text-[11px] text-neutral-400 uppercase">
                  <tr>
                    <th className="p-2.5">Variação</th>
                    <th className="p-2.5">Foto da Cor</th>
                    <th className="p-2.5">SKU Exclusivo</th>
                    <th className="p-2.5">Estoque</th>
                    <th className="p-2.5">Ilimitado</th>
                    <th className="p-2.5">Preço (Opcional R$)</th>
                    <th className="p-2.5 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-900">
                  {variants.map((v, idx) => {
                    const cor = v.attributes?.["Cor"] || v.attributes?.["cor"] || "-";
                    const tam = v.attributes?.["Tamanho"] || v.attributes?.["tamanho"] || "-";
                    return (
                      <tr key={idx} className="hover:bg-neutral-900/40">
                        <td className="p-2.5 font-bold text-white">
                          <span className="inline-block rounded bg-neutral-800 px-2 py-0.5 text-xs text-orange-400">
                            {cor} / {tam}
                          </span>
                        </td>
                        {/* --- FOTO DA VARIANTE (COR) --- */}
                        <td className="p-2.5">
                          {v.image ? (
                            <div className="relative h-14 w-14 overflow-hidden rounded border border-neutral-700 bg-neutral-900">
                              <Image
                                src={v.image}
                                alt={`Foto ${cor}`}
                                fill
                                className="object-cover"
                              />
                              <button
                                type="button"
                                onClick={() => updateItem(idx, { image: null })}
                                className="absolute right-0.5 top-0.5 rounded-full bg-red-600 p-0.5 text-white hover:bg-red-500"
                              >
                                <X className="h-2.5 w-2.5" />
                              </button>
                            </div>
                          ) : (
                            <UploadButton
                              endpoint="imageUploader"
                              onClientUploadComplete={(res) => {
                                if (res?.[0]?.url) {
                                  updateItem(idx, { image: res[0].url });
                                }
                              }}
                              onUploadError={(error) => {
                                console.error("Erro ao fazer upload:", error);
                              }}
                              appearance={{
                                button:
                                  "h-9 w-24 rounded-none border border-neutral-700 bg-neutral-900 font-mono text-[10px] text-orange-400 hover:border-orange-500 ut-uploading:bg-neutral-800",
                                allowedContent: "hidden",
                              }}
                              content={{
                                button: (
                                  <span className="flex items-center gap-1">
                                    <ImagePlus className="h-3.5 w-3.5" />
                                    Foto
                                  </span>
                                ),
                              }}
                            />
                          )}
                        </td>
                        <td className="p-2.5">
                          <Input
                            placeholder="SKU-VAR"
                            value={v.sku || ""}
                            onChange={(e) => updateItem(idx, { sku: e.target.value })}
                            className="h-7 w-28 rounded-none border-neutral-800 bg-neutral-950 font-mono text-xs text-white"
                          />
                        </td>
                        <td className="p-2.5">
                          <Input
                            type="number"
                            min={0}
                            disabled={v.isStockUnlimited}
                            value={v.stock}
                            onChange={(e) =>
                              updateItem(idx, { stock: parseInt(e.target.value, 10) || 0 })
                            }
                            className="h-7 w-20 rounded-none border-neutral-800 bg-neutral-950 font-mono text-xs text-white"
                          />
                        </td>
                        <td className="p-2.5">
                          <Switch
                            checked={v.isStockUnlimited}
                            onCheckedChange={(checked) =>
                              updateItem(idx, { isStockUnlimited: checked })
                            }
                          />
                        </td>
                        <td className="p-2.5">
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="Padrão"
                            value={v.price != null ? (v.price / 100).toFixed(2) : ""}
                            onChange={(e) => {
                              const val = e.target.value;
                              updateItem(idx, {
                                price: val ? Math.round(parseFloat(val) * 100) : null,
                              });
                            }}
                            className="h-7 w-24 rounded-none border-neutral-800 bg-neutral-950 font-mono text-xs text-white"
                          />
                        </td>
                        <td className="p-2.5 text-right">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem(idx)}
                            className="h-7 w-7 p-0 text-neutral-500 hover:text-red-400"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="rounded border border-dashed border-neutral-800 p-6 text-center">
            <p className="font-mono text-xs text-neutral-500">
              Nenhuma combinação gerada ainda. Selecione Cores e Tamanhos acima e clique em{" "}
              <strong className="text-orange-400">&quot;Gerar Combinações&quot;</strong> para criar as variações de estoque independente.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
