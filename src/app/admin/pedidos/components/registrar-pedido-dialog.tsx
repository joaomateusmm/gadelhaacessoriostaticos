"use client";

import { Loader2, Minus, Plus, Trash2 } from "lucide-react";
import React, { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

import {
  listarProdutosAtivos,
  type PedidoSistema,
  registrarPedido,
} from "@/actions/pedidos-balcao";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

// ─── Types ───────────────────────────────────────────────────────────────────

type Produto = {
  id: string;
  name: string;
  price: number;
  images: string[] | null;
};

type ItemForm = {
  produtoId: string;
  nome: string;
  tamanho: string;
  cor: string;
  quantidade: number;
  precoUnitario: number;
  separado: boolean;
  observacao: string;
};

type FormState = {
  clienteNome: string;
  corporacao: "Polícia Militar" | "Polícia Penal";
  unidade: string;
  contato: string;
  dataPedido: string;
  horarioRegistrado: string;
  saldoVolus: string;
  saldoPorFora: string;
  statusPagamento: "Pago" | "Não pago";
  statusPedido: "Devendo" | "Entregue";
  statusPacote: "Criado" | "Não criado" | "Lacrado";
  tipoPagamento: string;
  observacao: string;
  itens: ItemForm[];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function hoje() {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

function horaAtual() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function emptyItem(): ItemForm {
  return {
    produtoId: "",
    nome: "",
    tamanho: "M",
    cor: "",
    quantidade: 1,
    precoUnitario: 0,
    separado: false,
    observacao: "",
  };
}

function initialState(): FormState {
  return {
    clienteNome: "",
    corporacao: "Polícia Militar",
    unidade: "",
    contato: "",
    dataPedido: hoje(),
    horarioRegistrado: horaAtual(),
    saldoVolus: "0",
    saldoPorFora: "0",
    statusPagamento: "Não pago",
    statusPedido: "Devendo",
    statusPacote: "Não criado",
    tipoPagamento: "",
    observacao: "",
    itens: [],
  };
}

// ─── Componente ──────────────────────────────────────────────────────────────

interface RegistrarPedidoDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSuccess: (pedido: PedidoSistema) => void;
}

export function RegistrarPedidoDialog({
  open,
  onOpenChange,
  onSuccess,
}: RegistrarPedidoDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [form, setForm] = useState<FormState>(initialState);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Carrega produtos ao abrir
  useEffect(() => {
    if (open) {
      listarProdutosAtivos().then(setProdutos).catch(console.error);
    }
  }, [open]);

  function set<K extends keyof FormState>(key: K, val: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: val }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
  }

  function setItem<K extends keyof ItemForm>(
    index: number,
    key: K,
    val: ItemForm[K],
  ) {
    setForm((prev) => {
      const itens = [...prev.itens];
      itens[index] = { ...itens[index], [key]: val };
      return { ...prev, itens };
    });
  }

  function addItem() {
    setForm((prev) => ({ ...prev, itens: [...prev.itens, emptyItem()] }));
  }

  function removeItem(index: number) {
    setForm((prev) => ({
      ...prev,
      itens: prev.itens.filter((_, i) => i !== index),
    }));
  }

  function selectProduto(index: number, produtoId: string) {
    const p = produtos.find((x) => x.id === produtoId);
    if (!p) return;
    setForm((prev) => {
      const itens = [...prev.itens];
      itens[index] = {
        ...itens[index],
        produtoId,
        nome: p.name,
        precoUnitario: p.price / 100,
      };
      return { ...prev, itens };
    });
  }

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!form.clienteNome.trim()) errs.clienteNome = "Nome obrigatório";
    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(form.dataPedido))
      errs.dataPedido = "Formato DD/MM/AAAA";
    if (!/^\d{2}:\d{2}$/.test(form.horarioRegistrado))
      errs.horarioRegistrado = "Formato HH:MM";
    form.itens.forEach((item, i) => {
      if (!item.nome.trim()) errs[`item_${i}_nome`] = "Nome obrigatório";
    });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleClose() {
    setForm(initialState());
    setErrors({});
    onOpenChange(false);
  }

  function handleSubmit() {
    if (!validate()) return;

    startTransition(async () => {
      const result = await registrarPedido({
        clienteNome: form.clienteNome.trim(),
        corporacao: form.corporacao,
        unidade: form.unidade,
        contato: form.contato,
        dataPedido: form.dataPedido,
        horarioRegistrado: form.horarioRegistrado,
        saldoVolus: parseFloat(form.saldoVolus) || 0,
        saldoPorFora: parseFloat(form.saldoPorFora) || 0,
        statusPagamento: form.statusPagamento,
        statusPedido: form.statusPedido,
        statusPacote: form.statusPacote,
        tipoPagamento: form.tipoPagamento || null,
        tipoEntrega: null,
        observacao: form.observacao || null,
        itens: form.itens.map((i) => ({
          produtoId: i.produtoId || null,
          nome: i.nome,
          tamanho: i.tamanho,
          cor: i.cor,
          quantidade: i.quantidade,
          precoUnitario: i.precoUnitario,
          separado: i.separado,
          observacao: i.observacao || null,
        })),
      });

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);

      // Build optimistic object for table update
      const codigoMatch = result.message.match(/PED-\d+/);
      const novoPedido: PedidoSistema = {
        id: result.pedidoId,
        codigo: codigoMatch ? codigoMatch[0] : "PED-????",
        clienteId: null,
        clienteNome: form.clienteNome.trim(),
        corporacao: form.corporacao,
        unidade: form.unidade || null,
        contato: form.contato || null,
        dataPedido: form.dataPedido.split("/").reverse().join("-"),
        horarioRegistrado: form.horarioRegistrado,
        saldoVolus: String(parseFloat(form.saldoVolus) || 0),
        saldoPorFora: String(parseFloat(form.saldoPorFora) || 0),
        statusPagamento: form.statusPagamento,
        statusPedido: form.statusPedido,
        statusPacote: form.statusPacote,
        tipoPagamento: form.tipoPagamento || null,
        tipoEntrega: null,
        observacao: form.observacao || null,
        createdAt: new Date(),
        updatedAt: new Date(),
        itens: form.itens.map((i, idx) => ({
          id: `tmp-${idx}`,
          pedidoId: result.pedidoId,
          produtoId: i.produtoId || null,
          nome: i.nome,
          tamanho: i.tamanho,
          cor: i.cor || null,
          quantidade: i.quantidade,
          precoUnitario: String(i.precoUnitario),
          separado: i.separado,
          observacao: i.observacao || null,
        })),
      };

      onSuccess(novoPedido);
      handleClose();
    });
  }

  const totalItens = form.itens.reduce(
    (acc, i) => acc + i.quantidade * i.precoUnitario,
    0,
  );

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            Registrar Pedido de Balcão
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* ─── Dados do cliente ─── */}
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Dados do Cliente
            </p>
            <div className="grid grid-cols-2 gap-3">
              {/* Nome */}
              <div className="col-span-2">
                <Label>Nome do Cliente *</Label>
                <Input
                  className="mt-1"
                  placeholder="Sd. João Silva"
                  value={form.clienteNome}
                  onChange={(e) => set("clienteNome", e.target.value)}
                />
                {errors.clienteNome && (
                  <p className="mt-1 text-xs text-red-500">{errors.clienteNome}</p>
                )}
              </div>

              {/* Corporação */}
              <div>
                <Label>Corporação *</Label>
                <Select
                  value={form.corporacao}
                  onValueChange={(v) =>
                    set("corporacao", v as FormState["corporacao"])
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Polícia Militar">Polícia Militar</SelectItem>
                    <SelectItem value="Polícia Penal">Polícia Penal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Unidade */}
              <div>
                <Label>Unidade</Label>
                <Input
                  className="mt-1"
                  placeholder="2º BPM"
                  value={form.unidade}
                  onChange={(e) => set("unidade", e.target.value)}
                />
              </div>

              {/* Contato */}
              <div className="col-span-2">
                <Label>Contato</Label>
                <Input
                  className="mt-1"
                  placeholder="(85) 9 0000-0000"
                  value={form.contato}
                  onChange={(e) => set("contato", e.target.value)}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* ─── Dados do pedido ─── */}
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Dados do Pedido
            </p>
            <div className="grid grid-cols-2 gap-3">
              {/* Data */}
              <div>
                <Label>Data *</Label>
                <Input
                  className="mt-1"
                  placeholder="DD/MM/AAAA"
                  value={form.dataPedido}
                  onChange={(e) => set("dataPedido", e.target.value)}
                />
                {errors.dataPedido && (
                  <p className="mt-1 text-xs text-red-500">{errors.dataPedido}</p>
                )}
              </div>

              {/* Horário */}
              <div>
                <Label>Horário</Label>
                <Input
                  className="mt-1"
                  placeholder="HH:MM"
                  value={form.horarioRegistrado}
                  onChange={(e) => set("horarioRegistrado", e.target.value)}
                />
                {errors.horarioRegistrado && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.horarioRegistrado}
                  </p>
                )}
              </div>

              {/* Saldo Volus */}
              <div>
                <Label>Saldo Volus (R$)</Label>
                <Input
                  className="mt-1"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.saldoVolus}
                  onChange={(e) => set("saldoVolus", e.target.value)}
                />
              </div>

              {/* Por Fora */}
              <div>
                <Label>Por Fora (R$)</Label>
                <Input
                  className="mt-1"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.saldoPorFora}
                  onChange={(e) => set("saldoPorFora", e.target.value)}
                />
              </div>

              {/* Status Pagamento */}
              <div>
                <Label>Status Pagamento</Label>
                <Select
                  value={form.statusPagamento}
                  onValueChange={(v) =>
                    set("statusPagamento", v as FormState["statusPagamento"])
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Não pago">Não pago</SelectItem>
                    <SelectItem value="Pago">Pago</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Status Pedido */}
              <div>
                <Label>Status Pedido</Label>
                <Select
                  value={form.statusPedido}
                  onValueChange={(v) =>
                    set("statusPedido", v as FormState["statusPedido"])
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Devendo">Devendo</SelectItem>
                    <SelectItem value="Entregue">Entregue</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Status Pacote */}
              <div>
                <Label>Status Pacote</Label>
                <Select
                  value={form.statusPacote}
                  onValueChange={(v) =>
                    set("statusPacote", v as FormState["statusPacote"])
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Não criado">Não criado</SelectItem>
                    <SelectItem value="Criado">Criado</SelectItem>
                    <SelectItem value="Lacrado">Lacrado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Tipo Pagamento */}
              <div>
                <Label>Tipo de Pagamento</Label>
                <Input
                  className="mt-1"
                  placeholder="PIX, Dinheiro, Cartão..."
                  value={form.tipoPagamento}
                  onChange={(e) => set("tipoPagamento", e.target.value)}
                />
              </div>
            </div>

            {/* Observação */}
            <div className="mt-3">
              <Label>Observação</Label>
              <Textarea
                className="mt-1 resize-none"
                placeholder="Informações adicionais..."
                rows={2}
                value={form.observacao}
                onChange={(e) => set("observacao", e.target.value)}
              />
            </div>
          </div>

          <Separator />

          {/* ─── Itens ─── */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                Itens do Pedido
              </p>
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Adicionar Item
              </Button>
            </div>

            <div className="space-y-3">
              {form.itens.length === 0 && (
                <p className="rounded-lg border border-dashed border-neutral-200 py-6 text-center text-sm text-neutral-400">
                  Nenhum item. Clique em &ldquo;Adicionar Item&rdquo;.
                </p>
              )}

              {form.itens.map((item, index) => (
                <div
                  key={index}
                  className="rounded-lg border border-neutral-200 bg-neutral-800 p-3"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-medium text-neutral-500">
                      Item {index + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="rounded p-1 text-red-400 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {/* Catálogo */}
                    <div className="col-span-2">
                      <Select
                        value={item.produtoId || "__manual__"}
                        onValueChange={(v) =>
                          v !== "__manual__"
                            ? selectProduto(index, v)
                            : setItem(index, "produtoId", "")
                        }
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Selecionar do catálogo (opcional)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__manual__">
                            — Inserir manualmente —
                          </SelectItem>
                          {produtos.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.name} — R${" "}
                              {(p.price / 100).toLocaleString("pt-BR", {
                                minimumFractionDigits: 2,
                              })}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Nome */}
                    <div className="col-span-2">
                      <Label className="text-xs">Nome *</Label>
                      <Input
                        className="mt-0.5 h-8 text-sm"
                        placeholder="Ex: Camisa Manga Curta"
                        value={item.nome}
                        onChange={(e) => setItem(index, "nome", e.target.value)}
                      />
                      {errors[`item_${index}_nome`] && (
                        <p className="mt-0.5 text-xs text-red-500">
                          {errors[`item_${index}_nome`]}
                        </p>
                      )}
                    </div>

                    {/* Tamanho */}
                    <div>
                      <Label className="text-xs">Tamanho</Label>
                      <Select
                        value={item.tamanho}
                        onValueChange={(v) => setItem(index, "tamanho", v)}
                      >
                        <SelectTrigger className="mt-0.5 h-8 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[
                            "PP","P","M","G","GG","XG","XGG",
                            "38","40","42","44","46","Único",
                          ].map((t) => (
                            <SelectItem key={t} value={t}>
                              {t}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Cor */}
                    <div>
                      <Label className="text-xs">Cor</Label>
                      <Input
                        className="mt-0.5 h-8 text-sm"
                        placeholder="Preto, Azul..."
                        value={item.cor}
                        onChange={(e) => setItem(index, "cor", e.target.value)}
                      />
                    </div>

                    {/* Quantidade */}
                    <div>
                      <Label className="text-xs">Quantidade</Label>
                      <div className="mt-0.5 flex h-8 overflow-hidden rounded-md border border-neutral-200">
                        <button
                          type="button"
                          onClick={() =>
                            setItem(
                              index,
                              "quantidade",
                              Math.max(1, item.quantidade - 1),
                            )
                          }
                          className="flex w-8 items-center justify-center border-r border-neutral-200 hover:bg-neutral-100"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <input
                          type="number"
                          min="1"
                          className="flex-1 text-center text-sm outline-none"
                          value={item.quantidade}
                          onChange={(e) =>
                            setItem(
                              index,
                              "quantidade",
                              parseInt(e.target.value) || 1,
                            )
                          }
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setItem(index, "quantidade", item.quantidade + 1)
                          }
                          className="flex w-8 items-center justify-center border-l border-neutral-200 hover:bg-neutral-100"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </div>

                    {/* Preço */}
                    <div>
                      <Label className="text-xs">Preço Un. (R$)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        className="mt-0.5 h-8 text-sm"
                        value={item.precoUnitario}
                        onChange={(e) =>
                          setItem(
                            index,
                            "precoUnitario",
                            parseFloat(e.target.value) || 0,
                          )
                        }
                      />
                    </div>

                    {/* Obs item */}
                    <div className="col-span-2">
                      <Label className="text-xs">Obs. do Item</Label>
                      <Input
                        className="mt-0.5 h-8 text-sm"
                        placeholder="Observação opcional..."
                        value={item.observacao}
                        onChange={(e) =>
                          setItem(index, "observacao", e.target.value)
                        }
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {form.itens.length > 0 && (
              <div className="mt-3 flex justify-end">
                <p className="text-sm font-semibold text-neutral-700">
                  Total dos itens:{" "}
                  <span className="text-orange-600">
                    R${" "}
                    {totalItens.toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isPending}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isPending}
            className="bg-orange-600 hover:bg-orange-700"
          >
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Registrar Pedido
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
