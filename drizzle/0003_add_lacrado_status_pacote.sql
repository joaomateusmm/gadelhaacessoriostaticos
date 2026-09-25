CREATE TYPE "public"."corporacao" AS ENUM('Polícia Militar', 'Polícia Penal');--> statement-breakpoint
CREATE TYPE "public"."status_pacote" AS ENUM('Criado', 'Não criado', 'Lacrado');--> statement-breakpoint
CREATE TYPE "public"."status_pagamento" AS ENUM('Pago', 'Não pago');--> statement-breakpoint
CREATE TYPE "public"."status_pedido" AS ENUM('Devendo', 'Entregue');--> statement-breakpoint
CREATE TABLE "brand" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"image" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "category" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clientes" (
	"id" text PRIMARY KEY NOT NULL,
	"nome" text NOT NULL,
	"corporacao" "corporacao" NOT NULL,
	"unidade" text NOT NULL,
	"contato" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coupon" (
	"id" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"type" text DEFAULT 'percent' NOT NULL,
	"value" integer NOT NULL,
	"minValue" integer DEFAULT 0,
	"maxUses" integer,
	"usedCount" integer DEFAULT 0 NOT NULL,
	"expiresAt" timestamp,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"isFeatured" boolean DEFAULT false NOT NULL,
	"popupTitle" text,
	"popupDescription" text,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "coupon_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "itensPedido" (
	"id" text PRIMARY KEY NOT NULL,
	"pedidoId" text NOT NULL,
	"produtoId" text,
	"nome" text NOT NULL,
	"tamanho" text NOT NULL,
	"cor" text,
	"quantidade" integer DEFAULT 1 NOT NULL,
	"precoUnitario" numeric(10, 2) DEFAULT '0' NOT NULL,
	"separado" boolean DEFAULT false NOT NULL,
	"observacao" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"amount" integer NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"infinitePayUrl" text,
	"transactionId" text,
	"metadata" text,
	"couponId" text,
	"discountAmount" integer DEFAULT 0,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orderItem" (
	"id" text PRIMARY KEY NOT NULL,
	"orderId" text NOT NULL,
	"productId" text NOT NULL,
	"productName" text NOT NULL,
	"price" integer NOT NULL,
	"quantity" integer NOT NULL,
	"image" text
);
--> statement-breakpoint
CREATE TABLE "pedidos" (
	"id" text PRIMARY KEY NOT NULL,
	"codigo" text NOT NULL,
	"clienteId" text,
	"clienteNome" text NOT NULL,
	"corporacao" "corporacao" NOT NULL,
	"unidade" text NOT NULL,
	"contato" text NOT NULL,
	"dataPedido" timestamp DEFAULT now() NOT NULL,
	"horarioRegistrado" text NOT NULL,
	"saldoVolus" numeric(10, 2) DEFAULT '0' NOT NULL,
	"saldoPorFora" numeric(10, 2) DEFAULT '0' NOT NULL,
	"statusPagamento" "status_pagamento" DEFAULT 'Não pago' NOT NULL,
	"statusPedido" "status_pedido" DEFAULT 'Devendo' NOT NULL,
	"statusPacote" "status_pacote" DEFAULT 'Não criado' NOT NULL,
	"tipoPagamento" text DEFAULT 'pix',
	"tipoEntrega" text DEFAULT 'retirada_loja',
	"observacao" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "pedidos_codigo_unique" UNIQUE("codigo")
);
--> statement-breakpoint
CREATE TABLE "product" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"code" text,
	"description" text,
	"price" integer NOT NULL,
	"discountPrice" integer,
	"downloadUrl" text,
	"images" text[],
	"categories" text[],
	"tamanhos" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"cores" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"brandId" text,
	"paymentLink" text NOT NULL,
	"deliveryMode" text DEFAULT 'email' NOT NULL,
	"paymentMethods" text[] DEFAULT '{"Pix","Cartão de Crédito","Cartão de Débito","Boleto"}' NOT NULL,
	"stock" integer DEFAULT 0,
	"isStockUnlimited" boolean DEFAULT false NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"sales" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "review" (
	"id" text PRIMARY KEY NOT NULL,
	"rating" integer NOT NULL,
	"comment" text,
	"productId" text NOT NULL,
	"userId" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "itensPedido" ADD CONSTRAINT "itensPedido_pedidoId_pedidos_id_fk" FOREIGN KEY ("pedidoId") REFERENCES "public"."pedidos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "itensPedido" ADD CONSTRAINT "itensPedido_produtoId_product_id_fk" FOREIGN KEY ("produtoId") REFERENCES "public"."product"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order" ADD CONSTRAINT "order_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order" ADD CONSTRAINT "order_couponId_coupon_id_fk" FOREIGN KEY ("couponId") REFERENCES "public"."coupon"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orderItem" ADD CONSTRAINT "orderItem_orderId_order_id_fk" FOREIGN KEY ("orderId") REFERENCES "public"."order"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orderItem" ADD CONSTRAINT "orderItem_productId_product_id_fk" FOREIGN KEY ("productId") REFERENCES "public"."product"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_clienteId_clientes_id_fk" FOREIGN KEY ("clienteId") REFERENCES "public"."clientes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product" ADD CONSTRAINT "product_brandId_brand_id_fk" FOREIGN KEY ("brandId") REFERENCES "public"."brand"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review" ADD CONSTRAINT "review_productId_product_id_fk" FOREIGN KEY ("productId") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review" ADD CONSTRAINT "review_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;