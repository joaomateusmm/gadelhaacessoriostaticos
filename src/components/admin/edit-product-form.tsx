"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertCircle,
  Check,
  ChevronLeft,
  ChevronsUpDown,
  ImageIcon,
  Link as LinkIcon,
  Package,
  Palette,
  Ruler,
  Star,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { updateProduct } from "@/actions/create-product";
import { getAllCategories } from "@/actions/get-all-categories";
import { getBrands } from "@/app/admin/produtos/new/get-brands";
import { VariantItem, VariantMatrix } from "@/components/admin/variant-matrix";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { UploadButton } from "@/lib/uploadthing";
import { cn } from "@/lib/utils";

// --- CONSTANTES (tamanhos, cores e formas de pagamento) ---
const TAMANHOS_ROUPAS = ["PP", "P", "M", "G", "GG", "XG", "XXG"];
const TAMANHOS_NUMERICOS = [
  "36",
  "38",
  "40",
  "42",
  "44",
  "46",
  "48",
  "50",
  "52",
  "54",
  "56",
];
const CORES_PADRAO = [
  "Preto",
  "Branco",
  "Cinza",
  "Verde Militar",
  "Bege",
  "Marrom",
  "Azul Marinho",
  "Caqui",
];

const PAYMENT_METHODS_OPTIONS = [
  { id: "pix", label: "Pix" },
  { id: "credit_card", label: "Cartão de Crédito" },
  { id: "debit_card", label: "Cartão de Débito" },
  { id: "boleto", label: "Boleto" },
];

// Classe dos botões de alternar (tamanhos / cores)
const chipClass = (selected: boolean) =>
  cn(
    "h-9 min-w-9 border px-3 font-mono text-xs uppercase transition-all",
    selected
      ? "border-neutral-600 bg-neutral-700 font-bold text-white"
      : "border-neutral-800 bg-neutral-900 text-neutral-400 hover:border-neutral-600 hover:text-white",
  );

// --- 1. SCHEMA (campos opcionais) ---
const formSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  description: z.string().optional(),

  price: z.number().min(0, "O preço não pode ser negativo"),
  discountPrice: z.number().optional(),

  currency: z.literal("BRL"),

  categories: z.array(z.string()),

  status: z.enum(["active", "inactive", "draft"]),

  // --- CAMPOS DE ESTOQUE ---
  stock: z.number().min(0, "O estoque não pode ser negativo"),
  isStockUnlimited: z.boolean(),

  // --- CAMPOS DE FRETE ---
  shippingType: z.enum(["calculated", "fixed", "free"]),
  fixedShippingPrice: z.number().min(0).optional(),

  // --- CAMPOS DE LOGÍSTICA (OPCIONAIS) ---
  sku: z.string().optional(),
  weight: z.number().min(0, "Peso inválido").optional(),
  width: z.number().int().min(0, "Largura inválida").optional(),
  height: z.number().int().min(0, "Altura inválida").optional(),
  length: z.number().int().min(0, "Comprimento inválido").optional(),

  // --- ESPECIFICAÇÕES E DETALHES (OPCIONAIS) ---
  condition: z.enum(["new", "used", "refurbished"]).optional(),
  isAssembled: z.boolean().optional(),
  hasWarranty: z.boolean().optional(),
  warrantyDetails: z.string().optional(),
  brand: z.string().optional(),

  // --- LINKS (OPCIONAIS) ---
  paymentLink: z
    .union([z.literal(""), z.string().url("URL inválida. Inclua https://")])
    .optional(),
  downloadUrl: z
    .union([z.literal(""), z.string().url("URL inválida. Inclua https://")])
    .optional(),
  tamanhos: z.array(z.string()),
  cores: z.array(z.string()),
  brandId: z.string().optional(),

  // --- CONFIGURAÇÕES DE VENDA (OPCIONAIS) ---
  deliveryMode: z.enum(["email", "none"]).optional(),
  paymentMethods: z.array(z.string()).optional(),
});

type ProductFormValues = z.infer<typeof formSchema>;

interface OptionData {
  id: string;
  name: string;
}

// Interface para os dados iniciais do produto
interface ProductData {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  discountPrice?: number | null;
  currency: string;
  categories: string[] | null;
  status: string;
  stock: number | null;
  isStockUnlimited: boolean;
  shippingType: string;
  fixedShippingPrice?: number | null;
  sku?: string | null;
  weight?: number | null;
  width?: number | null;
  height?: number | null;
  length?: number | null;
  images: string[] | null;
  condition?: string | null;
  isAssembled?: boolean | null;
  hasWarranty?: boolean | null;
  warrantyDetails?: string | null;
  brand?: string | null;
  paymentLink?: string | null;
  downloadUrl?: string | null;
  tamanhos?: string[] | null;
  cores?: string[] | null;
  brandId?: string | null;
  deliveryMode?: string | null;
  paymentMethods?: string[] | null;
  variants?: VariantItem[] | null;
}

interface EditProductFormProps {
  initialData: ProductData;
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  GBP: "£",
  USD: "$",
  EUR: "€",
  BRL: "R$",
};

const formatCurrency = (
  value: number,
  currencyCode: "GBP" | "USD" | "EUR" | "BRL" | string,
) => {
  const validCurrency = ["GBP", "USD", "EUR", "BRL"].includes(currencyCode)
    ? currencyCode
    : "GBP";

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: validCurrency,
  }).format(value);
};

