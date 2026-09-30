import "dotenv/config";

import pg from "pg";

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function migrate() {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    console.log("Creating enums...");

    // Create enums (only if they don't exist)
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE "statusPagamento" AS ENUM ('Pago', 'Não pago');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);

    await client.query(`
      DO $$ BEGIN
        CREATE TYPE "statusPedido" AS ENUM ('Devendo', 'Entregue');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);

    await client.query(`
      DO $$ BEGIN
        CREATE TYPE "statusPacote" AS ENUM ('Criado', 'Não criado', 'Lacrado');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);

    await client.query(`
      DO $$ BEGIN
        CREATE TYPE "corporacao" AS ENUM ('Polícia Militar', 'Polícia Penal');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);

    console.log("Creating clientes table...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS "clientes" (
        "id" text PRIMARY KEY NOT NULL,
        "nome" text NOT NULL,
        "corporacao" "corporacao" NOT NULL DEFAULT 'Polícia Militar',
        "unidade" text DEFAULT '',
        "contato" text DEFAULT '',
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now()
      );
    `);

    console.log("Creating pedidos table...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS "pedidos" (
        "id" text PRIMARY KEY NOT NULL,
        "codigo" text NOT NULL UNIQUE,
        "clienteId" text REFERENCES "clientes"("id") ON DELETE SET NULL,
        "clienteNome" text NOT NULL,
        "corporacao" "corporacao" NOT NULL DEFAULT 'Polícia Militar',
        "unidade" text DEFAULT '',
        "contato" text DEFAULT '',
        "dataPedido" date NOT NULL,
        "horarioRegistrado" text NOT NULL DEFAULT '10:00',
        "saldoVolus" numeric(10, 2) NOT NULL DEFAULT 0,
        "saldoPorFora" numeric(10, 2) NOT NULL DEFAULT 0,
        "statusPagamento" "statusPagamento" NOT NULL DEFAULT 'Não pago',
        "statusPedido" "statusPedido" NOT NULL DEFAULT 'Devendo',
        "statusPacote" "statusPacote" NOT NULL DEFAULT 'Não criado',
        "tipoPagamento" text,
        "tipoEntrega" text,
        "observacao" text,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now()
      );
    `);

    console.log("Creating itensPedido table...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS "itensPedido" (
        "id" text PRIMARY KEY NOT NULL,
        "pedidoId" text NOT NULL REFERENCES "pedidos"("id") ON DELETE CASCADE,
        "produtoId" text REFERENCES "product"("id") ON DELETE SET NULL,
        "nome" text NOT NULL,
        "tamanho" text NOT NULL DEFAULT 'M',
        "cor" text DEFAULT '',
        "quantidade" integer NOT NULL DEFAULT 1,
        "precoUnitario" numeric(10, 2) NOT NULL DEFAULT 0,
        "separado" boolean NOT NULL DEFAULT false,
        "observacao" text,
        "createdAt" timestamp NOT NULL DEFAULT now()
      );
    `);

    await client.query("COMMIT");
    console.log("✅ Migration completed successfully!");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Migration failed:", error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
