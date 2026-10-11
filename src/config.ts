/** Configurações do produto (ajustáveis, sem mexer no código de busca). */
export const CONFIG = {
  /**
   * Ordem de exibição dos candidatos:
   * - "aleatoria": sorteada a cada busca (padrão);
   * - "alfabetica": fixa, por nome do candidato.
   * Nunca existe ranking — as duas opções são neutras.
   */
  ordemExibicao: "aleatoria" as "aleatoria" | "alfabetica",
  /** Tamanho mínimo do termo digitado, em caracteres. */
  caracteresMinimos: 3,
  /** Quantos caracteres de contexto antes/depois de cada trecho. */
  contextoTrecho: 70,
  /** Limite de trechos exibidos por página (a contagem total continua completa). */
  maxTrechosPorPagina: 5,
};
