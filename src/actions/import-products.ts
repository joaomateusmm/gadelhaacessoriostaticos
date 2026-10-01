"use server";

import { db } from "@/db"; // Ajuste este import para o caminho correto do seu DB
import { product } from "@/db/schema"; // Ajuste este import para o arquivo do seu schema

// Documentação: Função responsável por processar e inserir múltiplos produtos no banco
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function importProductsAction(jsonData: any[]) {
  try {
    // 1. Mapeia os dados do JSON para a estrutura exigida pelo banco de dados
    const formattedProducts = jsonData.map((item) => ({
      code: item.codigo,
      name: item.nome,
      description: item.descricao,
      price: item.preco * 100, // Multiplica por 100 para guardar em centavos
      stock: item.estoque,
      tamanhos: item.tamanhos,
      cores: item.cores,
      status: item.ativo ? "active" : "draft",
      categories: [item.categoria],
      currency: "BRL", // Define a moeda local
      paymentLink: "", // Campo obrigatório no schema, enviamos vazio inicialmente
      deliveryMode: "email", // Valor padrão do schema
      paymentMethods: [
        "Pix",
        "Cartão de Crédito",
        "Cartão de Débito",
        "Boleto",
      ],
    }));

    // 2. Insere todos os produtos de uma só vez na tabela usando Drizzle
    await db.insert(product).values(formattedProducts);

    return { success: true, message: "Produtos importados com sucesso!" };
  } catch (error) {
    console.error("Erro ao importar produtos:", error);
    return {
      success: false,
      message: "Erro ao importar produtos no banco de dados.",
    };
  }
}