// Converte o texto de um input numérico em número (ou undefined se vazio)
const parseOptionalNumber = (raw: string, integer = false) => {
  if (raw === "") return undefined;
  const n = integer ? parseInt(raw, 10) : parseFloat(raw);
  return Number.isNaN(n) ? undefined : n;
};

export default function EditProductForm({ initialData }: EditProductFormProps) {
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);

  const [uploadedImages, setUploadedImages] = useState<string[]>(
    initialData.images || [],
  );

  const [categoriesList, setCategoriesList] = useState<OptionData[]>([]);
  const [brandsList, setBrandsList] = useState<OptionData[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const [sizeCustom, setSizeCustom] = useState("");
  const [corCustom, setCorCustom] = useState("");
  const [variantsList, setVariantsList] = useState<VariantItem[]>(
    initialData.variants || [],
  );

  useEffect(() => {
    async function loadData() {
      try {
        const result = await getAllCategories();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const formattedCats: OptionData[] = (result as any[]).map((item) => {
          return {
            id: String(item.id || item._id || item.uuid || item.href),
            name: item.name || item.label,
          };
        });

        setCategoriesList(formattedCats);
      } catch (error) {
        console.error(error);
        toast.error("Erro ao carregar categorias.");
      }

      try {
        const bnds = await getBrands();
        setBrandsList(bnds);
      } catch (error) {
        console.error(error);
        toast.error("Erro ao carregar marcas.");
      } finally {
        setIsLoadingData(false);
      }
    }
    loadData();
  }, []);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData.name,
      description: initialData.description || "",
      status:
        (initialData.status as "active" | "inactive" | "draft") || "draft",
      currency: "BRL",
      price: initialData.price / 100,
      discountPrice: initialData.discountPrice
        ? initialData.discountPrice / 100
        : 0,
      stock: initialData.stock || 0,
      isStockUnlimited: initialData.isStockUnlimited,
      shippingType:
        (initialData.shippingType as "calculated" | "fixed" | "free") ||
        "calculated",
      fixedShippingPrice: initialData.fixedShippingPrice
        ? initialData.fixedShippingPrice / 100
        : 0,
      sku: initialData.sku || "",
      weight: initialData.weight || undefined,
      width: initialData.width || undefined,
      height: initialData.height || undefined,
      length: initialData.length || undefined,
      categories: initialData.categories
        ? initialData.categories.map((cat) => {
            const val =
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              typeof cat === "object" && cat !== null ? (cat as any).id : cat;
            return String(val);
          })
        : [],

      // --- ESPECIFICAÇÕES (OPCIONAIS) ---
      condition:
        (initialData.condition as "new" | "used" | "refurbished") || undefined,
      isAssembled: initialData.isAssembled || false,
      hasWarranty: initialData.hasWarranty || false,
      warrantyDetails: initialData.warrantyDetails || "",
      brand: initialData.brand || "",

      // --- LINKS / VENDA (OPCIONAIS) ---
      paymentLink: initialData.paymentLink || "",
      downloadUrl: initialData.downloadUrl || "",
      tamanhos: initialData.tamanhos || [],
      cores: initialData.cores || [],
      brandId: initialData.brandId || undefined,
      deliveryMode: (initialData.deliveryMode as "email" | "none") || "none",
      paymentMethods: initialData.paymentMethods || [
        "pix",
        "credit_card",
        "debit_card",
        "boleto",
      ],
    },
    mode: "onChange",
  });

  const handleSetMainImage = (indexToPromote: number) => {
    if (indexToPromote === 0) return;
    const newImages = [...uploadedImages];
    const imageToMove = newImages[indexToPromote];
    newImages.splice(indexToPromote, 1);
    newImages.unshift(imageToMove);
    setUploadedImages(newImages);
    toast.success("Imagem de capa atualizada!");
  };

  const watchPrice = form.watch("price");
  const watchDiscountPrice = form.watch("discountPrice");
  const watchIsStockUnlimited = form.watch("isStockUnlimited");
  const watchCurrency = form.watch("currency");
  const watchShippingType = form.watch("shippingType");

  const handlePriceChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    onChange: (value: number) => void,
  ) => {
    const rawValue = e.target.value.replace(/\D/g, "");
    const numericValue = Number(rawValue) / 100;
    onChange(numericValue);
  };

  const onSubmit: SubmitHandler<ProductFormValues> = async (data) => {
    // Imagens agora são opcionais (sem validação)

    if (
      data.discountPrice !== undefined &&
      data.discountPrice > 0 &&
      data.discountPrice >= data.price
    ) {
      toast.error("O preço promocional deve ser menor que o preço original.");
      return;
    }

    try {
      const formattedData = {
        name: data.name,
        description: data.description,
        price: Math.round(data.price * 100),
        discountPrice:
          data.discountPrice && data.discountPrice > 0
            ? Math.round(data.discountPrice * 100)
            : null,
        currency: data.currency,
        categories: data.categories,
        status: data.status,
        stock: data.stock,
        isStockUnlimited: data.isStockUnlimited,
        shippingType: data.shippingType,
        fixedShippingPrice: data.fixedShippingPrice
          ? Math.round(data.fixedShippingPrice * 100)
          : 0,
        sku: data.sku,
        weight: data.weight ?? 0,
        width: data.width ?? 0,
        height: data.height ?? 0,
        length: data.length ?? 0,
        images: uploadedImages,

        // --- ESPECIFICAÇÕES (OPCIONAIS) ---
        condition: data.condition ?? null,
        isAssembled: data.isAssembled ?? false,
        hasWarranty: data.hasWarranty ?? false,
        warrantyDetails: data.hasWarranty ? data.warrantyDetails || null : null,
        brand: data.brand?.trim() ? data.brand.trim() : null,

        // --- OUTROS DADOS ---
        tamanhos: data.tamanhos,
        cores: data.cores,
        brandId: data.brandId,
        deliveryMode: data.deliveryMode ?? "none",
        paymentLink: data.paymentLink === "" ? null : data.paymentLink,
        downloadUrl: data.downloadUrl === "" ? null : data.downloadUrl,
        paymentMethods: data.paymentMethods ?? [],
        variants: variantsList,
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await updateProduct(initialData.id, formattedData as any);

      toast.success("Produto atualizado com sucesso!");
      router.push("/admin/produtos");
      router.refresh();
    } catch (error) {
      if (error instanceof Error && error.message.includes("NEXT_REDIRECT"))
        return;
      console.error(error);
      toast.error("Erro ao atualizar produto.");
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setUploadedImages(
      uploadedImages.filter((_, index) => index !== indexToRemove),
    );
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-20">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/admin/produtos">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-none border-neutral-800 bg-neutral-900 text-neutral-400 hover:bg-neutral-800 hover:text-white"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="font-clash-display text-3xl font-medium text-white">
            Editar Produto: {initialData.name}
          </h1>
        </div>

        <Button
          type="button"
          onClick={form.handleSubmit(onSubmit)}
          className="h-12 w-auto cursor-pointer rounded-none border border-emerald-600 bg-emerald-950/60 px-12 font-mono text-xs font-bold text-emerald-400 uppercase duration-300 hover:bg-emerald-900/60 hover:text-emerald-300 disabled:opacity-50"
          disabled={form.formState.isSubmitting || isUploading}
        >
          {form.formState.isSubmitting
            ? "Atualizando..."
            : isUploading
              ? "Enviando imagens..."
              : "Salvar Alterações"}
        </Button>
      </div>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="grid gap-8 md:grid-cols-3"
        >
          <div className="space-y-8 md:col-span-2">
            {/* Detalhes Gerais */}
            <Card className="rounded-none border-neutral-800 bg-neutral-950 shadow-none">
              <CardHeader>
                <CardTitle className="font-mono text-sm font-bold tracking-normal text-white uppercase">
                  Detalhes do Produto
                </CardTitle>
                <CardDescription className="font-mono text-xs text-neutral-500">
                  Edite as informações básicas.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-mono text-[11px] tracking-normal text-neutral-400 uppercase">
                        Nome do Produto
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex: Cadeira Gamer Ergonômica"
                          className="rounded-none border-neutral-800 bg-neutral-900 font-mono text-xs text-white placeholder:text-neutral-500 focus-visible:border-neutral-600 focus-visible:ring-0 md:text-xs"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-mono text-[11px] tracking-normal text-neutral-400 uppercase">
                        Descrição
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Descreva as características do produto..."
                          className="min-h-[150px] resize-none rounded-none border-neutral-800 bg-neutral-900 font-mono text-xs text-white placeholder:text-neutral-500 focus-visible:border-neutral-600 focus-visible:ring-0 md:text-xs"
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="paymentLink"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2 font-mono text-[11px] tracking-normal text-neutral-400 uppercase">
                        <LinkIcon className="h-4 w-4 text-neutral-500" /> Link
                        de Pagamento Externo (Opcional)
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex: https://pag.seguro/..."
                          className="rounded-none border-neutral-800 bg-neutral-900 font-mono text-xs text-white placeholder:text-neutral-500 focus-visible:border-neutral-600 focus-visible:ring-0 md:text-xs"
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormDescription className="font-mono text-[11px] text-neutral-500">
                        Opcional. Caso utilize um checkout externo.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* --- CARD: TAMANHOS E CORES --- */}
            <Card className="rounded-none border-neutral-800 bg-neutral-950 shadow-none">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-mono text-sm font-bold tracking-normal text-white uppercase">
                  <Palette className="h-5 w-5 text-neutral-500" /> Tamanhos e
                  Cores
                </CardTitle>
                <CardDescription className="font-mono text-xs text-neutral-500">
                  Selecione as opções de tamanho e cor disponíveis para o
                  produto.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* TAMANHOS */}
                <FormField
                  control={form.control}
                  name="tamanhos"
                  render={({ field }) => {
                    const selecionados = field.value || [];
                    const personalizados = selecionados.filter(
                      (t) =>
                        !TAMANHOS_ROUPAS.includes(t) &&
                        !TAMANHOS_NUMERICOS.includes(t),
                    );
                    const alternar = (t: string) =>
                      field.onChange(
                        selecionados.includes(t)
                          ? selecionados.filter((x) => x !== t)
                          : [...selecionados, t],
                      );
                    const adicionarCustom = () => {
                      const val = sizeCustom.trim();
                      if (val && !selecionados.includes(val)) {
                        field.onChange([...selecionados, val]);
                        setSizeCustom("");
                      }
                    };

                    return (
                      <FormItem>
                        <FormLabel className="font-mono text-[11px] tracking-normal text-neutral-400 uppercase">
                          Tamanhos Disponíveis
                        </FormLabel>
                        <div className="space-y-3">
                          <span className="font-mono text-[11px] text-neutral-400 uppercase">
                            Roupas
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {TAMANHOS_ROUPAS.map((t) => (
                              <button
                                key={t}
                                type="button"
                                onClick={() => alternar(t)}
                                className={chipClass(selecionados.includes(t))}
                              >
                                {t}
                              </button>
                            ))}
                          </div>

                          <span className="mt-2 block font-mono text-[11px] text-neutral-400 uppercase">
                            Numéricos / Calçados
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {TAMANHOS_NUMERICOS.map((t) => (
                              <button
                                key={t}
                                type="button"
                                onClick={() => alternar(t)}
                                className={chipClass(selecionados.includes(t))}
                              >
                                {t}
                              </button>
                            ))}
                          </div>

                          {personalizados.length > 0 && (
                            <div className="pt-2">
                              <span className="block font-mono text-[11px] text-neutral-400 uppercase">
                                Personalizados
                              </span>
                              <div className="mt-1 flex flex-wrap gap-2">
                                {personalizados.map((t) => (
                                  <span
                                    key={t}
                                    className="flex items-center gap-1.5 border border-emerald-600 bg-emerald-950/60 px-2.5 py-1 font-mono text-xs font-bold text-emerald-400 uppercase"
                                  >
                                    {t}
                                    <button
                                      type="button"
                                      onClick={() =>
                                        field.onChange(
                                          selecionados.filter((x) => x !== t),
                                        )
                                      }
                                      className="hover:text-red-400"
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="mt-2 flex items-center gap-2">
                            <Input
                              placeholder="Outro tamanho (ex: Único, G1)"
                              value={sizeCustom}
                              onChange={(e) => setSizeCustom(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  adicionarCustom();
                                }
                              }}
                              className="h-9 rounded-none border-neutral-800 bg-neutral-900 font-mono text-xs text-white placeholder:text-neutral-500 focus-visible:border-neutral-600 focus-visible:ring-0 md:text-xs"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-9 rounded-none border-neutral-800 bg-neutral-900/40 font-mono text-xs font-bold text-neutral-300 uppercase hover:bg-neutral-900/70 hover:text-white"
                              onClick={adicionarCustom}
                            >
                              Adicionar
                            </Button>
                          </div>
                        </div>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />

                <Separator className="bg-neutral-800" />

                {/* CORES */}
                <FormField
                  control={form.control}
                  name="cores"
                  render={({ field }) => {
                    const selecionadas = field.value || [];
                    const personalizadas = selecionadas.filter(
                      (c) => !CORES_PADRAO.includes(c),
                    );
                    const alternar = (c: string) =>
                      field.onChange(
                        selecionadas.includes(c)
                          ? selecionadas.filter((x) => x !== c)
                          : [...selecionadas, c],
                      );
                    const adicionarCustom = () => {
                      const val = corCustom.trim();
                      if (val && !selecionadas.includes(val)) {
                        field.onChange([...selecionadas, val]);
                        setCorCustom("");
                      }
                    };

                    return (
                      <FormItem>
                        <FormLabel className="font-mono text-[11px] tracking-normal text-neutral-400 uppercase">
                          Cores Disponíveis
                        </FormLabel>
                        <div className="space-y-3">
                          <div className="flex flex-wrap gap-2">
                            {CORES_PADRAO.map((c) => (
                              <button
                                key={c}
                                type="button"
                                onClick={() => alternar(c)}
                                className={chipClass(selecionadas.includes(c))}
                              >
                                {c}
                              </button>
                            ))}
                          </div>

                          {personalizadas.length > 0 && (
                            <div className="pt-2">
                              <span className="block font-mono text-[11px] text-neutral-400 uppercase">
                                Personalizadas
                              </span>
                              <div className="mt-1 flex flex-wrap gap-2">
                                {personalizadas.map((c) => (
                                  <span
                                    key={c}
                                    className="flex items-center gap-1.5 border border-emerald-600 bg-emerald-950/60 px-2.5 py-1 font-mono text-xs font-bold text-emerald-400 uppercase"
                                  >
                                    {c}
                                    <button
                                      type="button"
                                      onClick={() =>
                                        field.onChange(
                                          selecionadas.filter((x) => x !== c),
                                        )
                                      }
                                      className="hover:text-red-400"
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="mt-2 flex items-center gap-2">
                            <Input
                              placeholder="Outra cor (ex: Camuflado Woodland)"
                              value={corCustom}
                              onChange={(e) => setCorCustom(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  adicionarCustom();
                                }
                              }}
                              className="h-9 rounded-none border-neutral-800 bg-neutral-900 font-mono text-xs text-white placeholder:text-neutral-500 focus-visible:border-neutral-600 focus-visible:ring-0 md:text-xs"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-9 rounded-none border-neutral-800 bg-neutral-900/40 font-mono text-xs font-bold text-neutral-300 uppercase hover:bg-neutral-900/70 hover:text-white"
                              onClick={adicionarCustom}
                            >
                              Adicionar
                            </Button>
                          </div>
                        </div>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
              </CardContent>
            </Card>

            {/* MATRIZ DE VARIANTES E ESTOQUE INDEPENDENTE (NOVO) */}
            <VariantMatrix
              cores={form.watch("cores") || []}
              tamanhos={form.watch("tamanhos") || []}
              basePrice={
                form.watch("price") ? Math.round(form.watch("price") * 100) : 0
              }
              baseStock={form.watch("stock") || 0}
              variants={variantsList}
              onChange={setVariantsList}
            />

            {/* Informações Logísticas (OPCIONAL) */}
            {watchShippingType === "calculated" && (
              <Card className="animate-in fade-in slide-in-from-top-4 rounded-none border-neutral-800 bg-neutral-950 shadow-none">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 font-mono text-sm font-bold tracking-normal text-white uppercase">
                    <Package className="h-5 w-5 text-neutral-500" /> Dimensões
                    do Pacote (Opcional)
                  </CardTitle>
                  <CardDescription className="font-mono text-xs text-neutral-500">
                    Opcional. Recomendado para o cálculo automático de frete.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="sku"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-mono text-[11px] tracking-normal text-neutral-400 uppercase">
                          SKU (Código)
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ex: CAD-2024-BLK"
                            className="rounded-none border-neutral-800 bg-neutral-900 font-mono text-xs text-white placeholder:text-neutral-500 focus-visible:border-neutral-600 focus-visible:ring-0 md:text-xs"
                            {...field}
                            value={field.value ?? ""}
                          />
                        </FormControl>
                        <FormDescription className="font-mono text-[11px] text-neutral-500">
                          Código único para controle de estoque.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="weight"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-mono text-[11px] tracking-normal text-neutral-400 uppercase">
                            Peso (kg)
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.001"
                              placeholder="0.500"
                              className="rounded-none border-neutral-800 bg-neutral-900 font-mono text-xs text-white placeholder:text-neutral-500 focus-visible:border-neutral-600 focus-visible:ring-0 md:text-xs"
                              {...field}
                              value={field.value ?? ""}
                              onChange={(e) =>
                                field.onChange(
                                  parseOptionalNumber(e.target.value),
                                )
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="width"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-1 font-mono text-[11px] tracking-normal text-neutral-400 uppercase">
                            <Ruler className="h-3 w-3 text-neutral-500" />{" "}
                            Largura (cm)
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="0"
                              className="rounded-none border-neutral-800 bg-neutral-900 font-mono text-xs text-white placeholder:text-neutral-500 focus-visible:border-neutral-600 focus-visible:ring-0 md:text-xs"
                              {...field}
                              value={field.value ?? ""}
                              onChange={(e) =>
                                field.onChange(
                                  parseOptionalNumber(e.target.value, true),
                                )
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="height"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-1 font-mono text-[11px] tracking-normal text-neutral-400 uppercase">
                            <Ruler className="h-3 w-3 rotate-90 text-neutral-500" />{" "}
                            Altura (cm)
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="0"
                              className="rounded-none border-neutral-800 bg-neutral-900 font-mono text-xs text-white placeholder:text-neutral-500 focus-visible:border-neutral-600 focus-visible:ring-0 md:text-xs"
                              {...field}
                              value={field.value ?? ""}
                              onChange={(e) =>
                                field.onChange(
                                  parseOptionalNumber(e.target.value, true),
                                )
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="length"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-1 font-mono text-[11px] tracking-normal text-neutral-400 uppercase">
                            <Ruler className="h-3 w-3 text-neutral-500" /> Comp.
                            (cm)
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="0"
                              className="rounded-none border-neutral-800 bg-neutral-900 font-mono text-xs text-white placeholder:text-neutral-500 focus-visible:border-neutral-600 focus-visible:ring-0 md:text-xs"
                              {...field}
                              value={field.value ?? ""}
                              onChange={(e) =>
                                field.onChange(
                                  parseOptionalNumber(e.target.value, true),
                                )
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* --- CARD: CONFIGURAÇÕES DE VENDA (OPCIONAL) --- */}
            <Card className="rounded-none border-neutral-800 bg-neutral-950 shadow-none">
              <CardHeader>
                <CardTitle className="font-mono text-sm font-bold tracking-normal text-white uppercase">
                  Configurações de Venda (Opcional)
                </CardTitle>
                <CardDescription className="font-mono text-xs text-neutral-500">
                  Opcional. Preencha apenas se precisar.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="downloadUrl"
                  render={({ field }) => (
                    <FormItem className="animate-in fade-in slide-in-from-top-2">
                      <FormLabel className="flex items-center gap-2 font-mono text-[11px] tracking-normal text-neutral-400 uppercase">
                        <LinkIcon className="h-4 w-4 text-neutral-500" /> Link
                        do Arquivo (Download) (Opcional)
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex: https://drive.google.com/..."
                          className="rounded-none border-neutral-800 bg-neutral-900 font-mono text-xs text-white placeholder:text-neutral-500 focus-visible:border-neutral-600 focus-visible:ring-0 md:text-xs"
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormDescription className="font-mono text-[11px] text-neutral-500">
                        Enviado automaticamente após a compra, se informado.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Separator className="bg-neutral-800" />

                <FormField
                  control={form.control}
                  name="paymentMethods"
                  render={() => (
                    <FormItem>
                      <div className="mb-4">
                        <FormLabel className="font-mono text-[11px] tracking-normal text-neutral-400 uppercase">
                          Formas de Pagamento Aceitas
                        </FormLabel>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        {PAYMENT_METHODS_OPTIONS.map((item) => (
                          <FormField
                            key={item.id}
                            control={form.control}
                            name="paymentMethods"
                            render={({ field }) => (
                              <FormItem
                                key={item.id}
                                className="flex flex-row items-start space-y-0 space-x-3 rounded-lg border border-neutral-800 bg-neutral-900 p-4 transition-colors hover:border-neutral-700"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(item.id)}
                                    onCheckedChange={(checked) =>
                                      checked
                                        ? field.onChange([
                                            ...(field.value || []),
                                            item.id,
                                          ])
                                        : field.onChange(
                                            (field.value || []).filter(
                                              (value) => value !== item.id,
                                            ),
                                          )
                                    }
                                    className="border-neutral-600 bg-neutral-900 data-[state=checked]:border-emerald-600 data-[state=checked]:bg-emerald-600 data-[state=checked]:text-white"
                                  />
                                </FormControl>
                                <FormLabel className="w-full cursor-pointer font-mono text-xs font-normal tracking-normal text-neutral-300 uppercase">
                                  {item.label}
                                </FormLabel>
                              </FormItem>
                            )}
                          />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Galeria de Imagens (OPCIONAL) */}
            <Card className="rounded-none border-neutral-800 bg-neutral-950 shadow-none">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-mono text-sm font-bold tracking-normal text-white uppercase">
                  <ImageIcon className="h-5 w-5 text-neutral-500" /> Galeria de
                  Imagens (Opcional)
                </CardTitle>
                <CardDescription className="font-mono text-xs text-neutral-500">
                  Opcional. Adicione ou remova imagens do produto.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex w-full flex-col items-center justify-center rounded-lg border border-dashed border-neutral-800 bg-neutral-900 p-6">
                  <UploadButton
                    endpoint="imageUploader"
                    onUploadBegin={() => setIsUploading(true)}
                    onClientUploadComplete={(res) => {
                      setIsUploading(false);
                      if (res) {
                        const newUrls = res.map((file) => file.url);
                        setUploadedImages((prev) => [...prev, ...newUrls]);
                        toast.success("Imagem enviada com sucesso!");
                      }
                    }}
                    onUploadError={(error: Error) => {
                      setIsUploading(false);
                      toast.error(`Erro: ${error.message}`);
                    }}
                    appearance={{
                      button:
                        "rounded-none border border-neutral-700 bg-neutral-800 font-mono text-xs font-bold uppercase text-white hover:bg-neutral-700 transition-all ut-uploading:cursor-not-allowed w-full max-w-[200px]",
                      container: "w-full flex flex-col items-center gap-2",
                      allowedContent: "font-mono text-xs text-neutral-500",
                    }}
                    content={{
                      button({ ready }) {
                        if (ready)
                          return (
                            <div className="flex items-center gap-2">
                              Escolher Arquivos
                            </div>
                          );
                        return "Carregando...";
                      },
                      allowedContent({ isUploading }) {
                        if (isUploading) return "Enviando...";
                        return "Imagens até 4MB (JPG, PNG)";
                      },
                    }}
                  />
                </div>
                {uploadedImages.length > 0 && (
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                    {uploadedImages.map((url, index) => {
                      const isCover = index === 0;

                      return (
                        <div
                          key={url}
                          className={cn(
                            "group relative aspect-square overflow-hidden rounded-lg border bg-neutral-900 p-2 transition-all",
                            isCover
                              ? "border-emerald-500/60 ring-2 ring-emerald-500/40"
                              : "border-neutral-800 hover:border-neutral-600",
                          )}
                        >
                          <Image
                            src={url}
                            alt={`Imagem do produto ${index + 1}`}
                            fill
                            className="object-contain object-center"
                          />

                          {/* Badge de CAPA */}
                          {isCover && (
                            <div className="absolute top-2 left-2 z-10 flex items-center gap-1 border border-emerald-500/40 bg-neutral-950/90 px-2 py-1 font-mono text-[10px] font-bold text-emerald-400 uppercase">
                              <Star className="h-3 w-3" />
                              Capa
                            </div>
                          )}

                          {/* Botão para DEFINIR COMO CAPA */}
                          {!isCover && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                              <button
                                type="button"
                                onClick={() => handleSetMainImage(index)}
                                className="flex cursor-pointer items-center gap-2 border border-neutral-700 bg-neutral-950 px-4 py-2 font-mono text-xs font-bold text-neutral-200 uppercase duration-300 hover:bg-neutral-800 hover:text-white"
                              >
                                <Star className="h-4 w-4" />
                                Definir Capa
                              </button>
                            </div>
                          )}

                          <button
                            type="button"
                            onClick={() => handleRemoveImage(index)}
                            className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-600/90 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-700"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-8">
            <Card className="rounded-none border-neutral-800 bg-neutral-950 shadow-none">
              <CardHeader>
                <CardTitle className="font-mono text-sm font-bold tracking-normal text-white uppercase">
                  Organização
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-mono text-[11px] tracking-normal text-neutral-400 uppercase">
                        Status
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="rounded-none border-neutral-800 bg-neutral-900 font-mono text-xs text-white focus:border-neutral-600 focus:ring-0">
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded border-neutral-800 bg-neutral-900 font-mono text-xs text-neutral-300 shadow-xl">
                          <SelectItem
                            value="active"
                            className="cursor-pointer font-mono text-xs uppercase focus:bg-neutral-800 focus:text-white"
                          >
                            Ativo
                          </SelectItem>
                          <SelectItem
                            value="draft"
                            className="cursor-pointer font-mono text-xs uppercase focus:bg-neutral-800 focus:text-white"
                          >
                            Rascunho
                          </SelectItem>
                          <SelectItem
                            value="inactive"
                            className="cursor-pointer font-mono text-xs uppercase focus:bg-neutral-800 focus:text-white"
                          >
                            Inativo
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Categorias */}
                <FormField
                  control={form.control}
                  name="categories"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <div className="flex items-center justify-between">
                        <FormLabel className="font-mono text-[11px] tracking-normal text-neutral-400 uppercase">
                          Categorias
                        </FormLabel>
                        {field.value && field.value.length > 0 && (
                          <button
                            type="button"
                            onClick={() => form.setValue("categories", [])}
                            className="font-mono text-[10px] text-neutral-500 uppercase transition-colors hover:text-red-400"
                          >
                            Limpar tudo
                          </button>
                        )}
                      </div>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              disabled={isLoadingData}
                              className={cn(
                                "justify-between rounded-none border-neutral-800 bg-neutral-900 text-left font-mono text-xs font-normal uppercase hover:border-neutral-600 hover:bg-neutral-900 hover:text-white focus:ring-0",
                                !field.value || field.value.length === 0
                                  ? "text-neutral-400"
                                  : "border-emerald-600 bg-emerald-950/60 font-bold text-emerald-400 hover:bg-emerald-950/60 hover:text-emerald-400",
                              )}
                            >
                              {field.value && field.value.length > 0
                                ? `${field.value.length} selecionada(s)`
                                : "Selecione categorias..."}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-[300px] rounded border-neutral-800 bg-neutral-900 p-0 text-neutral-300 shadow-xl">
                          <Command className="bg-neutral-900 font-mono text-xs text-neutral-300">
                            <CommandInput
                              placeholder="Buscar..."
                              className="border-none focus:ring-0"
                            />
                            <CommandList>
                              <CommandEmpty>Nada encontrado.</CommandEmpty>
                              <CommandGroup>
                                {categoriesList.map((category) => {
                                  // LÓGICA DE COMPARAÇÃO SEGURA
                                  const isSelected = field.value?.some(
                                    (val: string | number) =>
                                      String(val) === String(category.id),
                                  );

                                  return (
                                    <CommandItem
                                      key={category.id}
                                      value={category.name}
                                      onSelect={() => {
                                        const current = field.value || [];
                                        if (isSelected) {
                                          form.setValue(
                                            "categories",
                                            current.filter(
                                              (id) =>
                                                String(id) !==
                                                String(category.id),
                                            ),
                                          );
                                        } else {
                                          form.setValue("categories", [
                                            ...current,
                                            category.id,
                                          ]);
                                        }
                                      }}
                                      className="cursor-pointer text-neutral-300 uppercase hover:bg-neutral-800 aria-selected:bg-neutral-800 aria-selected:text-white"
                                    >
                                      <div
                                        className={cn(
                                          "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-neutral-700",
                                          isSelected
                                            ? "border-emerald-600 bg-emerald-600"
                                            : "opacity-50",
                                        )}
                                      >
                                        {isSelected && (
                                          <Check className="h-3 w-3 text-white" />
                                        )}
                                      </div>
                                      {category.name}
                                    </CommandItem>
                                  );
                                })}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* MARCA RELACIONADA (Única Escolha) */}
                <FormField
                  control={form.control}
                  name="brandId"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="font-mono text-[11px] tracking-normal text-neutral-400 uppercase">
                        Marca Relacionada (Opcional)
                      </FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              disabled={isLoadingData}
                              className={cn(
                                "justify-between rounded-none border-neutral-800 bg-neutral-900 text-left font-mono text-xs font-normal uppercase hover:border-neutral-600 hover:bg-neutral-900 hover:text-white focus:ring-0",
                                !field.value
                                  ? "text-neutral-400"
                                  : "border-emerald-600 bg-emerald-950/60 font-bold text-emerald-400 hover:bg-emerald-950/60 hover:text-emerald-400",
                              )}
                            >
                              {field.value
                                ? brandsList.find((b) => b.id === field.value)
                                    ?.name
                                : "Selecione uma marca..."}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-[300px] rounded border-neutral-800 bg-neutral-900 p-0 text-neutral-300 shadow-xl">
                          <Command className="bg-neutral-900 font-mono text-xs text-neutral-300">
                            <CommandInput
                              placeholder="Buscar marca..."
                              className="border-none focus:ring-0"
                            />
                            <CommandList>
                              <CommandEmpty>
                                Nenhuma marca encontrada.
                              </CommandEmpty>
                              <CommandGroup>
                                <CommandItem
                                  value="none"
                                  onSelect={() =>
                                    form.setValue("brandId", undefined)
                                  }
                                  className="cursor-pointer text-neutral-500 uppercase hover:bg-neutral-800 aria-selected:bg-neutral-800 aria-selected:text-white"
                                >
                                  Nenhuma (Limpar)
                                </CommandItem>
                                {brandsList.map((brand) => (
                                  <CommandItem
                                    key={brand.id}
                                    value={brand.name}
                                    onSelect={() =>
                                      form.setValue("brandId", brand.id)
                                    }
                                    className="cursor-pointer text-neutral-300 uppercase hover:bg-neutral-800 aria-selected:bg-neutral-800 aria-selected:text-white"
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        field.value === brand.id
                                          ? "opacity-100"
                                          : "opacity-0",
                                      )}
                                    />
                                    {brand.name}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* ESTOQUE */}
            <Card className="rounded-none border-neutral-800 bg-neutral-950 shadow-none">
              <CardHeader>
                <CardTitle className="font-mono text-sm font-bold tracking-normal text-white uppercase">
                  Estoque
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="isStockUnlimited"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-y-0 space-x-3 rounded-lg border border-neutral-800 bg-neutral-900 p-4 transition-colors hover:border-neutral-700">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="border-neutral-600 bg-neutral-900 text-white data-[state=checked]:border-emerald-600 data-[state=checked]:bg-emerald-600 data-[state=checked]:text-white"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="font-mono text-[11px] tracking-normal text-neutral-400 uppercase">
                          Estoque Ilimitado
                        </FormLabel>
                        <FormDescription className="font-mono text-[11px] text-neutral-500">
                          O produto é &quot;infinito&quot;.
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                {!watchIsStockUnlimited && (
                  <FormField
                    control={form.control}
                    name="stock"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-mono text-[11px] tracking-normal text-neutral-400 uppercase">
                          Quantidade
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0"
                            className="rounded-none border-neutral-800 bg-neutral-900 font-mono text-xs text-white placeholder:text-neutral-500 focus-visible:border-neutral-600 focus-visible:ring-0 md:text-xs [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                            {...field}
                            value={field.value === 0 ? "" : field.value}
                            onKeyDown={(e) => {
                              if (
                                ["e", "E", "+", "-", ",", "."].includes(e.key)
                              ) {
                                e.preventDefault();
                              }
                            }}
                            onChange={(e) => {
                              const rawValue = e.target.value.replace(
                                /\D/g,
                                "",
                              );
                              field.onChange(
                                rawValue === "" ? 0 : Number(rawValue),
                              );
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </CardContent>
            </Card>

            {/* Preços */}
            <Card className="rounded-none border-neutral-800 bg-neutral-950 shadow-none">
              <CardHeader>
                <CardTitle className="font-mono text-sm font-bold tracking-normal text-white uppercase">
                  Preços
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-mono text-[11px] tracking-normal text-neutral-400 uppercase">
                        Moeda
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="rounded-none border-neutral-800 bg-neutral-900 font-mono text-xs text-white focus:border-neutral-600 focus:ring-0">
                            <SelectValue placeholder="Selecione a moeda" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded border-neutral-800 bg-neutral-900 font-mono text-xs text-neutral-300 shadow-xl">
                          <SelectItem
                            value="BRL"
                            className="cursor-pointer font-mono text-xs uppercase focus:bg-neutral-800 focus:text-white"
                          >
                            Real Brasileiro (R$)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-mono text-[11px] tracking-normal text-neutral-400 uppercase">
                        Preço ({CURRENCY_SYMBOLS[watchCurrency]})
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder={`${CURRENCY_SYMBOLS[watchCurrency]} 0,00`}
                          className="rounded-none border-neutral-800 bg-neutral-900 font-mono text-lg text-white placeholder:text-neutral-500 focus-visible:border-neutral-600 focus-visible:ring-0 md:text-lg"
                          value={formatCurrency(field.value, watchCurrency)}
                          onChange={(e) => handlePriceChange(e, field.onChange)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="discountPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-mono text-[11px] tracking-normal text-neutral-400 uppercase">
                        Preço Promocional
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder={`${CURRENCY_SYMBOLS[watchCurrency]} 0,00`}
                          className="rounded-none border-neutral-800 bg-neutral-900 font-mono text-xs text-white placeholder:text-neutral-500 focus-visible:border-neutral-600 focus-visible:ring-0 md:text-xs"
                          value={formatCurrency(
                            field.value || 0,
                            watchCurrency,
                          )}
                          onChange={(e) => handlePriceChange(e, field.onChange)}
                        />
                      </FormControl>
                      {watchDiscountPrice !== undefined &&
                      watchDiscountPrice > 0 &&
                      (watchDiscountPrice as number) >=
                        (watchPrice as number) ? (
                        <div className="mt-1 flex items-center gap-2 font-mono text-xs text-red-400">
                          <AlertCircle className="h-3 w-3" />
                          <span>
                            Preço promocional deve ser menor que o original.
                          </span>
                        </div>
                      ) : (
                        <FormDescription className="font-mono text-[11px] text-neutral-500">
                          Opcional.
                        </FormDescription>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>
        </form>
        <Button
          type="submit"
          className="h-12 w-full cursor-pointer rounded-none border border-emerald-600 bg-emerald-950/60 font-mono text-xs font-bold text-emerald-400 uppercase duration-300 hover:bg-emerald-900/60 hover:text-emerald-300 disabled:opacity-50"
          disabled={form.formState.isSubmitting || isUploading}
        >
          {form.formState.isSubmitting
            ? "Atualizando..."
            : isUploading
              ? "Enviando imagens..."
              : "Salvar Alterações"}
        </Button>
      </Form>
    </div>
  );
}
