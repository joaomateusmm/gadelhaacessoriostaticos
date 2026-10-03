"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { createBrand } from "@/app/admin/marcas/actions";
import { BrandSchema, brandSchema } from "@/app/admin/marcas/schema";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

export function AddBrandButton() {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<BrandSchema>({
    resolver: zodResolver(brandSchema),
    defaultValues: {
      name: "",
    },
  });

  function onSubmit(data: BrandSchema) {
    startTransition(async () => {
      try {
        const result = await createBrand(data);

        if (result.success) {
          toast.success(result.message);
          setOpen(false);
          form.reset();
        } else {
          toast.error(result.message);
        }
      } catch {
        toast.error("Erro desconhecido ao criar marca.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2 border border-white/10 bg-white/5 text-white hover:bg-white/10">
          <Plus className="h-4 w-4" /> Nova Marca
        </Button>
      </DialogTrigger>
      <DialogContent className="border-white/10 bg-[#111] text-white sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Adicionar Marca</DialogTitle>
          <DialogDescription className="text-neutral-400">
            Crie uma nova marca para agrupar seus produtos (Ex: Invictus,
            Warfare).
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Marca</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: Invictus"
                      className="border-white/10 bg-white/5 text-white focus:border-white/20"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-red-500" />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="submit"
                disabled={isPending}
                className="bg-white text-black hover:bg-neutral-200"
              >
                {isPending ? "Criando..." : "Criar Marca"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
