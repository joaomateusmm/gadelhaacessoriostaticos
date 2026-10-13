"use client";

import { Edit, ExternalLink, MoreHorizontal, Trash } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { deleteColor } from "@/app/admin/cores/actions";
import { ColorDialog } from "@/app/admin/cores/color-dialog";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ColorItem {
  id: string;
  name: string;
  hex: string | null;
  imageUrl: string | null;
}

interface ColorActionsProps {
  color: ColorItem;
}

export function ColorActions({ color }: ColorActionsProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      try {
        const result = await deleteColor(color.id);
        if (result.success) {
          toast.success(result.message);
          setDeleteOpen(false);
        } else {
          toast.error(result.message);
        }
      } catch {
        toast.error("Erro ao excluir cor.");
      }
    });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="h-8 w-8 p-0 text-white hover:bg-white/10"
          >
            <span className="sr-only">Abrir menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="border-neutral-800 bg-[#111] text-white"
        >
          <DropdownMenuLabel>{color.name}</DropdownMenuLabel>
          <DropdownMenuItem
            onClick={() => setEditOpen(true)}
            className="cursor-pointer focus:bg-white/10"
          >
            <Edit className="mr-2 h-4 w-4" />
            Editar
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setDeleteOpen(true)}
            className="cursor-pointer text-red-500 focus:bg-red-500/10 focus:text-red-500"
          >
            <Trash className="mr-2 h-4 w-4" />
            Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ColorDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        colorToEdit={color}
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="border-neutral-800 bg-[#111] text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir a cor &quot;{color.name}&quot;?</AlertDialogTitle>
            <AlertDialogDescription className="text-neutral-400">
              Tem certeza de que deseja remover esta cor da biblioteca? Os produtos já cadastrados não perderão o texto de suas cores existentes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/10 bg-transparent text-white hover:bg-white/10 hover:text-white">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 text-white hover:bg-red-700"
              disabled={isPending}
            >
              {isPending ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
