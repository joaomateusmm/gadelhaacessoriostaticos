export const SALDO_VOLUS_PP = 1003.39;
export const SALDO_VOLUS_PM = 1053.59;

export const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function totalPedido(p: {
  itens: { precoUnitario: number; quantidade: number }[];
}) {
  return p.itens.reduce(
    (s: number, i: { precoUnitario: number; quantidade: number }) =>
      s + i.precoUnitario * i.quantidade,
    0,
  );
}

export function formatarData(iso: string) {
  if (!iso) return "";
  if (iso.includes("/")) return iso;
  const partes = iso.split("-");
  if (partes.length < 3) return iso;
  const [a, m, d] = partes;
  return `${d.slice(0, 2)}/${m}/${a}`;
}

export function getDataAtualBR() {
  const agora = new Date();
  const dia = String(agora.getDate()).padStart(2, "0");
  const mes = String(agora.getMonth() + 1).padStart(2, "0");
  const ano = agora.getFullYear();
  return `${dia}/${mes}/${ano}`;
}

export function getDataAtualISO() {
  const agora = new Date();
  const ano = agora.getFullYear();
  const mes = String(agora.getMonth() + 1).padStart(2, "0");
  const dia = String(agora.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

export function converterBRparaISO(dataBR: string) {
  if (!dataBR) return getDataAtualISO();
  if (dataBR.includes("-")) return dataBR;
  const partes = dataBR.split("/");
  if (partes.length < 3) return dataBR;
  const [d, m, a] = partes;
  return `${a}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
}

export function getHorarioAtualString() {
  const agora = new Date();
  const horas = String(agora.getHours()).padStart(2, "0");
  const minutos = String(agora.getMinutes()).padStart(2, "0");
  return `${horas}:${minutos}`;
}
