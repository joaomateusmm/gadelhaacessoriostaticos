"use client";

import { Trash2 } from "lucide-react";
import Image from "next/image";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { deleteBrand } from "@/app/admin/marcas/actions";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { BrandActions } from "./brand-actions";

interface BrandData {
  id: string;
  name: string;
  createdAt: Date | null;
}

interface BrandsTableProps {
  data: BrandData[];
}

export function BrandsTable({ data }: BrandsTableProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchTerm] = useState("");
  const [isPending, startTransition] = useTransition();

  // Filtragem local (simples)
  const filteredData = data.filter((brand) =>
    brand.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredData.map((b) => b.id));
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

  const handleBulkDelete = () => {
    startTransition(async () => {
      try {
        await Promise.all(selectedIds.map((id) => deleteBrand(id)));

        setSelectedIds([]);
        toast.success("Marcas excluídas com sucesso.");
      } catch {
        toast.error("Erro ao excluir marcas.");
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* --- FILTROS E AÇÕES --- */}
      <div className="flex items-center justify-between gap-4">
        {selectedIds.length > 0 && (
          <Button
            variant="destructive"
            size="sm"
            onClick={handleBulkDelete}
            disabled={isPending}
            className="animate-in fade-in zoom-in bg-red-600 hover:bg-red-700"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Excluir ({selectedIds.length})
          </Button>
        )}
      </div>

      {/* --- TABELA --- */}
      <div className="overflow-hidden rounded-md border border-white/10 bg-[#0A0A0A]">
        <Table>
          <TableHeader className="bg-white/5">
            <TableRow className="border-white/10 hover:bg-white/5">
              <TableHead className="w-[40px]">
                <Checkbox
                  className="border-white/50 data-[state=checked]:border-[#D00000] data-[state=checked]:bg-[#D00000]"
                  checked={
                    filteredData.length > 0 &&
                    selectedIds.length === filteredData.length
                  }
                  onCheckedChange={(c) => handleSelectAll(!!c)}
                />
              </TableHead>
              <TableHead className="text-neutral-400">Nome</TableHead>
              <TableHead className="text-right text-neutral-400">
                Criado em
              </TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-96 text-center text-neutral-500"
                >
                  <div className="flex h-full w-full flex-col items-center justify-center gap-4 py-10">
                    <Image
                      src="/images/illustration.svg"
                      alt="Sem marcas"
                      width={300}
                      height={300}
                      className="opacity-40 grayscale"
                    />

                    <p className="text-lg font-light text-neutral-400">
                      Nenhuma marca encontrada.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((brand) => (
                <TableRow
                  key={brand.id}
                  className="border-white/10 transition-colors hover:bg-white/5"
                  data-state={selectedIds.includes(brand.id) ? "selected" : ""}
                >
                  <TableCell>
                    <Checkbox
                      className="border-white/50 data-[state=checked]:border-[#D00000] data-[state=checked]:bg-[#D00000]"
                      checked={selectedIds.includes(brand.id)}
                      onCheckedChange={(c) => handleSelectOne(!!c, brand.id)}
                    />
                  </TableCell>
                  <TableCell className="font-medium text-white">
                    {brand.name}
                  </TableCell>
                  <TableCell className="text-right text-neutral-400">
                    {brand.createdAt
                      ? new Date(brand.createdAt).toLocaleDateString("pt-BR")
                      : "-"}
                  </TableCell>
                  <TableCell>
                    <BrandActions id={brand.id} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Rodapé da tabela com contagem */}
      <div className="text-xs text-neutral-600">
        Mostrando {filteredData.length} de {data.length} marcas.
      </div>
    </div>
  );
}
