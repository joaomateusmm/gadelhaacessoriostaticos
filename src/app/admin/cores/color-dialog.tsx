"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Check,
  ImageIcon,
  Loader2,
  Palette,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { createColor, updateColor } from "@/app/admin/cores/actions";
import { ColorSchema, colorSchema } from "@/app/admin/cores/schema";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UploadButton } from "@/lib/uploadthing";

interface ColorItem {
  id: string;
  name: string;
  hex: string | null;
  imageUrl: string | null;
}

interface ColorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  colorToEdit?: ColorItem | null;
}

const PRESET_COLORS = [
  { name: "Preto", hex: "#111111" },
  { name: "Branco", hex: "#FFFFFF" },
  { name: "Cinza", hex: "#6B7280" },
  { name: "Verde Militar", hex: "#4B5320" },
  { name: "Verde Oliva", hex: "#556B2F" },
  { name: "Coyote / Areia", hex: "#8A6D4B" },
  { name: "Bege / Caqui", hex: "#C8A97E" },
  { name: "Marrom", hex: "#5C3A21" },
  { name: "Azul Marinho", hex: "#1E2A38" },
  { name: "Vermelho", hex: "#B91C1C" },
  { name: "Laranja", hex: "#EA580C" },
  { name: "Amarelo", hex: "#EAB308" },
];

