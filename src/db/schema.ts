import { relations } from "drizzle-orm";
import {
  boolean,
  date,
  integer,
  json,
  jsonb, // Adicionado para suportar tamanhos e cores
  numeric,
  pgEnum,
  pgTable,
  real,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

// --- TABELAS DE AUTENTICAÇÃO (MANTIDAS) ---

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified").notNull(),
  image: text("image"),
  createdAt: timestamp("createdAt").notNull(),
  updatedAt: timestamp("updatedAt").notNull(),
  role: text("role").notNull().default("user"),
  isAffiliate: boolean("isAffiliate").notNull().default(false),
  phoneNumber: text("phoneNumber"),
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

// --- TABELA DE CATEGORIAS (MANTIDA) ---

export const category = pgTable("category", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  description: text("description"),
  slug: text("slug").unique(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// --- TABELA DE MARCAS (ADICIONADA DO BANCO Y PARA REFERÊNCIA) ---
export const brand = pgTable("brand", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  image: text("image"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow().$onUpdate(() => new Date()),
});

// --- TABELA DE PRODUTOS (ATUALIZADA E MESCLADA) ---

export const product = pgTable("product", {
  // Campos originais do banco X mantidos integralmente
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  description: text("description"),
  price: integer("price").notNull(), // Em centavos
  discountPrice: integer("discountPrice"), // Em centavos
  currency: text("currency").notNull().default("BRL"),
  images: text("images").array(),
  categories: text("categories").array(),
  weight: real("weight").default(0),
  width: integer("width").default(0),
  height: integer("height").default(0),
  length: integer("length").default(0),
  sku: text("sku"),
  shippingType: text("shippingType").notNull().default("calculated"),
  fixedShippingPrice: integer("fixedShippingPrice").default(0),
  stock: integer("stock").default(0),
  isStockUnlimited: boolean("isStockUnlimited").notNull().default(false),
  status: text("status").notNull().default("draft"),
  sales: integer("sales").notNull().default(0),
  affiliateRate: integer("affiliateRate").default(10),

  // Informações úteis originais do banco X
  condition: text("condition").default("new"), // 'new', 'used', 'refurbished', etc.
  isAssembled: boolean("isAssembled").default(false), // true = sim, false = não
  hasWarranty: boolean("hasWarranty").default(false),
  warrantyDetails: text("warrantyDetails"), // ex: "12 meses"
  brand: text("brand"), // Texto livre mantido por compatibilidade com X

  // --- NOVOS CAMPOS: ADICIONADOS DO BANCO Y ---
  code: text("code"),
  downloadUrl: text("downloadUrl"),
  tamanhos: jsonb("tamanhos").$type<string[]>().default([]).notNull(),
  cores: jsonb("cores").$type<string[]>().default([]).notNull(),
  brandId: text("brandId").references(() => brand.id, { onDelete: "set null" }), // Relação com a tabela brand
  paymentLink: text("paymentLink"), // <-- AGORA OPCIONAL (antes era notNull)
  deliveryMode: text("deliveryMode").notNull().default("email"),
  paymentMethods: text("paymentMethods")
    .array()
    .notNull()
    .default(["Pix", "Cartão de Crédito", "Cartão de Débito", "Boleto"]),

  // Timestamps mantidos
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// --- TABELA DE REVIEWS (MANTIDA) ---

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

export const reviewRelations = relations(review, ({ one }) => ({
  product: one(product, {
    fields: [review.productId],
    references: [product.id],
  }),
  user: one(user, {
    fields: [review.userId],
    references: [user.id],
  }),
}));

// --- RELAÇÕES DE MARCA ---
export const brandRelations = relations(brand, ({ many }) => ({
  products: many(product),
}));

export const productRelations = relations(product, ({ one, many }) => ({
  brandRef: one(brand, {
    fields: [product.brandId],
    references: [brand.id],
  }),
  reviews: many(review),
}));

// --- TABELA DE PEDIDOS (MANTIDA) ---

export const order = pgTable("order", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull(),
  status: text("status").notNull().default("pending"),
  currency: text("currency").notNull().default("GBP"),
  fulfillmentStatus: text("fulfillmentStatus").notNull().default("idle"),
  stripePaymentIntentId: text("stripePaymentIntentId"),
  stripeClientSecret: text("stripeClientSecret"),
  shippingAddress: json("shippingAddress"),
  shippingCost: integer("shippingCost").default(0),
  trackingCode: text("trackingCode"),
  estimatedDeliveryStart: timestamp("estimatedDeliveryStart"),
  estimatedDeliveryEnd: timestamp("estimatedDeliveryEnd"),
  paymentMethod: text("paymentMethod").default("card"),
  customerName: text("customerName"),
  customerEmail: text("customerEmail"),
  userPhone: text("userPhone"),
  couponId: text("couponId").references(() => coupon.id, {
    onDelete: "set null",
  }),
  discountAmount: integer("discountAmount").default(0),
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

// --- SISTEMA DE AFILIADOS E CUPONS (MANTIDO) ---

export const affiliate = pgTable("affiliate", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("userId")
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: "cascade" }),
  code: text("code").notNull().unique(),
  pixKey: text("pixKey"),
  pixKeyType: text("pixKeyType"),
  balance: integer("balance").notNull().default(0),
  totalEarnings: integer("totalEarnings").notNull().default(0),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const coupon = pgTable("coupon", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  code: text("code").notNull().unique(),
  type: text("type").notNull().default("percent"),
  value: integer("value").notNull(),
  minValue: integer("minValue").default(0),
  maxUses: integer("maxUses"),
  usedCount: integer("usedCount").default(0).notNull(),
  expiresAt: timestamp("expiresAt"),
  isActive: boolean("isActive").default(true).notNull(),
  isFeatured: boolean("isFeatured").default(false).notNull(),
  popupTitle: text("popupTitle"),
  popupDescription: text("popupDescription"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const commission = pgTable("commission", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  affiliateId: text("affiliateId")
    .notNull()
    .references(() => affiliate.id, { onDelete: "cascade" }),
  orderId: text("orderId")
    .notNull()
    .references(() => order.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull(),
  description: text("description"),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// --- RELAÇÕES (MANTIDAS) ---

export const userRelations = relations(user, ({ one }) => ({
  affiliateProfile: one(affiliate, {
    fields: [user.id],
    references: [affiliate.userId],
  }),
}));

export const affiliateRelations = relations(affiliate, ({ one, many }) => ({
  user: one(user, {
    fields: [affiliate.userId],
    references: [user.id],
  }),
  commissions: many(commission),
}));

export const commissionRelations = relations(commission, ({ one }) => ({
  affiliate: one(affiliate, {
    fields: [commission.affiliateId],
    references: [affiliate.id],
  }),
  order: one(order, {
    fields: [commission.orderId],
    references: [order.id],
  }),
}));

export const orderRelations = relations(order, ({ one, many }) => ({
  user: one(user, {
    fields: [order.userId],
    references: [user.id],
  }),
  items: many(orderItem),
  commission: one(commission),
}));

export const orderItemRelations = relations(orderItem, ({ one }) => ({
  order: one(order, {
    fields: [orderItem.orderId],
    references: [order.id],
  }),
  product: one(product, {
    fields: [orderItem.productId],
    references: [product.id],
  }),
}));

export const providerStatusEnum = pgEnum("provider_status", [
  "pending",
  "approved",
  "rejected",
  "suspended",
]);

export const serviceOrderStatusEnum = pgEnum("service_order_status", [
  "pending", // Cliente solicitou
  "accepted", // Prestador aceitou
  "in_progress", // Em andamento
  "completed", // Finalizado
  "cancelled", // Cancelado
]);

// --- 1. TABELA DE CATEGORIAS DE SERVIÇO (Criada pelo Admin) ---
export const serviceCategory = pgTable("serviceCategory", {
  id: text("id").primaryKey(),
  name: text("name").notNull(), // Nome do serviço
  slug: text("slug").unique().notNull(), // Para a URL (ex: /servicos/encanador)
  description: text("description"), // Descrição geral do que esse profissional faz
  image: text("image"), // Ícone ou foto representativa
  isActive: boolean("isActive").default(true).notNull(), // Se o serviço está sendo ofertado no momento
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

// --- 2. TABELA DE PRESTADORES DE SERVIÇO ---
export const serviceProvider = pgTable("serviceProvider", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  categoryId: text("categoryId")
    .notNull()
    .references(() => serviceCategory.id),
  bio: text("bio").notNull(),
  experienceYears: integer("experienceYears").notNull().default(0),
  portfolioUrl: text("portfolioUrl"),
  servicePrice: integer("servicePrice").notNull(),
  phone: text("phone"),
  location: text("location"),
  detailedAddress: text("detailedAddress"),
  educationLevel: text("educationLevel"),
  howDidYouHear: text("howDidYouHear"),
  referralName: text("referralName"),
  localContacts: text("localContacts"),
  documentUrlFront: text("documentUrlFront"),
  documentUrlBack: text("documentUrlBack"),
  status: text("status").default("pending").notNull(), // pending, approved, rejected
  rejectionReason: text("rejectionReason"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

// --- 3. TABELA DE PEDIDOS DE SERVIÇO (O Cliente contratando) ---
export const serviceOrder = pgTable("serviceOrder", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  customerId: text("customerId")
    .notNull()
    .references(() => user.id),
  providerId: text("providerId")
    .notNull()
    .references(() => serviceProvider.id),
  categoryId: text("categoryId")
    .notNull()
    .references(() => serviceCategory.id), // Para sabermos qual serviço exato foi comprado
  description: text("description").notNull(),
  scheduledDate: timestamp("scheduledDate"),
  address: text("address").notNull(),
  contactPhone: text("contactPhone").notNull(),
  amount: integer("amount").notNull(), // Valor cobrado no momento do checkout (em centavos)
  stripePaymentIntentId: text("stripePaymentIntentId").unique(), // ID da transação na Stripe
  paymentStatus: text("paymentStatus").default("pending").notNull(), // pending, succeeded, failed, refunded
  status: text("status").default("pending").notNull(), // pending, accepted, in_progress, completed, canceled
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  completionSummary: text("completionSummary"), // Resumo opcional preenchido pelo prestador
  completionPhotoUrl: text("completionPhotoUrl"),
  rejectionReason: text("rejectionReason"),
});

// --- RELATIONS (Para facilitar as queries no Drizzle) ---

export const serviceCategoryRelations = relations(
  serviceCategory,
  ({ many }) => ({
    providers: many(serviceProvider),
  }),
);

export const serviceProviderRelations = relations(
  serviceProvider,
  ({ one, many }) => ({
    user: one(user, {
      fields: [serviceProvider.userId],
      references: [user.id],
    }),
    category: one(serviceCategory, {
      fields: [serviceProvider.categoryId],
      references: [serviceCategory.id],
    }),
    orders: many(serviceOrder),
  }),
);

export const serviceOrderRelations = relations(serviceOrder, ({ one }) => ({
  customer: one(user, {
    fields: [serviceOrder.customerId],
    references: [user.id],
  }),
  provider: one(serviceProvider, {
    fields: [serviceOrder.providerId],
    references: [serviceProvider.id],
  }),
  category: one(serviceCategory, {
    fields: [serviceOrder.categoryId],
    references: [serviceCategory.id],
  }),
}));

// --- SISTEMA DE PEDIDOS DE BALCÃO ---

export const statusPagamentoEnum = pgEnum("statusPagamento", [
  "Pago",
  "Não pago",
]);

export const statusPedidoEnum = pgEnum("statusPedido", ["Devendo", "Entregue"]);

export const statusPacoteEnum = pgEnum("statusPacote", [
  "Criado",
  "Não criado",
  "Lacrado",
]);

export const corporacaoEnum = pgEnum("corporacao", [
  "Polícia Militar",
  "Polícia Penal",
]);

export const clientes = pgTable("clientes", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  nome: text("nome").notNull(),
  corporacao: corporacaoEnum("corporacao").notNull().default("Polícia Militar"),
  unidade: text("unidade").default(""),
  contato: text("contato").default(""),
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
  corporacao: corporacaoEnum("corporacao").notNull().default("Polícia Militar"),
  unidade: text("unidade").default(""),
  contato: text("contato").default(""),
  dataPedido: date("dataPedido").notNull(),
  horarioRegistrado: text("horarioRegistrado").notNull().default("10:00"),
  saldoVolus: numeric("saldoVolus", { precision: 10, scale: 2 })
    .notNull()
    .default("0"),
  saldoPorFora: numeric("saldoPorFora", { precision: 10, scale: 2 })
    .notNull()
    .default("0"),
  statusPagamento: statusPagamentoEnum("statusPagamento")
    .notNull()
    .default("Não pago"),
  statusPedido: statusPedidoEnum("statusPedido").notNull().default("Devendo"),
  statusPacote: statusPacoteEnum("statusPacote")
    .notNull()
    .default("Não criado"),
  tipoPagamento: text("tipoPagamento"),
  tipoEntrega: text("tipoEntrega"),
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
  tamanho: text("tamanho").notNull().default("M"),
  cor: text("cor").default(""),
  quantidade: integer("quantidade").notNull().default(1),
  precoUnitario: numeric("precoUnitario", { precision: 10, scale: 2 })
    .notNull()
    .default("0"),
  separado: boolean("separado").notNull().default(false),
  observacao: text("observacao"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});

// --- RELAÇÕES PEDIDOS DE BALCÃO ---

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
