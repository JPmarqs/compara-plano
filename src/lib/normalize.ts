/**
 * Normalização de texto usada APENAS para comparação.
 * O texto exibido ao usuário é sempre o original, com acentos e caixa.
 *
 * A normalização é feita caractere a caractere para manter um mapa de índices
 * (posição no texto normalizado -> posição no texto original),permitindo
 * destacar trechos no texto original sem perder a correspondência.
 */

/** Remove acentos e converte um caractere para minúscula, sem mudar o "tamanho". */
function minusculaSemAcento(caractere: string): string {
  const semAcento = caractere
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  if (semAcento.length === 0) return caractere;
  return semAcento[0];
}

/** Normaliza uma string inteira (só para comparação). */
export function normalizar(texto: string): string {
  let saida = "";
  for (let i = 0; i < texto.length; i++) {
    saida += minusculaSemAcento(texto[i]);
  }
  return saida;
}

export interface TextoNormalizado {
  /** Texto sem acentos e em minúsculas. */
  texto: string;
  /** mapa[i] = índice, no texto original, do caractere i do texto normalizado. */
  mapa: number[];
}

/** Normaliza mantendo o mapa de índices para o texto original. */
export function normalizarComMapa(original: string): TextoNormalizado {
  const partes: string[] = [];
  const mapa: number[] = [];
  for (let i = 0; i < original.length; i++) {
    partes.push(minusculaSemAcento(original[i]));
    mapa.push(i);
  }
  return { texto: partes.join(""), mapa };
}
