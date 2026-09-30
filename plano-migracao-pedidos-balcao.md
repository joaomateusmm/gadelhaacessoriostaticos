## 8. Importar e exportar — levando os pedidos atuais para o outro sistema

Esta é a seção-guia para **baixar os pedidos do sistema atual e carregá-los no novo**. Há duas rotas: **A) arquivo JSON** (o que os botões já fazem, com correções) e **B) `pg_dump`** (cópia exata). Recomendo A com o export/import v2 da seção 8.6 se o destino terá regras diferentes, ou B se o schema do destino for igual ao atual.

### 8.1 Estado real do que existe

| Item | Situação |
|---|---|
| `ExportJsonPedidosButton` | Existe. Gera o arquivo **no navegador** a partir de `PedidoSistema[]` recebido por prop |
| `ImportJsonPedidosButton` | Existe. Lê o arquivo no navegador e chama `importPedidosFromJson` |
| **Montagem dos botões** | **Nenhum arquivo recebido os renderiza.** O `admin/pedidos/page.tsx` só tem o link "Registrar Pedido" e a `TabelaPedidosSistema`, e a tabela também não os usa |
| Export de produtos | **Não existe** (só o import, `import-products.ts`) |

**Consequência prática:** para baixar os pedidos hoje, primeiro é preciso montar o botão no sistema de origem. Mudança mínima em `src/app/admin/pedidos/page.tsx`:

```tsx
import { ExportJsonPedidosButton } from "./components/export-json-button";
import { ImportJsonPedidosButton } from "./components/import-json-button";

// dentro do <div className="flex items-center gap-3">, antes do <Link>:
<ImportJsonPedidosButton />
<ExportJsonPedidosButton pedidos={pedidosList} />
```

Passe `pedidosList` (todos os pedidos vindos do servidor). Se o botão for colocado dentro da tabela usando `pedidosFiltrados`, o arquivo levará **só o que estiver filtrado** (o filtro padrão da tela é `Devendo`, então pedidos `Entregue` ficariam de fora).

Se os botões existem em outra página que não foi enviada, o raciocínio é o mesmo.

### 8.2 Formato do arquivo atual (v1)

Array JSON, um objeto por pedido:

```json
[
  {
    "codigo": "PED-1234",
    "cliente": "Sd. Fulano",
    "corporacao": "Polícia Militar",
    "unidade": "2º BPM",
    "contato": "(85) 90000-0000",
    "dataPedido": "29/09/2026",
    "horarioRegistrado": "10:00",
    "saldoVolus": 1053.59,
    "saldoPorFora": 0,
    "statusPagamento": "Pago",
    "statusPedido": "Devendo",
    "statusPacote": "Criado",
    "observacao": "",
    "itens": [
      { "produtoId": "…", "nome": "Camisa", "tamanho": "M", "cor": "Preto",
        "quantidade": 2, "precoUnitario": 70, "separado": false, "observacao": "" }
    ]
  }
]
```

Convenções que o destino precisa respeitar: `cliente` (não `clienteNome`), data em `DD/MM/AAAA`, horário em `HH:MM`, valores em **reais como número** (não centavos), enums com os textos exatos (`"Polícia Militar"`, `"Não pago"`, etc.).

### 8.3 O que se perde no round-trip v1

| Campo | Situação |
|---|---|
| `id`, `clienteId`, `createdAt`, `updatedAt` | Não exportados; o destino gera novos |
| `tipoPagamento`, `tipoEntrega` | Não exportados nem importados |
| `itens[].observacao` | **Exportado, mas o import não grava** (perda silenciosa) |
| Vínculo com `clientes` | Recriado por **nome** (sem diferenciar homônimos); demais dados do cliente vêm do primeiro pedido lido |
| `itens[].produtoId` | Só é mantido se o id **ou o nome** existir no catálogo do destino; caso contrário vira `null` (o item continua com `nome`, `tamanho`, `cor` e `precoUnitario`) |
| Ordem original | O export sai na ordem de `createdAt desc`; o import insere nessa ordem, então os `createdAt` novos ficam **invertidos** em relação ao original |

### 8.4 Problemas do import atual (`importPedidosFromJson`)

