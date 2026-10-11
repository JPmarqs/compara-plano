/**
 * Correspondência por radical simples (determinística, sem IA).
 *
 * Objetivo: aceitar plural/singular e variações do mesmo radical
 * (educação / educacional / educar; escola / escolas / escolar).
 * Regras fixas de sufixo, fáceis de revisar — e documentadas como
 * heurística com falsos positivos/negativos possíveis (ver README).
 */

/** Sufixos em português (texto já normalizado), do mais longo para o mais curto. */
const SUFIXOS: string[] = [
  "acoes", "idades", "amente",
  "acao", "coes", "mente", "ismo", "ista", "ancia", "encia", "idade", "avel", "ivel",
  "ador", "edor", "idor", "ando", "endo", "indo", "ados", "adas", "ores", "anca",
  "ado", "ada", "ais", "eis",
  "ar", "er", "ir", "al", "el", "il", "or",
  "es", "s",
];

/**
 * Gera os candidatos de radical de uma palavra normalizada:
 * a própria palavra e, no máximo, duas remoções de sufixo
 * (o radical resultante precisa ter ao menos 3 letras).
 */
export function radicaliza(palavra: string): string[] {
  const candidatos = [palavra];
  let atual = palavra;
  for (let nivel = 0; nivel < 2; nivel++) {
    const sufixo = SUFIXOS.find((s) => atual.endsWith(s) && atual.length - s.length >= 3);
    if (!sufixo) break;
    atual = atual.slice(0, atual.length - sufixo.length);
    candidatos.push(atual);
  }
  return candidatos;
}

export interface Termo {
  /** Termo como será exibido (pode conter acentos). */
  texto: string;
  /** Candidatos normalizados (palavra + radicais), usados na comparação. */
  candidatos: string[];
}

/** Monta um termo de busca a partir de uma palavra já normalizada. */
export function termoDePalavra(palavraNormalizada: string): Termo {
  return { texto: palavraNormalizada, candidatos: radicaliza(palavraNormalizada) };
}

/** Compatibilidade entre dois candidatos de radical. */
function compativel(a: string, b: string): boolean {
  if (a === b) return true;
  const menor = a.length <= b.length ? a : b;
  const maior = a.length <= b.length ? b : a;
  // Prefixo com radical razoavelmente longo (>= 4): cobre variações do mesmo radical.
  if (menor.length >= 4 && maior.startsWith(menor)) return true;
  // Radical curto (3 letras): só se for quase igual (ex.: "lei" e "leis").
  if (menor.length === 3 && maior.length - menor.length <= 1 && maior.startsWith(menor)) return true;
  return false;
}

/** A palavra (normalizada) corresponde ao termo de busca? */
export function termoCorresponde(palavra: string, termo: Termo): boolean {
  const candidatosDaPalavra = radicaliza(palavra);
  for (const consulta of termo.candidatos) {
    for (const candidato of candidatosDaPalavra) {
      if (compativel(consulta, candidato)) return true;
    }
  }
  return false;
}
