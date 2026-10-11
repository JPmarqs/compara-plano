/**
 * Temas sugeridos e dicionário configurável de palavras relacionadas.
 *
 * Este arquivo é o único lugar com listas de sinônimos — ele deve ser
 * revisado quanto à neutralidade antes de qualquer publicação.
 * As buscas nunca são enviadas a servidores; o dicionário roda no navegador.
 */
export interface Tema {
  id: string;
  rotulo: string;
  /** Termo que aparece no botão e que ativa o tema. */
  busca: string;
  /** Palavras relacionadas acrescentadas à busca quando o tema é atingido. */
  sinonimos: string[];
}

export const TEMAS: Tema[] = [
  {
    id: "educacao",
    rotulo: "Educação",
    busca: "educação",
    sinonimos: [],
  },
  {
    id: "saude",
    rotulo: "Saúde",
    busca: "saúde",
    sinonimos: ["hospital", "médico", "clínica", "sanitária"],
  },
  {
    id: "seguranca",
    rotulo: "Segurança pública",
    busca: "segurança",
    sinonimos: ["polícia", "policial", "violência"],
  },
  {
    id: "trabalho",
    rotulo: "Trabalho e emprego",
    busca: "trabalho",
    sinonimos: ["emprego", "renda", "salário"],
  },
  {
    id: "mobilidade",
    rotulo: "Mobilidade",
    busca: "mobilidade",
    sinonimos: ["transporte", "ônibus", "trânsito"],
  },
  {
    id: "habitacao",
    rotulo: "Habitação",
    busca: "habitação",
    sinonimos: ["moradia", "moradias"],
  },
];
