"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
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

import { createCategory } from "./actions";
import { CategoryFormValues, categorySchema } from "./schema";

export function AddCategoryButton() {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  function onSubmit(data: CategoryFormValues) {
    startTransition(async () => {
      try {
        await createCategory(data);
        toast.success("Categoria criada!");
        setOpen(false);
        form.reset();
      } catch {
        toast.error("Erro ao criar categoria.");
      }
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button className="flex items-center gap-2 border border-white/10 bg-white/5 text-white hover:bg-white/10">
          <Plus className="h-4 w-4" /> Nova Categoria
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="rounded-none border-neutral-800 bg-neutral-950 text-neutral-100 shadow-xl sm:max-w-[425px]">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-mono text-sm font-bold tracking-normal text-white uppercase">
            Criar Categoria
          </AlertDialogTitle>
          <AlertDialogDescription className="font-mono text-xs text-neutral-400">
            Adicione uma nova categoria para organizar seus produtos.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-mono text-[11px] tracking-normal text-neutral-400 uppercase">
                    Nome
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: Eletrodomésticos"
                      className="rounded-none border-neutral-800 bg-neutral-900 font-mono text-xs text-white placeholder:text-neutral-500 focus-visible:border-neutral-600 focus-visible:ring-0"
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
                    Descrição (Opcional)
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Breve descrição..."
                      className="min-h-[100px] resize-none rounded-none border-neutral-800 bg-neutral-900 font-mono text-xs text-white placeholder:text-neutral-500 focus-visible:border-neutral-600 focus-visible:ring-0"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-none border-neutral-800 bg-neutral-900 font-mono text-xs text-neutral-300 uppercase hover:bg-neutral-800 hover:text-white">
                Cancelar
              </AlertDialogCancel>
              <Button
                type="submit"
                className="rounded-none border border-emerald-600 bg-emerald-950/60 font-mono text-xs font-bold text-emerald-400 uppercase hover:bg-emerald-900/60 hover:text-emerald-300"
                disabled={isPending}
              >
                {isPending ? "Salvando..." : "Salvar Categoria"}
              </Button>
            </AlertDialogFooter>
          </form>
        </Form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
