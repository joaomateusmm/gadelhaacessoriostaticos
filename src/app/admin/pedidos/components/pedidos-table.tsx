"use client";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Download,
  Eye,
  Loader2,
  MoreHorizontal,
  Package,
  Plus,
  Search,
  ShoppingBag,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";

import {
  atualizarStatusPedido,
  excluirPedidos,
  exportarPedidosAction,
  importarPedidosLoteAction,
  marcarItemSeparado,
  type PedidoSistema,
} from "@/actions/pedidos-balcao";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { RegistrarPedidoDialog } from "./registrar-pedido-dialog";

// ─── Status badges ──────────────────────────────────────────────────────────

function BadgePagamento({ status }: { status: string }) {
  if (status === "Pago") {
    return (
      <Badge className="border-0 bg-emerald-100 font-medium text-emerald-700 hover:bg-emerald-100">
        <CheckCircle2 className="mr-1 h-3 w-3" /> Pago
      </Badge>
    );
  }
  return (
    <Badge className="border-0 bg-red-100 font-medium text-red-700 hover:bg-red-100">
      <AlertCircle className="mr-1 h-3 w-3" /> Não pago
    </Badge>
  );
}

function BadgePedido({ status }: { status: string }) {
  if (status === "Entregue") {
    return (
      <Badge className="border-0 bg-blue-100 font-medium text-blue-700 hover:bg-blue-100">
        <Package className="mr-1 h-3 w-3" /> Entregue
      </Badge>
    );
  }
  return (
    <Badge className="border-0 bg-amber-100 font-medium text-amber-700 hover:bg-amber-100">
      <Clock className="mr-1 h-3 w-3" /> Devendo
    </Badge>
  );
}

function BadgePacote({ status }: { status: string }) {
  const map: Record<string, { bg: string; text: string }> = {
    Criado: { bg: "bg-emerald-100 text-emerald-700", text: "Criado" },
    "Não criado": { bg: "bg-neutral-100 text-neutral-600", text: "Não criado" },
    Lacrado: { bg: "bg-purple-100 text-purple-700", text: "Lacrado" },
  };
  const s = map[status] ?? map["Não criado"];
  return (
    <Badge className={`border-0 font-medium ${s.bg} hover:${s.bg}`}>
      {s.text}
    </Badge>
  );
}

// ─── Tipos ──────────────────────────────────────────────────────────────────

interface PedidosTableProps {
  pedidos: PedidoSistema[];
}

// ─── Componente principal ───────────────────────────────────────────────────

