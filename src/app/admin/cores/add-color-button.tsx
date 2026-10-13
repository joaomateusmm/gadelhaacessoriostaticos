"use client";

import { Plus } from "lucide-react";
import { useState } from "react";

import { ColorDialog } from "@/app/admin/cores/color-dialog";
import { Button } from "@/components/ui/button";

export function AddColorButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 border border-orange-500/30 bg-orange-600/20 text-orange-400 hover:bg-orange-600 hover:text-white transition-all shadow-sm"
      >
        <Plus className="h-4 w-4" /> Nova Cor
      </Button>

      <ColorDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
