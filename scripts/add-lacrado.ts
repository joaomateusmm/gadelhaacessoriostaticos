import { db } from "../src/db/index";

async function main() {
  await db.execute(
    `ALTER TYPE status_pacote ADD VALUE IF NOT EXISTS 'Lacrado'`,
  );
  console.log("✓ Valor 'Lacrado' adicionado ao enum status_pacote");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
