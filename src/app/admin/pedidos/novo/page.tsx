"use client";

import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import {
  criarPedidoSistemaAction,
  editarPedidoSistemaAction,
  ItemPedidoItem,
  obterPedidoSistemaPorIdAction,
  obterProdutosParaPedidoAction,
} from "@/actions/pedidos-sistema";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const SALDO_VOLUS_PP = 1003.39;
const SALDO_VOLUS_PM = 1053.55;

const formatBrl = (val: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    val,
  );

export default function RegistrarPedidoPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pedidoIdEdicao = searchParams.get("id");
  const modoEdicao = Boolean(pedidoIdEdicao);

  const [produtos, setProdutos] = useState<
    {
      id: string;
      nome: string;
      preco: number;
      tamanhos: string[];
      cores: string[];
    }[]
  >([]);
  const [carregandoProdutos, setCarregandoProdutos] = useState(true);
  const [carregandoPedido, setCarregandoPedido] = useState(modoEdicao);

  // Form states
  const [corporacao, setCorporacao] = useState<
    "Polícia Militar" | "Polícia Penal"
  >("Polícia Militar");
  const [nome, setNome] = useState("");
  const [unidade, setUnidade] = useState("");
  const [contato, setContato] = useState("");
  const [dataPedido, setDataPedido] = useState("");
  const [horario, setHorario] = useState("10:00");
  const [observacao, setObservacao] = useState("");

  const [volus, setVolus] = useState("");
  const [porFora, setPorFora] = useState("");
  const [statusPagamento, setStatusPagamento] = useState<"Pago" | "Não pago">(
    "Não pago",
  );
  const [statusPacote, setStatusPacote] = useState<
    "Criado" | "Não criado" | "Lacrado"
  >("Não criado");
  const [statusPedido, setStatusPedido] = useState<"Devendo" | "Entregue">(
    "Devendo",
  );

  // Itens
  const [itens, setItens] = useState<ItemPedidoItem[]>([]);
  const [produtoId, setProdutoId] = useState("");
  const [tamanho, setTamanho] = useState("M");
  const [cor, setCor] = useState("Preto");
  const [quantidade, setQuantidade] = useState(1);

  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        setCarregandoProdutos(true);
        const list = await obterProdutosParaPedidoAction();
        setProdutos(list);
        if (list.length > 0) {
          setProdutoId(list[0].id);
          setTamanho(list[0].tamanhos[0] || "M");
          setCor(list[0].cores[0] || "Preto");
        }
      } catch (e) {
        console.error(e);
        toast.error("Erro ao carregar lista de produtos.");
      } finally {
        setCarregandoProdutos(false);
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    if (!modoEdicao || !pedidoIdEdicao) return;
    async function loadPedido() {
      try {
        setCarregandoPedido(true);
        const p = await obterPedidoSistemaPorIdAction(pedidoIdEdicao!);
        if (!p) {
          toast.error("Pedido não encontrado.");
          return;
        }
        setCorporacao(p.corporacao);
        setNome(p.cliente);
        setUnidade(p.unidade);
        setContato(p.contato);
        setDataPedido(p.dataPedido);
        setHorario(p.horarioRegistrado);
        setObservacao(p.observacao || "");
        setVolus(String(p.saldoVolus || ""));
        setPorFora(String(p.saldoPorFora || ""));
        setStatusPagamento(p.statusPagamento);
        setStatusPacote(p.statusPacote);
        setStatusPedido(p.statusPedido);
        setItens(p.itens);
      } catch (e) {
        console.error(e);
        toast.error("Erro ao carregar dados do pedido.");
      } finally {
        setCarregandoPedido(false);
      }
    }
    loadPedido();
  }, [modoEdicao, pedidoIdEdicao]);

  const produtoSelecionado =
    produtos.find((p) => p.id === produtoId) || produtos[0];

  const trocarProduto = (id: string) => {
    const p = produtos.find((x) => x.id === id);
    if (p) {
      setProdutoId(id);
      setTamanho(p.tamanhos[0] || "M");
      setCor(p.cores[0] || "Preto");
    }
  };

  const adicionarItem = () => {
    if (!produtoSelecionado) return;
    setItens((prev) => [
      ...prev,
      {
        id: `item-${Date.now()}`,
        produtoId: produtoSelecionado.id,
        nome: produtoSelecionado.nome,
        tamanho,
        cor,
        quantidade,
        precoUnitario: produtoSelecionado.preco,
        separado: false,
      },
    ]);
    setQuantidade(1);
  };

  const removerItem = (id?: string) => {
    if (!id) return;
    setItens((prev) => prev.filter((i) => i.id !== id));
  };

  const total = itens.reduce(
    (soma, i) => soma + i.precoUnitario * i.quantidade,
    0,
  );

  const handleSalvar = async () => {
    if (!nome.trim()) {
      toast.error("Preencha o nome do agente/cliente.");
      return;
    }
    if (itens.length === 0) {
      toast.error("Adicione pelo menos 1 item ao pedido.");
      return;
    }

    try {
      setSalvando(true);
      if (modoEdicao && pedidoIdEdicao) {
        const res = await editarPedidoSistemaAction(pedidoIdEdicao, {
          clienteNome: nome,
          corporacao,
          unidade,
          contato,
          dataPedido,
          horarioRegistrado: horario,
          observacao,
          saldoVolus: Number(volus) || 0,
          saldoPorFora: Number(porFora) || 0,
          statusPagamento,
          statusPedido,
          statusPacote,
          itens,
        });

        if (res.success) {
          toast.success("Pedido atualizado com sucesso!");
          router.push("/admin/pedidos");
        } else {
          toast.error(res.error || "Erro ao atualizar pedido.");
        }
      } else {
        const res = await criarPedidoSistemaAction({
          clienteNome: nome,
          corporacao,
          unidade,
          contato,
          dataPedido,
          horarioRegistrado: horario,
          observacao,
          saldoVolus: Number(volus) || 0,
          saldoPorFora: Number(porFora) || 0,
          statusPagamento,
          statusPacote,
          itens,
        });

        if (res.success) {
          toast.success("Pedido criado com sucesso!");
          router.push("/admin/pedidos");
        } else {
          toast.error(res.error || "Erro ao criar pedido.");
        }
      }
    } catch (e) {
      console.error(e);
      toast.error("Erro inesperado ao salvar pedido.");
    } finally {
      setSalvando(false);
    }
  };

  if (carregandoProdutos || carregandoPedido) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-neutral-400">
        Carregando formulário de pedido...
      </div>
    );
  }

  return (
    <div className="mx-auto space-y-8 pt-6 pb-20">
      <div className="flex items-center gap-4">
        <Link href="/admin/pedidos">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 border-white/10 bg-transparent text-white hover:bg-white/10"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="font-clash-display text-2xl font-medium text-white">
          {modoEdicao ? "Editar Pedido" : "Registrar Novo Pedido"}
        </h1>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        <div className="space-y-8 md:col-span-2">
          {/* DADOS DO CLIENTE */}
          <Card className="border-white/10 bg-[#0A0A0A]">
            <CardHeader>
              <CardTitle className="text-white">
                Dados do Cliente / Agente
              </CardTitle>
              <CardDescription>
                Informações de localização e contato.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-neutral-400">Corporação</label>
                  <select
                    value={corporacao}
                    onChange={(e) =>
                      setCorporacao(
                        e.target.value as "Polícia Militar" | "Polícia Penal",
                      )
                    }
                    className="mt-1 h-10 w-full rounded-md border border-white/10 bg-white/5 px-3 text-sm text-white"
                  >
                    <option value="Polícia Militar" className="bg-[#111]">
                      Polícia Militar
                    </option>
                    <option value="Polícia Penal" className="bg-[#111]">
                      Polícia Penal
                    </option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-neutral-400">
                    Nome Completo
                  </label>
                  <Input
                    placeholder="Ex: Sd. Rafael Moreira"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className="mt-1 border-white/10 bg-white/5 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-neutral-400">Unidade</label>
                  <Input
                    placeholder="Ex: 2º BPM — Fortaleza"
                    value={unidade}
                    onChange={(e) => setUnidade(e.target.value)}
                    className="mt-1 border-white/10 bg-white/5 text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-neutral-400">
                    Contato / WhatsApp
                  </label>
                  <Input
                    placeholder="(85) 90000-0000"
                    value={contato}
                    onChange={(e) => setContato(e.target.value)}
                    className="mt-1 border-white/10 bg-white/5 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-neutral-400">
                    Data do Pedido (DD/MM/AAAA)
                  </label>
                  <Input
                    placeholder="DD/MM/AAAA"
                    value={dataPedido}
                    onChange={(e) => setDataPedido(e.target.value)}
                    className="mt-1 border-white/10 bg-white/5 text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-neutral-400">
                    Horário Registrado
                  </label>
                  <Input
                    type="time"
                    value={horario}
                    onChange={(e) => setHorario(e.target.value)}
                    className="mt-1 border-white/10 bg-white/5 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-neutral-400">Observações</label>
                <Input
                  placeholder="Ex: Prefere retirar presencialmente na loja"
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value)}
                  className="mt-1 border-white/10 bg-white/5 text-white"
                />
              </div>
            </CardContent>
          </Card>

          {/* PRODUTOS DO PEDIDO */}
          <Card className="border-white/10 bg-[#0A0A0A]">
            <CardHeader>
              <CardTitle className="text-white">Produtos do Pedido</CardTitle>
              <CardDescription>
                Selecione produtos do catálogo com tamanho e cor específicos.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-xs text-neutral-400">Produto</label>
                  <select
                    value={produtoId}
                    onChange={(e) => trocarProduto(e.target.value)}
                    className="mt-1 h-10 w-full rounded-md border border-white/10 bg-white/5 px-3 text-sm text-white"
                  >
                    {produtos.map((p) => (
                      <option key={p.id} value={p.id} className="bg-[#111]">
                        {p.nome} — {formatBrl(p.preco)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-neutral-400">Tamanho</label>
                  <select
                    value={tamanho}
                    onChange={(e) => setTamanho(e.target.value)}
                    className="mt-1 h-10 w-full rounded-md border border-white/10 bg-white/5 px-3 text-sm text-white"
                  >
                    {(produtoSelecionado?.tamanhos || ["M"]).map((t) => (
                      <option key={t} value={t} className="bg-[#111]">
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-neutral-400">Cor</label>
                  <select
                    value={cor}
                    onChange={(e) => setCor(e.target.value)}
                    className="mt-1 h-10 w-full rounded-md border border-white/10 bg-white/5 px-3 text-sm text-white"
                  >
                    {(produtoSelecionado?.cores || ["Preto"]).map((c) => (
                      <option key={c} value={c} className="bg-[#111]">
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-end gap-3">
                <div className="w-32">
                  <label className="text-xs text-neutral-400">Quantidade</label>
                  <Input
                    type="number"
                    min={1}
                    value={quantidade}
                    onChange={(e) =>
                      setQuantidade(Math.max(1, Number(e.target.value) || 1))
                    }
                    className="mt-1 border-white/10 bg-white/5 text-white"
                  />
                </div>
                <Button
                  type="button"
                  onClick={adicionarItem}
                  className="bg-white text-black hover:bg-neutral-200"
                >
                  Adicionar ao Pedido
                </Button>
              </div>

              {/* LISTA DE ITENS */}
              <div className="pt-4">
                {itens.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-white/10 p-6 text-center text-xs text-neutral-500">
                    Nenhum item adicionado ao pedido.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {itens.map((it) => (
                      <div
                        key={it.id}
                        className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-3 text-xs"
                      >
                        <span className="text-white">
                          {it.quantidade}x {it.nome} — {it.tamanho} ({it.cor})
                        </span>
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-bold text-[#D00000]">
                            {formatBrl(it.precoUnitario * it.quantidade)}
                          </span>
                          <button
                            type="button"
                            onClick={() => removerItem(it.id)}
                            className="text-neutral-500 hover:text-red-400"
                          >
                            Remover
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* PAGAMENTO */}
          <Card className="border-white/10 bg-[#0A0A0A]">
            <CardHeader>
              <CardTitle className="text-white">Forma de Pagamento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-neutral-400">
                    Saldo Vólus (R$)
                  </label>
                  <Input
                    type="number"
                    placeholder="0,00"
                    value={volus}
                    onChange={(e) => setVolus(e.target.value)}
                    className="mt-1 border-white/10 bg-white/5 text-white"
                  />
                  <div className="mt-2 flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setVolus(String(SALDO_VOLUS_PP))}
                      className="h-7 border-white/10 text-[10px] text-white"
                    >
                      PP · {formatBrl(SALDO_VOLUS_PP)}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setVolus(String(SALDO_VOLUS_PM))}
                      className="h-7 border-white/10 text-[10px] text-white"
                    >
                      PM · {formatBrl(SALDO_VOLUS_PM)}
                    </Button>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-neutral-400">
                    Pago por fora (R$)
                  </label>
                  <Input
                    type="number"
                    placeholder="0,00"
                    value={porFora}
                    onChange={(e) => setPorFora(e.target.value)}
                    className="mt-1 border-white/10 bg-white/5 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-neutral-400">
                    Status do Pagamento
                  </label>
                  <select
                    value={statusPagamento}
                    onChange={(e) =>
                      setStatusPagamento(e.target.value as "Pago" | "Não pago")
                    }
                    className="mt-1 h-10 w-full rounded-md border border-white/10 bg-white/5 px-3 text-sm text-white"
                  >
                    <option value="Não pago" className="bg-[#111]">
                      Não pago
                    </option>
                    <option value="Pago" className="bg-[#111]">
                      Pago
                    </option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-neutral-400">
                    Status do Pacote
                  </label>
                  <select
                    value={statusPacote}
                    onChange={(e) =>
                      setStatusPacote(
                        e.target.value as "Criado" | "Não criado" | "Lacrado",
                      )
                    }
                    className="mt-1 h-10 w-full rounded-md border border-white/10 bg-white/5 px-3 text-sm text-white"
                  >
                    <option value="Não criado" className="bg-[#111]">
                      Não criado
                    </option>
                    <option value="Criado" className="bg-[#111]">
                      Criado
                    </option>
                    <option value="Lacrado" className="bg-[#111]">
                      Lacrado
                    </option>
                  </select>
                </div>
              </div>

              {modoEdicao && (
                <div>
                  <label className="text-xs text-neutral-400">
                    Status do Pedido
                  </label>
                  <select
                    value={statusPedido}
                    onChange={(e) =>
                      setStatusPedido(e.target.value as "Devendo" | "Entregue")
                    }
                    className="mt-1 h-10 w-full rounded-md border border-white/10 bg-white/5 px-3 text-sm text-white"
                  >
                    <option value="Devendo" className="bg-[#111]">
                      A Entregar
                    </option>
                    <option value="Entregue" className="bg-[#111]">
                      Entregue
                    </option>
                  </select>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* RESUMO FIXO */}
        <div>
          <Card className="sticky top-24 border-white/10 bg-[#0A0A0A]">
            <CardHeader>
              <CardTitle className="text-white">Resumo do Pedido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <span className="text-xs text-neutral-400">
                  Total do Pedido:
                </span>
                <p className="font-mono text-3xl font-bold text-white">
                  {formatBrl(total)}
                </p>
              </div>

              <div className="space-y-2 border-t border-white/10 pt-4 text-xs text-neutral-300">
                <div className="flex justify-between">
                  <span className="text-neutral-500">Agente/Cliente:</span>
                  <span className="font-medium text-white">{nome || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Corporação:</span>
                  <span className="font-medium text-white">{corporacao}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Itens:</span>
                  <span className="font-medium text-white">{itens.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Vólus:</span>
                  <span className="font-medium text-white">
                    {volus ? formatBrl(Number(volus)) : "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Por fora:</span>
                  <span className="font-medium text-white">
                    {porFora ? formatBrl(Number(porFora)) : "—"}
                  </span>
                </div>
              </div>

              <Button
                onClick={handleSalvar}
                disabled={salvando || !nome || itens.length === 0}
                className="mt-4 h-12 w-full bg-[#D00000] font-bold text-white hover:bg-[#a00000]"
              >
                {salvando ? "Salvando..." : "Salvar Pedido"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
