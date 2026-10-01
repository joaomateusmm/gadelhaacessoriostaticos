"use client";

import { FileUp, Loader2 } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { importPedidosFromJson } from "@/actions/pedidos-sistema";
import { Button } from "@/components/ui/button";

export function ImportJsonPedidosButton() {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".json")) {
      toast.error("Por favor, selecione um arquivo .json válido.");
      return;
    }

    try {
      setIsUploading(true);
      const text = await file.text();
      const jsonData = JSON.parse(text);

      if (!Array.isArray(jsonData)) {
        toast.error("O arquivo JSON deve conter um array de pedidos.");
        return;
      }

      const res = await importPedidosFromJson(jsonData);

      if (res.success) {
        toast.success(res.message);
      } else {
        toast.error(res.message);
      }
    } catch (err) {
      console.error(err);
      toast.error("Erro ao ler ou processar o arquivo JSON de pedidos.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div>
      <input
        type="file"
        ref={fileInputRef}
        accept=".json,application/json"
        onChange={handleFileChange}
        className="hidden"
      />
      <Button
        type="button"
        variant="outline"
        disabled={isUploading}
        onClick={() => fileInputRef.current?.click()}
        className="border-white/10 bg-white/5 text-white hover:bg-white/10"
      >
        {isUploading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Importando...
          </>
        ) : (
          <>
            <FileUp className="mr-2 h-4 w-4" />
            Importar JSON
          </>
        )}
      </Button>
    </div>
  );
}
