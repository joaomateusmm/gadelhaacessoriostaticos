"use client";

import {
  ChevronDown,
  CopyCheck,
  ExternalLink,
  ImageIcon,
  Search,
  SquareCheck,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React, { useState, useTransition } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { deleteProducts } from "../../../../actions/create-product";
import { ProductActions } from "./product-actions";

interface CategoryData {
  id: string;
  name: string;
}

interface ProductsTableProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any[];
  totalProducts: number;
  limitParam: string;
  allCategories: CategoryData[];
}

const formatPrice = (amount: number, currency: string = "GBP") => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: currency,
  }).format(amount / 100);
};

const toolbarButton =
  "flex h-10 cursor-pointer items-center justify-center gap-2 rounded-none border border-neutral-800 bg-neutral-900 px-3 font-mono text-xs font-bold text-neutral-300 uppercase duration-300 hover:border-neutral-600 hover:bg-neutral-800 hover:text-white active:scale-95";

const checkboxClass =
  "border-neutral-600 bg-neutral-900 data-[state=checked]:border-emerald-600 data-[state=checked]:bg-emerald-600 data-[state=checked]:text-white";

export function ProductsTable({
  data,
  totalProducts,
  limitParam,
  allCategories,
}: ProductsTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSearch = (term: string) => {
    const params = new URLSearchParams(searchParams);
    if (term) {
      params.set("search", term);
    } else {
      params.delete("search");
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(data.map((p) => p.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (checked: boolean, id: string) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id]);
    } else {
      setSelectedIds((prev) => prev.filter((item) => item !== id));
    }
  };

  const handleSelectPage = () => {
    const pageIds = data.map((product) => product.id);
    setSelectedIds(pageIds);
    toast.success(`${pageIds.length} itens desta página selecionados.`);
  };

  const handleBulkDelete = () => {
    startTransition(async () => {
      try {
        const result = await deleteProducts(selectedIds);
        if (result.success) {
          setSelectedIds([]);
          setShowDeleteDialog(false);
          toast.success(result.message);
          router.refresh();
        } else {
          toast.error(result.message);
        }
      } catch {
        toast.error("Erro ao excluir produtos.");
      }
    });
  };

  const getCategoryName = (id: string) => {
    const cat = allCategories.find((c) => c.id === id);
    return cat ? cat.name : "Desconhecido";
  };

  const sections = (() => {
    const map = new Map<string, typeof data>();
    const uncategorizedKey = " Sem Categoria";

    data.forEach((product) => {
      if (product.categories && product.categories.length > 0) {
        product.categories.forEach((catId: string) => {
          const catName = getCategoryName(catId);
          if (!map.has(catName)) {
            map.set(catName, []);
          }
          map.get(catName)!.push(product);
        });
      } else {
        if (!map.has(uncategorizedKey)) {
          map.set(uncategorizedKey, []);
        }
        map.get(uncategorizedKey)!.push(product);
      }
    });

    const sortedCategories = Array.from(map.keys()).sort((a, b) =>
      a.localeCompare(b, "pt-BR", { sensitivity: "base" }),
    );

    return sortedCategories.map((catName) => ({
      categoryName: catName === uncategorizedKey ? "Sem Categoria" : catName,
      products: map.get(catName)!,
    }));
  })();

  return (
    <>
      <div className="mb-4 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div className="flex h-10 items-center gap-2 rounded-none border border-neutral-800 bg-neutral-900 px-3">
          <Search className="h-4 w-4 text-neutral-500" />
          <input
            placeholder="Pesquisar Produto..."
            type="text"
            defaultValue={searchParams.get("search")?.toString()}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-auto bg-transparent p-1 font-mono text-xs text-white placeholder:text-neutral-500 focus:outline-none"
          />
        </div>
        <div className="ml-auto flex flex-wrap items-center justify-end gap-3">
          {selectedIds.length > 0 && (
            <button
              onClick={() => setShowDeleteDialog(true)}
              className="animate-in fade-in zoom-in flex h-10 cursor-pointer items-center justify-center gap-2 rounded-none border border-red-600 bg-red-950/60 px-3 font-mono text-xs font-bold text-red-400 uppercase duration-300 hover:bg-red-900/60 hover:text-red-300"
            >
              <SquareCheck className="h-4 w-4" />
              Excluir ({selectedIds.length})
            </button>
          )}
          <button onClick={handleSelectPage} className={toolbarButton}>
            <SquareCheck className="h-4 w-4" />
            Marcar Página
          </button>
          <button
            onClick={() => handleSelectAll(true)}
            className={toolbarButton}
          >
            <CopyCheck className="h-4 w-4" />
            Marcar Todos
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-none border border-neutral-800 bg-neutral-950">
        <Table>
          <TableHeader className="bg-neutral-900">
            <TableRow className="border-neutral-800 hover:bg-neutral-900">
              <TableHead className="w-[40px] pl-4">
                <Checkbox
                  className={checkboxClass}
                  checked={
                    data.length > 0 &&
                    selectedIds.length === data.length &&
                    data.every((item) => selectedIds.includes(item.id))
                  }
                  onCheckedChange={(checked) => handleSelectAll(!!checked)}
                />
              </TableHead>
              <TableHead className="w-[300px] font-mono text-[11px] font-bold tracking-normal text-neutral-400 uppercase">
                Nome
              </TableHead>
              <TableHead className="w-[100px] font-mono text-[11px] font-bold tracking-normal text-neutral-400 uppercase">
                Status
              </TableHead>
              <TableHead className="hidden font-mono text-[11px] font-bold tracking-normal text-neutral-400 uppercase md:table-cell md:w-[200px]">
                Categoria(s)
              </TableHead>
              <TableHead className="w-[120px] text-right font-mono text-[11px] font-bold tracking-normal text-neutral-400 uppercase">
                Preço
              </TableHead>
              <TableHead className="hidden w-[80px] text-right font-mono text-[11px] font-bold tracking-normal text-neutral-400 uppercase md:table-cell">
                Vendas
              </TableHead>
              <TableHead className="w-[60px] text-center font-mono text-[11px] font-bold tracking-normal text-neutral-400 uppercase">
                Ver
              </TableHead>
              <TableHead className="w-[60px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow className="border-neutral-800 hover:bg-transparent">
                <TableCell colSpan={8} className="h-96 text-center">
                  <div className="flex h-full w-full flex-col items-center justify-center gap-4 py-10">
                    <Image
                      src="/images/illustration.svg"
                      alt="Sem produtos"
                      width={200}
                      height={200}
                      className="opacity-30 grayscale"
                    />
                    <p className="font-mono text-xs text-neutral-500 uppercase">
                      Nenhum produto encontrado.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              sections.map((section) => (
                <React.Fragment key={section.categoryName}>
                  <TableRow className="border-neutral-800 bg-neutral-900/80 hover:bg-neutral-900/80">
                    <TableCell
                      colSpan={8}
                      className="py-2 pl-4 font-mono text-xs font-bold tracking-wider text-emerald-400 uppercase"
                    >
                      {section.categoryName} ({section.products.length})
                    </TableCell>
                  </TableRow>
                  {section.products.map((item) => {
                    const mainImage =
                      item.images && item.images.length > 0
                        ? item.images[0]
                        : null;

                    return (
                      <TableRow
                        key={`${section.categoryName}-${item.id}`}
                        className="border-neutral-800 transition-colors hover:bg-neutral-900 data-[state=selected]:bg-neutral-900"
                        data-state={
                          selectedIds.includes(item.id) ? "selected" : ""
                        }
                      >
                        <TableCell className="pl-4">
                          <Checkbox
                            className={checkboxClass}
                            checked={selectedIds.includes(item.id)}
                            onCheckedChange={(checked) =>
                              handleSelectOne(!!checked, item.id)
                            }
                          />
                        </TableCell>

                        <TableCell className="font-mono text-xs font-medium text-white">
                          <div className="flex items-center gap-3">
                            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-none border border-neutral-800 bg-neutral-900">
                              {mainImage ? (
                                <Image
                                  src={mainImage}
                                  alt={item.name}
                                  fill
                                  className="object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center">
                                  <ImageIcon className="h-4 w-4 text-neutral-600" />
                                </div>
                              )}
                            </div>
                            <span
                              className="max-w-[200px] truncate"
                              title={item.name}
                            >
                              {item.name}
                            </span>
                          </div>
                        </TableCell>

                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`rounded-none border px-2 py-1 font-mono text-[10px] font-bold uppercase ${
                              item.status === "active"
                                ? "border-emerald-600 bg-emerald-950/60 text-emerald-400"
                                : item.status === "inactive"
                                  ? "border-red-600 bg-red-950/60 text-red-400"
                                  : "border-yellow-600 bg-yellow-950/60 text-yellow-400"
                            }`}
                          >
                            {item.status === "active"
                              ? "Ativo"
                              : item.status === "inactive"
                                ? "Inativo"
                                : "Rascunho"}
                          </Badge>
                        </TableCell>

                        <TableCell className="hidden md:table-cell">
                          <div className="flex flex-wrap gap-1">
                            {item.categories && item.categories.length > 0 ? (
                              item.categories
                                .slice(0, 2)
                                .map((catId: string) => (
                                  <Badge
                                    key={catId}
                                    variant="secondary"
                                    className="rounded-none border border-neutral-700 bg-neutral-800 font-mono text-[10px] whitespace-nowrap text-neutral-300 uppercase hover:bg-neutral-700"
                                  >
                                    {getCategoryName(catId)}
                                  </Badge>
                                ))
                            ) : (
                              <span className="text-neutral-600">-</span>
                            )}
                            {item.categories && item.categories.length > 2 && (
                              <Badge
                                variant="outline"
                                className="rounded-none border-neutral-700 font-mono text-[10px] text-neutral-400"
                              >
                                +{item.categories.length - 2}
                              </Badge>
                            )}
                          </div>
                        </TableCell>

                        <TableCell className="text-right font-mono text-xs font-medium whitespace-nowrap text-white">
                          {formatPrice(item.price, item.currency)}
                        </TableCell>

                        <TableCell className="hidden text-right font-mono text-xs text-neutral-400 md:table-cell">
                          {item.sales}
                        </TableCell>

                        <TableCell className="text-center">
                          <Link
                            href={`/produto/${item.id}`}
                            target="_blank"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-none text-neutral-500 duration-300 hover:bg-neutral-800 hover:text-emerald-400"
                            title="Ver página do produto"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Link>
                        </TableCell>

                        <TableCell>
                          <ProductActions id={item.id} />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </React.Fragment>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* --- RODAPÉ --- */}
      <div className="mt-4 flex flex-col items-center justify-between gap-4 md:flex-row">
        <p className="font-mono text-xs text-neutral-500">
          Exibindo {data.length} de {totalProducts} produtos.
        </p>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-neutral-500 uppercase">
              Visualizar
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 rounded-none border-neutral-800 bg-neutral-900 font-mono text-xs text-neutral-300 uppercase hover:bg-neutral-800 hover:text-white"
                >
                  {limitParam === "all" ? "Todos" : limitParam}
                  <ChevronDown className="ml-2 h-3 w-3 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="rounded border-neutral-800 bg-neutral-900 font-mono text-xs text-neutral-300 shadow-xl"
              >
                <Link href="?limit=10" scroll={false}>
                  <DropdownMenuItem className="cursor-pointer font-mono text-xs uppercase focus:bg-neutral-800 focus:text-white">
                    10
                  </DropdownMenuItem>
                </Link>
                <Link href="?limit=20" scroll={false}>
                  <DropdownMenuItem className="cursor-pointer font-mono text-xs uppercase focus:bg-neutral-800 focus:text-white">
                    20
                  </DropdownMenuItem>
                </Link>
                <Link href="?limit=30" scroll={false}>
                  <DropdownMenuItem className="cursor-pointer font-mono text-xs uppercase focus:bg-neutral-800 focus:text-white">
                    30
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuSeparator className="bg-neutral-800" />
                <Link href="?limit=all" scroll={false}>
                  <DropdownMenuItem className="cursor-pointer font-mono text-xs uppercase focus:bg-neutral-800 focus:text-white">
                    Todos
                  </DropdownMenuItem>
                </Link>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded-none border-neutral-800 bg-neutral-900 font-mono text-xs text-neutral-300 uppercase hover:bg-neutral-800 hover:text-white disabled:opacity-50"
              disabled
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="rounded-none border-neutral-800 bg-neutral-900 font-mono text-xs text-neutral-300 uppercase hover:bg-neutral-800 hover:text-white"
            >
              Próxima
            </Button>
          </div>
        </div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="rounded-none border-neutral-800 bg-neutral-950 text-white shadow-none sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-mono text-sm font-bold tracking-normal text-white uppercase">
              Tem certeza absoluta?
            </AlertDialogTitle>
            <AlertDialogDescription className="font-mono text-xs text-neutral-500">
              Isso excluirá permanentemente{" "}
              <strong className="text-white">{selectedIds.length}</strong>{" "}
              produtos selecionados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-none border-neutral-800 bg-neutral-900 font-mono text-xs font-bold text-neutral-300 uppercase hover:bg-neutral-800 hover:text-white">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              className="rounded-none border border-red-600 bg-red-950/60 font-mono text-xs font-bold text-red-400 uppercase hover:bg-red-900/60 hover:text-red-300"
              disabled={isPending}
            >
              {isPending ? "Excluindo..." : "Excluir Selecionados"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
