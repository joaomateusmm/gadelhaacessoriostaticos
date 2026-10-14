"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Edit, MoreHorizontal, Trash } from "lucide-react";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import {
  AlertDialog,
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { deleteCategories, updateCategory } from "./actions";
import { CategoryFormValues, categorySchema } from "./schema";

interface CategoryActionsProps {
  id: string;
  initialName: string;
  initialDescription?: string;
}

export function CategoryActions({
  id,
  initialName,
  initialDescription,
}: CategoryActionsProps) {
  const [isPending, startTransition] = useTransition();
  const [openEdit, setOpenEdit] = useState(false);

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: initialName || "",
      description: initialDescription || "",
    },
  });

  const handleDelete = () => {
    startTransition(async () => {
      try {
        await deleteCategories([id]);
        toast.success("Categoria excluída.");
      } catch {
        toast.error("Erro ao excluir.");
      }
    });
  };

  function onEditSubmit(data: CategoryFormValues) {
    startTransition(async () => {
      try {
        await updateCategory(id, data);
        toast.success("Categoria atualizada com sucesso!");
        setOpenEdit(false);
      } catch {
        toast.error("Erro ao atualizar categoria.");
      }
    });
  }

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
          className="border-white/10 bg-[#111] text-white"
        >
          <DropdownMenuItem
            onClick={() => setOpenEdit(true)}
            className="cursor-pointer text-white focus:bg-white/10 focus:text-white"
          >
            <Edit className="mr-2 h-4 w-4" />
            Editar
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={handleDelete}
            disabled={isPending}
            className="cursor-pointer text-red-500 focus:bg-red-500/10 focus:text-red-500"
          >
            <Trash className="mr-2 h-4 w-4" />
            Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={openEdit} onOpenChange={setOpenEdit}>
        <AlertDialogContent className="border-neutral-200 bg-white text-neutral-900 shadow-lg sm:max-w-[425px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-neutral-900">
              Editar Categoria
            </AlertDialogTitle>
            <AlertDialogDescription className="text-neutral-500">
              Atualize o nome ou descrição. A alteração refletirá em todo o site.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onEditSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-neutral-700">Nome</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: Eletrodomésticos"
                        className="border-neutral-300 bg-white text-neutral-900 focus:border-orange-500 focus:ring-orange-500"
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
                    <FormLabel className="text-neutral-700">
                      Descrição (Opcional)
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Breve descrição..."
                        className="resize-none border-neutral-300 bg-white text-neutral-900 focus:border-orange-500 focus:ring-orange-500"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <AlertDialogFooter>
                <AlertDialogCancel className="border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900">
                  Cancelar
                </AlertDialogCancel>
                <Button
                  type="submit"
                  className="bg-orange-600 text-white shadow-sm hover:bg-orange-700"
                  disabled={isPending}
                >
                  {isPending ? "Salvando..." : "Salvar Alterações"}
                </Button>
              </AlertDialogFooter>
            </form>
          </Form>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
