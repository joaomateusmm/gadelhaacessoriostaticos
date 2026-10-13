"use client";

import { Palette, Search, Trash2 } from "lucide-react";
import Image from "next/image";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { deleteColor } from "@/app/admin/cores/actions";
import { ColorActions } from "@/app/admin/cores/color-actions";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface ColorData {
  id: string;
  name: string;
  hex: string | null;
  imageUrl: string | null;
  createdAt: Date | null;
}

interface ColorsTableProps {
  data: ColorData[];
}

export function ColorsTable({ data }: ColorsTableProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isPending, startTransition] = useTransition();

  const filteredData = data.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()),
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
        await Promise.all(selectedIds.map((id) => deleteColor(id)));
        setSelectedIds([]);
        toast.success("Cores excluídas com sucesso.");
      } catch {
        toast.error("Erro ao excluir cores.");
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* --- FILTROS E BUSCA --- */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
          <Input
            placeholder="Buscar cor por nome..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 border-neutral-800 bg-neutral-900/60 font-mono text-xs text-white placeholder:text-neutral-500 focus-visible:border-orange-500"
          />
        </div>

        {selectedIds.length > 0 && (
          <Button
            variant="destructive"
            size="sm"
            onClick={handleBulkDelete}
            disabled={isPending}
            className="animate-in fade-in zoom-in bg-red-600 hover:bg-red-700 text-xs font-medium"
          >
            <Trash2 className="mr-2 h-3.5 w-3.5" />
            Excluir ({selectedIds.length})
          </Button>
        )}
      </div>

      {/* --- TABELA DE CORES --- */}
      <div className="overflow-hidden rounded-xl border border-neutral-800 bg-neutral-950">
        <Table>
          <TableHeader className="bg-neutral-900/50">
            <TableRow className="border-neutral-800 hover:bg-transparent">
              <TableHead className="w-[40px]">
                <Checkbox
                  className="border-neutral-600 data-[state=checked]:border-orange-500 data-[state=checked]:bg-orange-500"
                  checked={
                    filteredData.length > 0 &&
                    selectedIds.length === filteredData.length
                  }
                  onCheckedChange={(c) => handleSelectAll(!!c)}
                />
              </TableHead>
              <TableHead className="text-neutral-400 font-mono text-xs uppercase">
                Amostra Visual
              </TableHead>
              <TableHead className="text-neutral-400 font-mono text-xs uppercase">
                Nome da Cor
              </TableHead>
              <TableHead className="text-neutral-400 font-mono text-xs uppercase">
                Tipo / Código
              </TableHead>
              <TableHead className="text-right text-neutral-400 font-mono text-xs uppercase">
                Criado em
              </TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-64 text-center text-neutral-500"
                >
                  <div className="flex h-full w-full flex-col items-center justify-center gap-3 py-10">
                    <Palette className="h-10 w-10 text-neutral-700" />
                    <p className="text-sm font-light text-neutral-400">
                      Nenhuma cor cadastrada até o momento.
                    </p>
                    <p className="text-xs text-neutral-600">
                      Adicione cores acima para usá-las nos seus produtos.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((color) => {
                const isSelected = selectedIds.includes(color.id);
                return (
                  <TableRow
                    key={color.id}
                    className="border-neutral-800/60 transition-colors hover:bg-neutral-900/40"
                    data-state={isSelected ? "selected" : ""}
                  >
                    <TableCell>
                      <Checkbox
                        className="border-neutral-600 data-[state=checked]:border-orange-500 data-[state=checked]:bg-orange-500"
                        checked={isSelected}
                        onCheckedChange={(c) => handleSelectOne(!!c, color.id)}
                      />
                    </TableCell>

                    {/* Amostra visual */}
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {color.imageUrl ? (
                          <div className="relative h-8 w-8 overflow-hidden rounded-full border border-neutral-700 shadow-inner">
                            <Image
                              src={color.imageUrl}
                              alt={color.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <span
                            className="h-8 w-8 rounded-full border border-white/20 shadow-inner block"
                            style={{
                              backgroundColor: color.hex || "#333333",
                            }}
                          />
                        )}
                      </div>
                    </TableCell>

                    {/* Nome */}
                    <TableCell className="font-medium text-white font-mono text-xs">
                      {color.name}
                    </TableCell>

                    {/* Tipo / Detalhes */}
                    <TableCell className="font-mono text-xs text-neutral-400">
                      {color.imageUrl ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-neutral-800 bg-neutral-900 px-2.5 py-0.5 text-[11px] text-neutral-300">
                          Textura / Imagem
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-neutral-800 bg-neutral-900 px-2.5 py-0.5 text-[11px] text-neutral-300">
                          {color.hex || "N/A"}
                        </span>
                      )}
                    </TableCell>

                    {/* Data */}
                    <TableCell className="text-right text-neutral-500 font-mono text-xs">
                      {color.createdAt
                        ? new Date(color.createdAt).toLocaleDateString("pt-BR")
                        : "-"}
                    </TableCell>

                    {/* Ações */}
                    <TableCell>
                      <ColorActions color={color} />
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