export function PedidosTable({ pedidos: pedidosIniciais }: PedidosTableProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Estado local de dados
  const [pedidosList, setPedidosList] =
    useState<PedidoSistema[]>(pedidosIniciais);

  // Filtros
  const [search, setSearch] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("todos");

  // Seleção
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Diálogos
  const [registrarOpen, setRegistrarOpen] = useState(false);
  const [detalheOpen, setDetalheOpen] = useState(false);
  const [detalheId, setDetalheId] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // Import
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);

  // Compute filtered
  const pedidosFiltrados = pedidosList.filter((p) => {
    const matchStatus =
      filtroStatus === "todos" || p.statusPedido === filtroStatus;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      p.codigo.toLowerCase().includes(q) ||
      p.clienteNome.toLowerCase().includes(q) ||
      (p.unidade ?? "").toLowerCase().includes(q) ||
      (p.contato ?? "").toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  // ─── Helpers ────────────────────────────────────────────────────────────

  function toggleExpand(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedIds.size === pedidosFiltrados.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pedidosFiltrados.map((p) => p.id)));
    }
  }

  const pedidoDetalhe = pedidosList.find((p) => p.id === detalheId) ?? null;

  // ─── Ações ──────────────────────────────────────────────────────────────

  function handleNovoPedido(novoPedido: PedidoSistema) {
    setPedidosList((prev) => [novoPedido, ...prev]);
  }

  async function handleStatusChange(
    pedidoId: string,
    campo: Parameters<typeof atualizarStatusPedido>[1],
    valor: string,
  ) {
    startTransition(async () => {
      const r = await atualizarStatusPedido(pedidoId, campo, valor);
      if (r.success) {
        setPedidosList((prev) =>
          prev.map((p) => (p.id === pedidoId ? { ...p, [campo]: valor } : p)),
        );
        toast.success(r.message);
      } else {
        toast.error(r.message);
      }
    });
  }

  async function handleItemSeparado(
    itemId: string,
    pedidoId: string,
    separado: boolean,
  ) {
    startTransition(async () => {
      const r = await marcarItemSeparado(itemId, separado);
      if (r.success) {
        setPedidosList((prev) =>
          prev.map((p) =>
            p.id === pedidoId
              ? {
                  ...p,
                  itens: p.itens.map((i) =>
                    i.id === itemId ? { ...i, separado } : i,
                  ),
                }
              : p,
          ),
        );
      }
    });
  }

  async function handleDelete() {
    const ids = Array.from(selectedIds);
    startTransition(async () => {
      const r = await excluirPedidos(ids);
      if (r.success) {
        setPedidosList((prev) => prev.filter((p) => !selectedIds.has(p.id)));
        setSelectedIds(new Set());
        toast.success(r.message);
      } else {
        toast.error(r.message);
      }
      setDeleteOpen(false);
    });
  }

  // ─── Export ─────────────────────────────────────────────────────────────

  async function handleExport() {
    startTransition(async () => {
      try {
        const data = await exportarPedidosAction();
        const blob = new Blob([JSON.stringify(data, null, 2)], {
          type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `pedidos-${new Date().toISOString().split("T")[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success(`${data.total} pedidos exportados!`);
      } catch {
        toast.error("Erro ao exportar pedidos.");
      }
    });
  }

  // ─── Import ─────────────────────────────────────────────────────────────

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    setImporting(true);
    try {
      const json = JSON.parse(await file.text());
      const lista = Array.isArray(json) ? json : json.pedidos;
      if (!Array.isArray(lista)) {
        toast.error("Arquivo JSON inválido.");
        return;
      }

      const TAM = 100;
      let importados = 0;
      let pulados = 0;

      for (let i = 0; i < lista.length; i += TAM) {
        const r = await importarPedidosLoteAction(
          lista.slice(i, i + TAM),
          "pular",
        );
        if (!r.success) {
          toast.error(`Falha no lote ${Math.floor(i / TAM) + 1}: ${r.message}`);
          break;
        }
        importados += r.importados;
        pulados += r.pulados;
      }

      toast.success(`${importados} importados, ${pulados} já existiam.`);
      router.refresh();
    } catch {
      toast.error("Erro ao processar arquivo JSON.");
    } finally {
      setImporting(false);
    }
  }

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4 text-white">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <div className="relative max-w-md flex-1">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder="Buscar por código, cliente, unidade..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute top-1/2 right-3 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Filtro de status */}
        <Select value={filtroStatus} onValueChange={setFiltroStatus}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="Devendo">Devendo</SelectItem>
            <SelectItem value="Entregue">Entregue</SelectItem>
          </SelectContent>
        </Select>

        {/* Ações */}
        <div className="flex items-center gap-2">
          {selectedIds.size > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setDeleteOpen(true)}
              disabled={isPending}
            >
              <Trash2 className="mr-1.5 h-4 w-4" />
              Excluir ({selectedIds.size})
            </Button>
          )}

          {/* Export */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExport}
                  disabled={isPending}
                >
                  {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  <span className="ml-1.5 hidden sm:inline">Exportar</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Baixar todos os pedidos em JSON</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Import */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={importing}
                >
                  {importing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  <span className="ml-1.5 hidden sm:inline">Importar</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Importar pedidos de arquivo JSON</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleImport}
          />

          {/* Registrar */}
          <Button
            size="sm"
            onClick={() => setRegistrarOpen(true)}
            className="bg-orange-600 hover:bg-orange-700"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Registrar Pedido
          </Button>
        </div>
      </div>

      {/* Resumo */}
      <div className="flex items-center gap-6 text-sm text-neutral-500">
        <span>
          <span className="font-semibold text-neutral-100">
            {pedidosFiltrados.length}
          </span>{" "}
          pedido(s)
        </span>
        <span>
          Total Volus:{" "}
          <span className="font-semibold text-neutral-100">
            R${" "}
            {pedidosFiltrados
              .reduce((acc, p) => acc + Number(p.saldoVolus), 0)
              .toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </span>
        </span>
        <span>
          Por Fora:{" "}
          <span className="font-semibold text-neutral-100">
            R${" "}
            {pedidosFiltrados
              .reduce((acc, p) => acc + Number(p.saldoPorFora), 0)
              .toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </span>
        </span>
      </div>

      {/* Tabela */}
      <div className="overflow-hidden rounded-xl border border-neutral-900 bg-neutral-950">
        <Table>
          <TableHeader>
            <TableRow className="bg-neutral-800 hover:bg-neutral-800">
              <TableHead className="w-10 pl-4">
                <Checkbox
                  checked={
                    pedidosFiltrados.length > 0 &&
                    selectedIds.size === pedidosFiltrados.length
                  }
                  onCheckedChange={toggleSelectAll}
                />
              </TableHead>
              <TableHead className="font-semibold text-neutral-200">
                Código
              </TableHead>
              <TableHead className="font-semibold text-neutral-200">
                Cliente
              </TableHead>
              <TableHead className="hidden font-semibold text-neutral-200 md:table-cell">
                Data
              </TableHead>
              <TableHead className="hidden font-semibold text-neutral-200 lg:table-cell">
                Itens
              </TableHead>
              <TableHead className="hidden font-semibold text-neutral-200 md:table-cell">
                Pagamento
              </TableHead>
              <TableHead className="hidden font-semibold text-neutral-200 md:table-cell">
                Pedido
              </TableHead>
              <TableHead className="hidden font-semibold text-neutral-200 lg:table-cell">
                Pacote
              </TableHead>
              <TableHead className="hidden font-semibold text-neutral-200 lg:table-cell">
                Volus
              </TableHead>
              <TableHead className="w-20 text-right font-semibold text-neutral-200">
                Ações
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pedidosFiltrados.length === 0 && (
              <TableRow>
                <TableCell colSpan={10} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-2 text-neutral-400">
                    <ShoppingBag className="h-10 w-10 opacity-30" />
                    <p className="text-sm font-medium">
                      Nenhum pedido encontrado
                    </p>
                    {search || filtroStatus !== "todos" ? (
                      <p className="text-xs">Tente ajustar os filtros</p>
                    ) : (
                      <p className="text-xs">
                        Clique em &quot;Registrar Pedido&quot; para começar
                      </p>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )}
            {pedidosFiltrados.map((pedido) => {
              const isExpanded = expandedIds.has(pedido.id);
              const isSelected = selectedIds.has(pedido.id);
              const totalItens = pedido.itens.reduce(
                (a, i) => a + i.quantidade,
                0,
              );
              const dataFormatada = pedido.dataPedido
                ? format(
                    new Date(pedido.dataPedido + "T12:00:00Z"),
                    "dd/MM/yyyy",
                    { locale: ptBR },
                  )
                : "-";

              return (
                <>
                  <TableRow
                    key={pedido.id}
                    className={`group cursor-pointer transition-colors ${
                      isSelected ? "bg-orange-50/60" : "hover:bg-neutral-800/80"
                    }`}
                    onClick={() => toggleExpand(pedido.id)}
                  >
                    <TableCell
                      className="pl-4"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleSelect(pedido.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-xs font-semibold text-orange-600">
                        {pedido.codigo}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium text-neutral-100">
                          {pedido.clienteNome}
                        </p>
                        <p className="text-xs text-neutral-500">
                          {pedido.corporacao} • {pedido.unidade || "—"}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="hidden text-sm text-neutral-600 md:table-cell">
                      <div>
                        <p>{dataFormatada}</p>
                        <p className="text-xs text-neutral-400">
                          {pedido.horarioRegistrado}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="hidden text-sm text-neutral-600 lg:table-cell">
                      <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-700">
                        {totalItens} un.
                      </span>
                    </TableCell>
                    <TableCell
                      className="hidden md:table-cell"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="focus:outline-none">
                            <BadgePagamento status={pedido.statusPagamento} />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-40">
                          <DropdownMenuLabel className="text-xs text-neutral-500">
                            Pagamento
                          </DropdownMenuLabel>
                          <DropdownMenuRadioGroup
                            value={pedido.statusPagamento}
                            onValueChange={(v) =>
                              handleStatusChange(
                                pedido.id,
                                "statusPagamento",
                                v,
                              )
                            }
                          >
                            <DropdownMenuRadioItem value="Pago">
                              Pago
                            </DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value="Não pago">
                              Não pago
                            </DropdownMenuRadioItem>
                          </DropdownMenuRadioGroup>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                    <TableCell
                      className="hidden md:table-cell"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="focus:outline-none">
                            <BadgePedido status={pedido.statusPedido} />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-40">
                          <DropdownMenuLabel className="text-xs text-neutral-500">
                            Status do Pedido
                          </DropdownMenuLabel>
                          <DropdownMenuRadioGroup
                            value={pedido.statusPedido}
                            onValueChange={(v) =>
                              handleStatusChange(pedido.id, "statusPedido", v)
                            }
                          >
                            <DropdownMenuRadioItem value="Devendo">
                              Devendo
                            </DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value="Entregue">
                              Entregue
                            </DropdownMenuRadioItem>
                          </DropdownMenuRadioGroup>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                    <TableCell
                      className="hidden lg:table-cell"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="focus:outline-none">
                            <BadgePacote status={pedido.statusPacote} />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-40">
                          <DropdownMenuLabel className="text-xs text-neutral-500">
                            Pacote
                          </DropdownMenuLabel>
                          <DropdownMenuRadioGroup
                            value={pedido.statusPacote}
                            onValueChange={(v) =>
                              handleStatusChange(pedido.id, "statusPacote", v)
                            }
                          >
                            <DropdownMenuRadioItem value="Não criado">
                              Não criado
                            </DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value="Criado">
                              Criado
                            </DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value="Lacrado">
                              Lacrado
                            </DropdownMenuRadioItem>
                          </DropdownMenuRadioGroup>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                    <TableCell className="hidden text-sm lg:table-cell">
                      <div>
                        <p className="font-medium text-neutral-100">
                          R${" "}
                          {Number(pedido.saldoVolus).toLocaleString("pt-BR", {
                            minimumFractionDigits: 2,
                          })}
                        </p>
                        {Number(pedido.saldoPorFora) > 0 && (
                          <p className="text-xs text-neutral-500">
                            +R${" "}
                            {Number(pedido.saldoPorFora).toLocaleString(
                              "pt-BR",
                              {
                                minimumFractionDigits: 2,
                              },
                            )}{" "}
                            fora
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell
                      className="text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleExpand(pedido.id);
                          }}
                          className="rounded p-1 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700"
                        >
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="rounded p-1 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700">
                              <MoreHorizontal className="h-4 w-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuLabel className="text-xs text-neutral-500">
                              {pedido.codigo}
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                setDetalheId(pedido.id);
                                setDetalheOpen(true);
                              }}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              Ver detalhes
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuSub>
                              <DropdownMenuSubTrigger>
                                Pagamento
                              </DropdownMenuSubTrigger>
                              <DropdownMenuSubContent>
                                <DropdownMenuRadioGroup
                                  value={pedido.statusPagamento}
                                  onValueChange={(v) =>
                                    handleStatusChange(
                                      pedido.id,
                                      "statusPagamento",
                                      v,
                                    )
                                  }
                                >
                                  <DropdownMenuRadioItem value="Pago">
                                    Pago
                                  </DropdownMenuRadioItem>
                                  <DropdownMenuRadioItem value="Não pago">
                                    Não pago
                                  </DropdownMenuRadioItem>
                                </DropdownMenuRadioGroup>
                              </DropdownMenuSubContent>
                            </DropdownMenuSub>
                            <DropdownMenuSub>
                              <DropdownMenuSubTrigger>
                                Status Pedido
                              </DropdownMenuSubTrigger>
                              <DropdownMenuSubContent>
                                <DropdownMenuRadioGroup
                                  value={pedido.statusPedido}
                                  onValueChange={(v) =>
                                    handleStatusChange(
                                      pedido.id,
                                      "statusPedido",
                                      v,
                                    )
                                  }
                                >
                                  <DropdownMenuRadioItem value="Devendo">
                                    Devendo
                                  </DropdownMenuRadioItem>
                                  <DropdownMenuRadioItem value="Entregue">
                                    Entregue
                                  </DropdownMenuRadioItem>
                                </DropdownMenuRadioGroup>
                              </DropdownMenuSubContent>
                            </DropdownMenuSub>
                            <DropdownMenuSub>
                              <DropdownMenuSubTrigger>
                                Pacote
                              </DropdownMenuSubTrigger>
                              <DropdownMenuSubContent>
                                <DropdownMenuRadioGroup
                                  value={pedido.statusPacote}
                                  onValueChange={(v) =>
                                    handleStatusChange(
                                      pedido.id,
                                      "statusPacote",
                                      v,
                                    )
                                  }
                                >
                                  <DropdownMenuRadioItem value="Não criado">
                                    Não criado
                                  </DropdownMenuRadioItem>
                                  <DropdownMenuRadioItem value="Criado">
                                    Criado
                                  </DropdownMenuRadioItem>
                                  <DropdownMenuRadioItem value="Lacrado">
                                    Lacrado
                                  </DropdownMenuRadioItem>
                                </DropdownMenuRadioGroup>
                              </DropdownMenuSubContent>
                            </DropdownMenuSub>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600 focus:text-red-600"
                              onClick={() => {
                                setSelectedIds(new Set([pedido.id]));
                                setDeleteOpen(true);
                              }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>

                  {/* Linha expandida: itens do pedido */}
                  {isExpanded && (
                    <TableRow
                      key={`${pedido.id}-expanded`}
                      className="bg-neutral-800/50 hover:bg-neutral-800/50"
                    >
                      <TableCell colSpan={10} className="px-6 py-3">
                        <div className="space-y-2">
                          <p className="text-xs font-semibold tracking-wider text-neutral-400 uppercase">
                            Itens do Pedido
                          </p>
                          {pedido.itens.length === 0 ? (
                            <p className="text-sm text-neutral-400 italic">
                              Nenhum item registrado.
                            </p>
                          ) : (
                            <div className="overflow-hidden rounded-lg border border-neutral-200 bg-neutral-800">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="border-b border-neutral-100 bg-neutral-800">
                                    <th className="px-3 py-2 text-left text-xs font-semibold text-neutral-500">
                                      Produto
                                    </th>
                                    <th className="px-3 py-2 text-left text-xs font-semibold text-neutral-500">
                                      Tam.
                                    </th>
                                    <th className="px-3 py-2 text-left text-xs font-semibold text-neutral-500">
                                      Cor
                                    </th>
                                    <th className="px-3 py-2 text-center text-xs font-semibold text-neutral-500">
                                      Qtd.
                                    </th>
                                    <th className="px-3 py-2 text-right text-xs font-semibold text-neutral-500">
                                      Preço
                                    </th>
                                    <th className="px-3 py-2 text-center text-xs font-semibold text-neutral-500">
                                      Separado
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {pedido.itens.map((item) => (
                                    <tr
                                      key={item.id}
                                      className="border-b border-neutral-50 last:border-0"
                                    >
                                      <td className="px-3 py-2 font-medium text-neutral-800">
                                        {item.nome}
                                        {item.observacao && (
                                          <span className="ml-2 text-xs text-neutral-400 italic">
                                            {item.observacao}
                                          </span>
                                        )}
                                      </td>
                                      <td className="px-3 py-2 text-neutral-600">
                                        {item.tamanho}
                                      </td>
                                      <td className="px-3 py-2 text-neutral-600">
                                        {item.cor || "—"}
                                      </td>
                                      <td className="px-3 py-2 text-center text-neutral-600">
                                        {item.quantidade}
                                      </td>
                                      <td className="px-3 py-2 text-right font-medium text-neutral-800">
                                        R${" "}
                                        {Number(
                                          item.precoUnitario,
                                        ).toLocaleString("pt-BR", {
                                          minimumFractionDigits: 2,
                                        })}
                                      </td>
                                      <td className="px-3 py-2 text-center">
                                        <Checkbox
                                          checked={item.separado}
                                          onCheckedChange={(v) =>
                                            handleItemSeparado(
                                              item.id,
                                              pedido.id,
                                              !!v,
                                            )
                                          }
                                          disabled={isPending}
                                        />
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                          {pedido.observacao && (
                            <p className="text-xs text-neutral-500">
                              <span className="font-medium">Obs:</span>{" "}
                              {pedido.observacao}
                            </p>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Dialog: Registrar pedido */}
      <RegistrarPedidoDialog
        open={registrarOpen}
        onOpenChange={setRegistrarOpen}
        onSuccess={handleNovoPedido}
      />

      {/* Dialog: Detalhe do pedido */}
      <Dialog open={detalheOpen} onOpenChange={setDetalheOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="font-mono text-orange-600">
                {pedidoDetalhe?.codigo}
              </span>
              <span className="text-neutral-400">—</span>
              {pedidoDetalhe?.clienteNome}
            </DialogTitle>
          </DialogHeader>
          {pedidoDetalhe && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4 rounded-lg border border-neutral-100 bg-neutral-800 p-4">
                <div>
                  <Label className="text-xs text-neutral-500">Corporação</Label>
                  <p className="font-medium">{pedidoDetalhe.corporacao}</p>
                </div>
                <div>
                  <Label className="text-xs text-neutral-500">Unidade</Label>
                  <p className="font-medium">{pedidoDetalhe.unidade || "—"}</p>
                </div>
                <div>
                  <Label className="text-xs text-neutral-500">Contato</Label>
                  <p className="font-medium">{pedidoDetalhe.contato || "—"}</p>
                </div>
                <div>
                  <Label className="text-xs text-neutral-500">Data</Label>
                  <p className="font-medium">
                    {pedidoDetalhe.dataPedido
                      ? format(
                          new Date(pedidoDetalhe.dataPedido + "T12:00:00Z"),
                          "dd/MM/yyyy",
                          { locale: ptBR },
                        )
                      : "—"}{" "}
                    às {pedidoDetalhe.horarioRegistrado}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-neutral-500">
                    Saldo Volus
                  </Label>
                  <p className="font-semibold text-neutral-100">
                    R${" "}
                    {Number(pedidoDetalhe.saldoVolus).toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                    })}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-neutral-500">Por Fora</Label>
                  <p className="font-semibold text-neutral-100">
                    R${" "}
                    {Number(pedidoDetalhe.saldoPorFora).toLocaleString(
                      "pt-BR",
                      { minimumFractionDigits: 2 },
                    )}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <BadgePagamento status={pedidoDetalhe.statusPagamento} />
                <BadgePedido status={pedidoDetalhe.statusPedido} />
                <BadgePacote status={pedidoDetalhe.statusPacote} />
              </div>

              {pedidoDetalhe.observacao && (
                <div className="rounded-lg border border-amber-100 bg-amber-50 p-3 text-sm text-amber-900">
                  <span className="font-semibold">Observação: </span>
                  {pedidoDetalhe.observacao}
                </div>
              )}

              <div>
                <p className="mb-2 font-semibold text-neutral-700">Itens</p>
                <div className="space-y-1">
                  {pedidoDetalhe.itens.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-lg border border-neutral-100 p-2"
                    >
                      <div>
                        <span className="font-medium">{item.nome}</span>
                        <span className="ml-2 text-xs text-neutral-500">
                          {item.tamanho} {item.cor ? `/ ${item.cor}` : ""}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-right">
                        <span className="text-xs text-neutral-500">
                          x{item.quantidade}
                        </span>
                        <span className="font-semibold">
                          R${" "}
                          {Number(item.precoUnitario).toLocaleString("pt-BR", {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                        {item.separado && (
                          <Badge className="border-0 bg-emerald-100 text-xs text-emerald-700">
                            ✓ Sep.
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirmação de exclusão */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir pedidos?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. {selectedIds.size} pedido(s)
              serão excluídos permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              {isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