1. **Limite de corpo das Server Actions:** o Next limita o corpo a **1 MB por padrão**. Um export com muitos pedidos e itens pode estourar e falhar com erro genérico. Solução: enviar em lotes (seção 8.6) e, se preciso, elevar `experimental.serverActions.bodySizeLimit` no `next.config`.
2. **Tempo de execução:** o import faz inserts sequenciais (um cliente, um pedido, um insert de itens por pedido). Em hospedagem serverless, arquivos grandes podem passar do tempo máximo da função.
3. **Sem transação:** se falhar no meio, parte do arquivo já foi gravada e a mensagem é só "Erro ao importar".
4. **Colisão de `codigo` entre sistemas:** os códigos do sistema atual são `PED-` + número aleatório de 4 dígitos. Se o destino **já tiver pedidos**, há chance real de o mesmo código existir; como o campo é `unique`, o import **aborta no meio**. Importar num destino vazio evita o problema; senão, definir política (pular, renomear ou falhar).
5. **Reimportar duplica ou falha:** rodar o mesmo arquivo duas vezes ou falha por `codigo` repetido ou, sem código, cria pedidos duplicados.
6. **Sem validação de valores:** `corporacao`/status fora do enum só falham no banco, no meio do lote. `cliente` vazio é ignorado sem aviso e não entra em nenhuma contagem.
7. **Defaults silenciosos:** `corporacao = "Polícia Penal"`, `tamanho = "M"`, horário `"10:00"`, data inválida vira "hoje".
8. **Sem checagem de admin** e `revalidatePath("/")` sem relação com o módulo.
9. **Tabela não atualiza** depois do import (estado local, seção 5.4).

### 8.5 Passo a passo recomendado (Rota A: JSON)

**No sistema de origem**

1. Montar os botões na página (8.1) e clicar em **Baixar JSON**. Guardar `pedidos-AAAA-MM-DD.json`.
2. Conferir a contagem: o número de objetos no arquivo deve ser igual ao número de linhas de `pedidos` no banco (`select count(*) from pedidos`), e a soma de `saldoVolus` e `saldoPorFora` deve bater.
3. Se o destino precisar do catálogo, exportar os produtos (8.7).

**No sistema de destino**

4. Aplicar o schema e as migrações (seção 2) e conferir que `pedidos`, `clientes` e `itensPedido` estão **vazias**, ou definir a política de duplicidade.
5. Importar o catálogo com `importProductsFromJson` (8.7). Faça isso **antes** dos pedidos, porque o vínculo `produtoId` é feito por id ou por nome no momento do import.
6. Importar o arquivo de pedidos (com o import v2 em lotes, 8.6).
7. Conferir (8.8).

> O vínculo de `produtoId` no destino depende de o **nome do produto ser igual** (sem diferenciar maiúsculas/minúsculas nem espaços nas pontas). Os ids do catálogo do destino serão diferentes dos da origem.

### 8.6 Export e import v2 (sugestão de código)

Objetivo: não perder dados, não estourar limite de corpo, ser **seguro para reexecutar** e reportar o que aconteceu.

**Formato v2:** o mesmo dos itens do v1, mais `tipoPagamento`, `tipoEntrega`, `criadoEm`, `itens[].observacao` gravável, dentro de um envelope. O import v2 aceita **também** o array v1.

```json
{ "versao": 2, "exportadoEm": "2026-09-29T19:00:00.000Z", "total": 120, "pedidos": [ /* como v1 + campos extras */ ] }
```

**Export lendo do banco (server action):**

```ts
"use server";
import { asc } from "drizzle-orm";
import { db } from "@/db";
import { pedidos } from "@/db/schema";

const dataBR = (d: Date) =>
  `${String(d.getUTCDate()).padStart(2, "0")}/${String(d.getUTCMonth() + 1).padStart(2, "0")}/${d.getUTCFullYear()}`;

export async function exportarPedidosCompletoAction() {
  await exigirAdmin();
  const rows = await db.query.pedidos.findMany({
    orderBy: [asc(pedidos.createdAt)],   // ordem cronológica, preserva a sequência ao reimportar
    with: { itens: true },
  });
  return {
    versao: 2,
    exportadoEm: new Date().toISOString(),
    total: rows.length,
    pedidos: rows.map((p) => ({
      codigo: p.codigo,
      cliente: p.clienteNome,
      corporacao: p.corporacao,
      unidade: p.unidade,
      contato: p.contato,
      dataPedido: dataBR(p.dataPedido),
      horarioRegistrado: p.horarioRegistrado,
      saldoVolus: Number(p.saldoVolus),
      saldoPorFora: Number(p.saldoPorFora),
      statusPagamento: p.statusPagamento,
      statusPedido: p.statusPedido,
      statusPacote: p.statusPacote,
      tipoPagamento: p.tipoPagamento,
      tipoEntrega: p.tipoEntrega,
      observacao: p.observacao ?? "",
      criadoEm: p.createdAt.toISOString(),
      itens: p.itens.map((i) => ({
        produtoId: i.produtoId,
        nome: i.nome,
        tamanho: i.tamanho,
        cor: i.cor ?? "",
        quantidade: i.quantidade,
        precoUnitario: Number(i.precoUnitario),
        separado: i.separado,
        observacao: i.observacao ?? "",
      })),
    })),
  };
}
```

