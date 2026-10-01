"use client";

import { Upload } from "lucide-react";
import { useState } from "react";

import { importProductsAction } from "@/actions/import-products"; // Ajuste o caminho da action

export function ImportProductsButton() {
  const [isLoading, setIsLoading] = useState(false);

  // Documentação: Função engatilhada quando o usuário seleciona um arquivo
  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);

    try {
      // 1. Instancia o leitor de arquivos do navegador
      const reader = new FileReader();

      // 2. Define o que acontece quando terminar de ler
      reader.onload = async (e) => {
        const content = e.target?.result as string;

        // Converte o texto do arquivo de volta para um objeto Javascript (Array)
        const parsedData = JSON.parse(content);

        // 3. Chama a nossa função do servidor passando a lista
        const result = await importProductsAction(parsedData);

        // 4. Dá o feedback ao usuário
        if (result.success) {
          alert(result.message);
        } else {
          alert("Falha na importação. Verifique o console.");
        }
        setIsLoading(false);
      };

      // Inicia a leitura do arquivo como texto
      reader.readAsText(file);
    } catch (error) {
      console.error(error);
      alert("Erro ao tentar ler o arquivo JSON.");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-start gap-2">
      {/* Rótulo que age como o botão estilizado */}
      <label
        htmlFor="json-upload"
        className={`flex cursor-pointer items-center gap-2 rounded-md bg-orange-600 px-4 py-2 font-medium text-white shadow-sm transition-colors hover:bg-orange-700 ${
          isLoading ? "pointer-events-none opacity-70" : ""
        }`}
      >
        <Upload className="h-5 w-5" />
        {isLoading ? "Processando importação..." : "Importar Produtos (JSON)"}
      </label>

      {/* Input de arquivo invisível, acionado pelo label acima */}
      <input
        id="json-upload"
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleImport}
      />
    </div>
  );
}
