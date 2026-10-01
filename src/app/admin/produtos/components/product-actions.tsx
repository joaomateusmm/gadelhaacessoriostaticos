"use client";

import { Archive, Edit, MoreHorizontal, Trash } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
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
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  archiveProduct,
  deleteProduct,
} from "../../../../actions/create-product";

interface ProductActionsProps {
  id: string;
}

export function ProductActions({ id }: ProductActionsProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);

  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // 1. Tenta Deletar
  const handleDelete = () => {
    startTransition(async () => {
      try {
        const result = await deleteProduct(id);

        if (result.success) {
          setShowDeleteDialog(false);
          toast.success(result.message);
          router.refresh();
        } else if (result.code === "CONSTRAINT_VIOLATION") {
          // Falhou por causa do banco: fecha o delete e sugere inativar
          setShowDeleteDialog(false);
          setShowArchiveDialog(true);
        } else {
          toast.error(result.message);
        }
      } catch {
        toast.error("Erro de comunicação.");
      }
    });
  };

  // 2. Aceita Arquivar (Deixar Inativo)
  const handleArchive = () => {
    startTransition(async () => {
      try {
        const result = await archiveProduct(id);
        if (result.success) {
          setShowArchiveDialog(false);
          toast.success("Produto alterado para Inativo.");
          router.refresh();
        } else {
          toast.error("Não foi possível inativar o produto.");
        }
      } catch {
        toast.error("Erro ao tentar arquivar.");
      }
    });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="h-8 w-8 rounded-none p-0 text-neutral-400 hover:bg-neutral-800 hover:text-white"
          >
            <span className="sr-only">Abrir menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="rounded border border-neutral-800 bg-neutral-900 font-mono text-xs text-neutral-300 shadow-xl"
        >
          <DropdownMenuLabel className="font-mono text-[11px] tracking-normal text-neutral-500 uppercase">
            Ações
          </DropdownMenuLabel>

          <DropdownMenuItem
            className="cursor-pointer font-mono text-xs uppercase duration-300 focus:bg-neutral-800 focus:text-white"
            onClick={() => router.push(`/admin/produtos/${id}/editar`)}
          >
            <Edit className="mr-2 h-4 w-4 text-neutral-500" /> Editar
          </DropdownMenuItem>

          <DropdownMenuSeparator className="bg-neutral-800" />
          <DropdownMenuItem
            className="cursor-pointer font-mono text-xs text-red-400 uppercase duration-300 focus:bg-neutral-800 focus:text-red-300"
            onSelect={(e) => {
              e.preventDefault();
              setShowDeleteDialog(true);
            }}
          >
            <Trash className="mr-2 h-4 w-4 text-red-400" /> Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* --- DIALOG 1: TENTATIVA DE EXCLUSÃO --- */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="rounded-none border-neutral-800 bg-neutral-950 text-white shadow-none">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-mono text-sm font-bold tracking-normal text-white uppercase">
              Excluir permanentemente?
            </AlertDialogTitle>
            <AlertDialogDescription className="font-mono text-xs text-neutral-500">
              Essa ação tentará remover o produto do banco de dados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-none border-neutral-800 bg-neutral-900 font-mono text-xs font-bold text-neutral-300 uppercase hover:bg-neutral-800 hover:text-white">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="rounded-none border border-red-600 bg-red-950/60 font-mono text-xs font-bold text-red-400 uppercase hover:bg-red-900/60 hover:text-red-300"
              disabled={isPending}
            >
              {isPending ? "Processando..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* --- DIALOG 2: SUGESTÃO INTELIGENTE (ARQUIVAR) --- */}
      <AlertDialog open={showArchiveDialog} onOpenChange={setShowArchiveDialog}>
        <AlertDialogContent className="rounded-none border-neutral-800 bg-neutral-950 text-white shadow-none">
          <AlertDialogHeader>
            <div className="mb-2 flex items-center gap-2 text-yellow-500">
              <Archive className="h-5 w-5" />
              <AlertDialogTitle className="font-mono text-sm font-bold tracking-normal text-white uppercase">
                Não foi possível excluir
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="font-mono text-xs text-neutral-400">
              Algum usuário tem esse produto no carrinho, favoritos ou histórico
              de compras. Para não perder esses dados, sugerimos deixá-lo como{" "}
              <strong className="text-white">Inativo</strong>. Ele não aparecerá
              mais na loja, mas o histórico será mantido.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-none border-neutral-800 bg-neutral-900 font-mono text-xs font-bold text-neutral-300 uppercase hover:bg-neutral-800 hover:text-white">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleArchive}
              className="rounded-none border border-yellow-600 bg-yellow-950/60 font-mono text-xs font-bold text-yellow-400 uppercase hover:bg-yellow-900/60 hover:text-yellow-300"
              disabled={isPending}
            >
              {isPending ? "Salvando..." : "Deixar Inativo"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