O botão de exportar passa a chamar essa action e montar o `Blob` como hoje. Isso exporta **todos** os pedidos, independente de filtro de tela, e não depende de a lista ter sido carregada no cliente.

**Import v2 em lotes (server action + validação):**

```ts
"use server";
import { inArray } from "drizzle-orm";
import { z } from "zod";

const itemSchema = z.object({
  produtoId: z.string().nullish(),
  nome: z.string().min(1),
  tamanho: z.string().default("M"),
  cor: z.string().default(""),
  quantidade: z.number().int().positive(),
  precoUnitario: z.number().min(0),
  separado: z.boolean().default(false),
  observacao: z.string().nullish(),
});

const pedidoSchema = z.object({
  codigo: z.string().min(1),
  cliente: z.string().trim().min(1),
  corporacao: z.enum(["Polícia Militar", "Polícia Penal"]),
  unidade: z.string().default(""),
  contato: z.string().default(""),
  dataPedido: z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/),
  horarioRegistrado: z.string().regex(/^\d{2}:\d{2}$/).default("10:00"),
  saldoVolus: z.number().min(0).default(0),
  saldoPorFora: z.number().min(0).default(0),
  statusPagamento: z.enum(["Pago", "Não pago"]),
  statusPedido: z.enum(["Devendo", "Entregue"]),
  statusPacote: z.enum(["Criado", "Não criado", "Lacrado"]),
  tipoPagamento: z.string().nullish(),
  tipoEntrega: z.string().nullish(),
  observacao: z.string().nullish(),
  criadoEm: z.string().datetime().optional(),
  itens: z.array(itemSchema).default([]),
});

type Duplicados = "pular" | "renomear";

export async function importarPedidosLoteAction(lote: unknown, duplicados: Duplicados = "pular") {
  await exigirAdmin();
  const parsed = z.array(pedidoSchema).max(200).safeParse(lote);
  if (!parsed.success) {
    return { success: false as const, message: "Lote inválido.", erros: parsed.error.issues.slice(0, 20) };
  }
  const itens = parsed.data;

  return db.transaction(async (tx) => {
    const codigos = itens.map((p) => p.codigo);
    const existentes = new Set(
      (await tx.select({ c: pedidos.codigo }).from(pedidos).where(inArray(pedidos.codigo, codigos))).map((r) => r.c),
    );
    // catálogo e clientes carregados uma vez por lote (como hoje), depois: para cada pedido
    //   1) se codigo existe: duplicados === "pular" → contar em "pulados"; "renomear" → novo código pela sequência
    //   2) resolver cliente por nome normalizado (+ contato quando houver)
    //   3) inserir pedido com dataPedido = converterBRparaISO (12:00Z) e createdAt = criadoEm (se vier)
    //   4) inserir itens em lote, com observacao e produtoId resolvido por id ou por nome
    return { success: true as const, importados: 0, pulados: 0, ignorados: [] as string[] };
  });
}
```

O corpo de cada etapa é a lógica que já existe em `importPedidosFromJson`; o que muda é o contexto (transação, validação e política de duplicidade).

**Botão de import em lotes (cliente):**

```tsx
const json = JSON.parse(await file.text());
const lista = Array.isArray(json) ? json : json.pedidos;   // aceita v1 e v2
const TAM = 100;
let importados = 0, pulados = 0;
for (let i = 0; i < lista.length; i += TAM) {
  const r = await importarPedidosLoteAction(lista.slice(i, i + TAM), "pular");
  if (!r.success) { toast.error(`Falha no lote ${i / TAM + 1}: ${r.message}`); break; }
  importados += r.importados; pulados += r.pulados;
}
toast.success(`${importados} importados, ${pulados} já existiam.`);
router.refresh();   // atualiza a tabela (5.4)
```

