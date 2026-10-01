"use client";

import { Loader2, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";

export function AddProductButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = () => {
    if (isLoading) return;

    setIsLoading(true);
    router.push("/admin/produtos/new");
  };

  return (
    <Button
      onClick={handleClick}
      className={`h-10 min-w-[170px] cursor-pointer justify-center rounded-none border border-emerald-600 bg-emerald-950/60 font-mono text-xs font-bold text-emerald-400 uppercase transition-all duration-300 hover:bg-emerald-900/60 hover:text-emerald-300 ${
        isLoading ? "cursor-not-allowed opacity-70" : ""
      }`}
    >
      {isLoading ? (
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Carregando...</span>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          <span>Adicionar Produto</span>
        </div>
      )}
    </Button>
  );
}
