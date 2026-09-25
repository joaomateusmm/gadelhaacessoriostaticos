import { relations } from "drizzle-orm";
import {
  boolean,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

// Enums do Sistema de Pedidos de Agentes
export const corporacaoEnum = pgEnum("corporacao", [
  "Polícia Militar",
  "Polícia Penal",
]);
export const statusPagamentoEnum = pgEnum("status_pagamento", [
  "Pago",
  "Não pago",
]);
export const statusPedidoEnum = pgEnum("status_pedido", [
  "Devendo",
  "Entregue",
]);
export const statusPacoteEnum = pgEnum("status_pacote", [
  "Criado",
  "Não criado",
  "Lacrado",
]);

// --- TABELAS DE AUTENTICAÇÃO (BETTER AUTH) ---

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified").notNull(),
  image: text("image"),
  createdAt: timestamp("createdAt").notNull(),
  updatedAt: timestamp("updatedAt").notNull(),
  role: text("role").notNull().default("user"),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expiresAt").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("createdAt").notNull(),
  updatedAt: timestamp("updatedAt").notNull(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  userId: text("userId")
    .notNull()
    .references(() => user.id),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  userId: text("userId")
    .notNull()
    .references(() => user.id),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  accessTokenExpiresAt: timestamp("accessTokenExpiresAt"),
  refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("createdAt").notNull(),
  updatedAt: timestamp("updatedAt").notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt"),
  updatedAt: timestamp("updatedAt"),
});

// --- TABELA DE CATEGORIAS ---

export const category = pgTable("category", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// --- TABELA DE MARCAS ---

export const brand = pgTable("brand", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  image: text("image"), // Opcional
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// --- TABELAS DA LOJA ---

export const product = pgTable("product", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  code: text("code"),
  description: text("description"),
  price: integer("price").notNull(),
  discountPrice: integer("discountPrice"),
  downloadUrl: text("downloadUrl"),
  images: text("images").array(),
  categories: text("categories").array(),
  tamanhos: jsonb("tamanhos").$type<string[]>().default([]).notNull(),
  cores: jsonb("cores").$type<string[]>().default([]).notNull(),
  brandId: text("brandId").references(() => brand.id, { onDelete: "set null" }),
  paymentLink: text("paymentLink").notNull(),
  deliveryMode: text("deliveryMode").notNull().default("email"),
  paymentMethods: text("paymentMethods")
    .array()
    .notNull()
    .default(["Pix", "Cartão de Crédito", "Cartão de Débito", "Boleto"]),
  stock: integer("stock").default(0),
  isStockUnlimited: boolean("isStockUnlimited").notNull().default(false),
  status: text("status").notNull().default("draft"),
  sales: integer("sales").notNull().default(0),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const review = pgTable("review", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),

  rating: integer("rating").notNull(),
  comment: text("comment"),

  productId: text("productId")
    .notNull()
    .references(() => product.id, { onDelete: "cascade" }),

  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),

  createdAt: timestamp("createdAt").notNull().defaultNow(),
});

// --- NOVAS TABELAS DE PEDIDOS (INTEGRAÇÃO INFINITEPAY) ---

export const order = pgTable("order", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull(),
  status: text("status").notNull().default("pending"),
  infinitePayUrl: text("infinitePayUrl"),
  transactionId: text("transactionId"),
  metadata: text("metadata"),
  couponId: text("couponId").references(() => coupon.id, {
    onDelete: "set null",
  }),
  discountAmount: integer("discountAmount").default(0), // Quanto foi descontado em centavos
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const orderItem = pgTable("orderItem", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),

  orderId: text("orderId")
    .notNull()
    .references(() => order.id, { onDelete: "cascade" }),

  productId: text("productId")
    .notNull()
    .references(() => product.id),

  productName: text("productName").notNull(),
  price: integer("price").notNull(),
  quantity: integer("quantity").notNull(),
  image: text("image"),
});