Cada lote é uma transação; com `duplicados = "pular"`, se algo falhar você **corrige e roda de novo o mesmo arquivo**, e o que já entrou é pulado.

### 8.7 Catálogo de produtos (dependência do import de pedidos)

O arquivo `import-products.ts` (`importProductsFromJson`) recebe:

```ts
interface JsonProductItem {
  codigo?: string; nome: string; descricao?: string;
  preco: number;            // em REAIS (70 = R$ 70,00); o import converte para centavos
  categoria?: string;       // por NOME; cria a categoria se não existir
  tamanhos?: string[]; cores?: string[]; estoque?: number;
  observacao?: string | null;   // ignorado pelo import
  ativo?: boolean;              // false → status "inactive"
}
```

**Como funciona:** ignora itens sem `nome` ou com `preco` não numérico; cria categorias novas (primeira letra maiúscula); gera `codigo` com slug + 5 dígitos aleatórios se não vier; grava `paymentLink: "#"`, `deliveryMode: "email"`, pagamentos padrão e `isStockUnlimited: false`; chama `revalidatePath` em `/admin/produtos` e `/`.

**Limitações relevantes para a migração:**

- **Não tem dedupe:** rodar duas vezes duplica todos os produtos (o `code` aleatório não colide).
- Sem transação, sem validação com Zod e sem checagem de admin.
- Não leva imagens, marca, preço promocional, `downloadUrl`, `sales`, `isStockUnlimited` nem `paymentLink` reais.
- Só uma `categoria` por produto.
- Produto com `ativo: false` **não aparece** no formulário de pedido, que só lista `status = 'active'`.
- Mesma limitação de corpo de 1 MB (envie em lotes se o catálogo for grande).

**Não existe export de produtos.** Sugestão de action para gerar exatamente o formato que o import aceita:

```ts
"use server";
export async function exportarProdutosJsonAction(): Promise<JsonProductItem[]> {
  await exigirAdmin();
  const [prods, cats] = await Promise.all([db.select().from(product), db.select().from(category)]);
  const nomeCat = new Map(cats.map((c) => [c.id, c.name]));
  return prods.map((p) => ({
    codigo: p.code ?? undefined,
    nome: p.name,
    descricao: p.description ?? undefined,
    preco: p.price / 100,
    categoria: p.categories?.[0] ? nomeCat.get(p.categories[0]) : undefined,
    tamanhos: p.tamanhos,
    cores: p.cores,
    estoque: p.stock ?? 0,
    ativo: p.status === "active",
  }));
}
```

Se o destino **já tem** catálogo próprio, pule este passo e apenas garanta que os **nomes** dos produtos coincidam com os do sistema antigo. Itens sem correspondência entram com `produtoId = null` e mantêm nome, tamanho, cor e preço, mas **ficam sem vínculo** com o catálogo do destino.

Para checar antes de importar, liste no arquivo de pedidos os nomes de itens que **não** existem no catálogo do destino:

```sql
-- no destino, após carregar os pedidos:
select distinct i.nome from "itensPedido" i where i."produtoId" is null order by 1;
```

### 8.8 Conferência após importar

| Verificação | Como |
|---|---|
| Quantidade | `count(*)` de `pedidos`, `clientes`, `itensPedido` (origem × destino; clientes podem ser menos, por agrupamento de nomes) |
| Valores | `sum("saldoVolus")`, `sum("saldoPorFora")`, `sum("precoUnitario" * quantidade)` |
| Status | `count(*)` por `statusPedido`, `statusPagamento` e `statusPacote` |
| Datas | 5 pedidos amostrados: dia e horário iguais na tela (sem deslocamento de fuso) |
| Itens | `separado` preservado; itens sem `produtoId` explicados |
| Idempotência | Importar o mesmo arquivo de novo deve resultar em **0 importados** e N pulados |
| Colisões | Nenhum erro de `unique(codigo)` no log |

### 8.9 Rota B: cópia exata com `pg_dump`

Preserva ids, timestamps, `tipoPagamento`, `tipoEntrega` e vínculos entre tabelas. Comandos e ordem de carga estão na seção 2.7. Use quando o schema do destino for idêntico e o destino estiver vazio. Se optar por B, **também é preciso levar `product`** (ou aceitar `produtoId` nulo), porque `itensPedido.produtoId` referencia `product.id`.
