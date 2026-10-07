"use client";

import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";

type ProductRecord = Record<string, unknown>;

export function ExportJsonProductsButton({
  products,
}: {
  products: ProductRecord[];
}) {
  const handleDownload = () => {
    const now = new Date();
    const timestamp = now
      .toLocaleString("sv-SE", { timeZone: "America/Fortaleza" })
      .replace(" ", "_")
      .replace(/:/g, "-");

    // Remove images field from each product
    const data = products.map((p) => {
      const { images: _unused, ...rest } = p;
      return rest;
    });

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `produtos-${timestamp}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <Button
      type="button"
      onClick={handleDownload}
      className="h-10 min-w-[170px] cursor-pointer justify-center rounded-none border border-white/10 bg-white/5 font-mono text-xs text-white uppercase hover:bg-white/10"
    >
      <Download className="mr-2 h-4 w-4" /> Baixar JSON
    </Button>
  );
}