export function ColorDialog({
  open,
  onOpenChange,
  colorToEdit,
}: ColorDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<"hex" | "image">("hex");
  const [isUploading, setIsUploading] = useState(false);

  const form = useForm<ColorSchema>({
    resolver: zodResolver(colorSchema),
    defaultValues: {
      name: "",
      hex: "#000000",
      imageUrl: "",
    },
  });

  useEffect(() => {
    if (colorToEdit) {
      form.reset({
        name: colorToEdit.name,
        hex: colorToEdit.hex || "",
        imageUrl: colorToEdit.imageUrl || "",
      });
      if (colorToEdit.imageUrl) {
        setActiveTab("image");
      } else {
        setActiveTab("hex");
      }
    } else {
      form.reset({
        name: "",
        hex: "#000000",
        imageUrl: "",
      });
      setActiveTab("hex");
    }
  }, [colorToEdit, form, open]);

  const watchedHex = form.watch("hex");
  const watchedImageUrl = form.watch("imageUrl");
  const watchedName = form.watch("name");

  function onSubmit(data: ColorSchema) {
    if (activeTab === "hex" && !data.hex) {
      toast.error("Por favor, selecione ou digite um código HEX.");
      return;
    }
    if (activeTab === "image" && !data.imageUrl) {
      toast.error("Por favor, envie uma imagem de textura para a cor.");
      return;
    }

    startTransition(async () => {
      try {
        const payload: ColorSchema = {
          name: data.name,
          hex: activeTab === "hex" ? data.hex : null,
          imageUrl: activeTab === "image" ? data.imageUrl : null,
        };

        const result = colorToEdit
          ? await updateColor(colorToEdit.id, payload)
          : await createColor(payload);

        if (result.success) {
          toast.success(result.message);
          onOpenChange(false);
          form.reset();
        } else {
          toast.error(result.message);
        }
      } catch {
        toast.error("Erro inesperado ao salvar cor.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-full overflow-hidden border-neutral-800 bg-neutral-950 p-6 text-white sm:rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-clash-display flex items-center gap-2 text-xl font-medium text-white">
            <Palette className="h-5 w-5 text-orange-500" />
            {colorToEdit ? "Editar Cor" : "Nova Cor de Produto"}
          </DialogTitle>
          <DialogDescription className="text-xs text-neutral-400">
            Cadastre uma cor sólida através do código HEX ou faça upload de uma
            imagem para texturas camufladas e padrões especiais.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-5 pt-2"
          >
            {/* Nome da cor */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-semibold tracking-wider text-neutral-300 uppercase">
                    Nome da Cor
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: Preto Tático, Multicam Black, Marpat..."
                      className="border-neutral-800 bg-neutral-900 font-mono text-xs text-white placeholder:text-neutral-500 focus-visible:border-orange-500 focus-visible:ring-0"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-xs text-red-500" />
                </FormItem>
              )}
            />

            {/* Alternância: Cor Sólida ou Textura/Camuflado */}
            <div className="space-y-3">
              <label className="block text-xs font-semibold tracking-wider text-neutral-300 uppercase">
                Tipo de Representação Visual
              </label>
              <Tabs
                value={activeTab}
                onValueChange={(val) => setActiveTab(val as "hex" | "image")}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2 border border-neutral-800 bg-neutral-900 p-1">
                  <TabsTrigger
                    value="hex"
                    className="flex items-center gap-2 text-xs data-[state=active]:bg-neutral-800 data-[state=active]:text-white"
                  >
                    <Palette className="h-3.5 w-3.5 text-orange-400" /> Cor
                    Sólida (HEX)
                  </TabsTrigger>
                  <TabsTrigger
                    value="image"
                    className="flex items-center gap-2 text-xs data-[state=active]:bg-neutral-800 data-[state=active]:text-white"
                  >
                    <ImageIcon className="h-3.5 w-3.5 text-orange-400" /> Imagem
                    / Camuflado
                  </TabsTrigger>
                </TabsList>

                {/* Tab HEX */}
                <TabsContent value="hex" className="space-y-4 pt-3">
                  <FormField
                    control={form.control}
                    name="hex"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[11px] text-neutral-400 uppercase">
                          Código Hexadecimal
                        </FormLabel>
                        <div className="flex items-center gap-3">
                          <input
                            type="color"
                            value={
                              field.value && field.value.startsWith("#")
                                ? field.value
                                : "#000000"
                            }
                            onChange={(e) =>
                              field.onChange(e.target.value.toUpperCase())
                            }
                            className="h-10 w-12 cursor-pointer rounded border border-neutral-800 bg-transparent p-0"
                          />
                          <FormControl>
                            <Input
                              placeholder="#000000"
                              className="border-neutral-800 bg-neutral-900 font-mono text-xs text-white uppercase focus-visible:border-orange-500"
                              {...field}
                              value={field.value || ""}
                              onChange={(e) => field.onChange(e.target.value)}
                            />
                          </FormControl>
                        </div>
                        <FormDescription className="text-[11px] text-neutral-500">
                          Clique na caixinha colorida para selecionar
                          visualmente ou cole seu código hexadecimal.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Sugestões rápidas de cores táticas */}
                  <div className="space-y-2 pt-1">
                    <span className="text-[11px] font-medium text-neutral-400 uppercase">
                      Sugestões Rápidas:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {PRESET_COLORS.map((preset) => (
                        <button
                          key={preset.hex}
                          type="button"
                          onClick={() => {
                            form.setValue("hex", preset.hex);
                            if (!watchedName) {
                              form.setValue("name", preset.name);
                            }
                          }}
                          title={preset.name}
                          className="group flex items-center gap-1.5 rounded-full border border-neutral-800 bg-neutral-900 px-2.5 py-1 text-[11px] text-neutral-300 transition-all hover:border-neutral-600 hover:text-white"
                        >
                          <span
                            className="h-3 w-3 rounded-full border border-white/20"
                            style={{ backgroundColor: preset.hex }}
                          />
                          <span>{preset.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                {/* Tab Imagem / Textura */}
                <TabsContent value="image" className="space-y-4 pt-3">
                  <FormField
                    control={form.control}
                    name="imageUrl"
                    render={({ field }) => (
                      <FormItem className="min-w-0">
                        <FormLabel className="text-[11px] text-neutral-400 uppercase">
                          Imagem da Textura / Camuflagem
                        </FormLabel>
                        <FormControl>
                          <div className="space-y-3 min-w-0">
                            {field.value ? (
                              <div className="relative flex items-center gap-3 rounded-lg border border-neutral-800 bg-neutral-900/60 p-2.5 min-w-0 w-full overflow-hidden">
                                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md border border-neutral-700 bg-neutral-800">
                                  <Image
                                    src={field.value}
                                    alt="Textura da cor"
                                    fill
                                    className="object-cover"
                                  />
                                </div>
                                <div className="min-w-0 flex-1 overflow-hidden text-xs">
                                  <p
                                    title={field.value}
                                    className="truncate font-mono text-neutral-300"
                                  >
                                    {field.value}
                                  </p>
                                  <span className="mt-0.5 flex items-center gap-1 text-[10px] text-emerald-400">
                                    <Check className="h-3 w-3 shrink-0" /> Textura anexada
                                  </span>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => field.onChange("")}
                                  className="h-8 w-8 shrink-0 text-neutral-400 hover:bg-neutral-800 hover:text-red-400"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-neutral-800 bg-neutral-900/40 p-5 text-center">
                                <ImageIcon className="mb-2 h-7 w-7 text-neutral-600" />
                                <p className="mb-3 text-xs text-neutral-400">
                                  Faça upload de um recorte da camuflagem (JPG
                                  ou PNG)
                                </p>
                                <UploadButton
                                  endpoint="imageUploader"
                                  onUploadProgress={() => setIsUploading(true)}
                                  onClientUploadComplete={(res) => {
                                    setIsUploading(false);
                                    if (res && res[0]?.url) {
                                      field.onChange(res[0].url);
                                      toast.success(
                                        "Textura carregada com sucesso!",
                                      );
                                    }
                                  }}
                                  onUploadError={(error: Error) => {
                                    setIsUploading(false);
                                    toast.error(
                                      `Erro no upload: ${error.message}`,
                                    );
                                  }}
                                  appearance={{
                                    button:
                                      "bg-white/10 hover:bg-white/20 text-white text-xs px-4 py-2 rounded-md font-mono transition-colors",
                                    allowedContent:
                                      "text-[10px] text-neutral-500",
                                  }}
                                  content={{
                                    button({ ready }) {
                                      if (isUploading)
                                        return "Enviando textura...";
                                      if (ready) return "Selecionar Arquivo";
                                      return "Carregando...";
                                    },
                                    allowedContent() {
                                      return "Imagens até 4MB";
                                    },
                                  }}
                                />
                              </div>
                            )}

                            {/* Campo opcional de URL direta */}
                            <div className="pt-1 min-w-0">
                              <span className="mb-1 block text-[10px] text-neutral-500 uppercase">
                                Ou insira a URL direta da imagem:
                              </span>
                              <Input
                                placeholder="https://..."
                                value={field.value || ""}
                                onChange={(e) => field.onChange(e.target.value)}
                                className="h-8 border-neutral-800 bg-neutral-900 font-mono text-[11px] text-white focus-visible:border-orange-500 min-w-0 w-full truncate"
                              />
                            </div>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
              </Tabs>
            </div>

            {/* Preview visual do botão de cor */}
            <div className="space-y-1.5 rounded-xl border border-neutral-800 bg-neutral-900/50 p-3.5 min-w-0 overflow-hidden">
              <span className="block font-mono text-[10px] tracking-wider text-neutral-400 uppercase">
                Pré-visualização do seletor:
              </span>
              <div className="flex flex-wrap items-center gap-2.5 min-w-0">
                <div className="flex items-center gap-2 rounded-full border border-neutral-700 bg-neutral-900 px-3.5 py-1.5 text-xs font-medium text-white shadow-sm max-w-full min-w-0">
                  <span
                    className="relative h-4 w-4 shrink-0 overflow-hidden rounded-full border border-white/25"
                    style={{
                      backgroundColor:
                        activeTab === "hex"
                          ? watchedHex || "#000000"
                          : "#222222",
                    }}
                  >
                    {activeTab === "image" && watchedImageUrl && (
                      <Image
                        src={watchedImageUrl}
                        alt="Preview"
                        fill
                        className="object-cover"
                      />
                    )}
                  </span>
                  <span className="truncate max-w-[200px]" title={watchedName || "Nome da Cor"}>
                    {watchedName || "Nome da Cor"}
                  </span>
                </div>
                <span className="text-[11px] text-neutral-500 shrink-0">
                  (Assim que aparecerá na página do produto e checkout)
                </span>
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="border-neutral-800 bg-transparent text-neutral-400 hover:bg-neutral-900 hover:text-white"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isPending || isUploading}
                className="bg-orange-600 font-medium text-white hover:bg-orange-700"
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : colorToEdit ? (
                  "Salvar Alterações"
                ) : (
                  "Cadastrar Cor"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