export const coupon = pgTable("coupon", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  code: text("code").notNull().unique(), // O código que o cliente digita (ex: "BEMVINDO10")
  type: text("type").notNull().default("percent"), // 'percent' (porcentagem) ou 'fixed' (valor em centavos)
  value: integer("value").notNull(), // O valor do desconto (ex: 10 para 10% ou 500 para R$ 5,00)
  minValue: integer("minValue").default(0), // Valor mínimo do pedido para usar o cupom (em centavos)
  maxUses: integer("maxUses"), // Limite global de usos (ex: apenas para os primeiros 100)
  usedCount: integer("usedCount").default(0).notNull(), // Contador de quantas vezes já foi usado
  expiresAt: timestamp("expiresAt"), // Data de validade (opcional)
  isActive: boolean("isActive").default(true).notNull(), // Se o cupom está ativo ou não
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  isFeatured: boolean("isFeatured").default(false).notNull(),
  popupTitle: text("popupTitle"),
  popupDescription: text("popupDescription"),
  updatedAt: timestamp("updatedAt")
    .notNull()
    .defaultNow()
});

// --- SISTEMA DE PEDIDOS DE AGENTES/CLIENTES (BALCÃO) ---

export const clientes = pgTable("clientes", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  nome: text("nome").notNull(),
  corporacao: corporacaoEnum("corporacao").notNull(),
  unidade: text("unidade").notNull(),
  contato: text("contato").notNull(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const pedidos = pgTable("pedidos", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  codigo: text("codigo").notNull().unique(),
  clienteId: text("clienteId").references(() => clientes.id, {
    onDelete: "set null",
  }),
  clienteNome: text("clienteNome").notNull(),
  corporacao: corporacaoEnum("corporacao").notNull(),
  unidade: text("unidade").notNull(),
  contato: text("contato").notNull(),
  dataPedido: timestamp("dataPedido").notNull().defaultNow(),
  horarioRegistrado: text("horarioRegistrado").notNull(),
  saldoVolus: numeric("saldoVolus", { precision: 10, scale: 2 })
    .default("0")
    .notNull(),
  saldoPorFora: numeric("saldoPorFora", { precision: 10, scale: 2 })
    .default("0")
    .notNull(),
  statusPagamento: statusPagamentoEnum("statusPagamento")
    .default("Não pago")
    .notNull(),
  statusPedido: statusPedidoEnum("statusPedido")
    .default("Devendo")
    .notNull(),
  statusPacote: statusPacoteEnum("statusPacote")
    .default("Não criado")
    .notNull(),
  tipoPagamento: text("tipoPagamento").default("pix"),
  tipoEntrega: text("tipoEntrega").default("retirada_loja"),
  observacao: text("observacao"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const itensPedido = pgTable("itensPedido", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  pedidoId: text("pedidoId")
    .notNull()
    .references(() => pedidos.id, { onDelete: "cascade" }),
  produtoId: text("produtoId").references(() => product.id, {
    onDelete: "set null",
  }),
  nome: text("nome").notNull(),
  tamanho: text("tamanho").notNull(),
  cor: text("cor"),
  quantidade: integer("quantidade").default(1).notNull(),
  precoUnitario: numeric("precoUnitario", { precision: 10, scale: 2 })
    .default("0")
    .notNull(),
  separado: boolean("separado").default(false).notNull(),
  observacao: text("observacao"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});

export const clientesRelations = relations(clientes, ({ many }) => ({
  pedidos: many(pedidos),
}));

export const pedidosRelations = relations(pedidos, ({ one, many }) => ({
  cliente: one(clientes, {
    fields: [pedidos.clienteId],
    references: [clientes.id],
  }),
  itens: many(itensPedido),
}));

export const itensPedidoRelations = relations(itensPedido, ({ one }) => ({
  pedido: one(pedidos, {
    fields: [itensPedido.pedidoId],
    references: [pedidos.id],
  }),
  produto: one(product, {
    fields: [itensPedido.produtoId],
    references: [product.id],
  }),
}));

