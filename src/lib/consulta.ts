import { normalizar } from "./normalize";
import { termoDePalavra, type Termo } from "./match";
import { TEMAS, type Tema } from "../temas";
import { CONFIG } from "../config";

export type { Termo };

export interface Consulta {
  /** Como o usuário digitou (espaços extras removidos), para exibir na tela. */
  original: string;
  /** Termos usados na comparação (uma palavra, ou as palavras da frase). */
  termos: Termo[];
  /** Se a busca é por expressão de 2+ palavras, as palavras precisam ser vizinhas. */
  frase: Termo[] | null;
  /** Palavras do tema acrescentadas à busca (para transparência na tela). */
  relacionados: string[];
  /** Rótulo do tema atingido, se houver. */
  tema: string | null;
}

/** A consulta atende ao mínimo de caracteres? */
export function consultaValida(entrada: string): boolean {
  return entrada.trim().length >= CONFIG.caracteresMinimos;
}

/**
 * Monta a consulta a partir do texto digitado.
 * - 2+ palavras: busca por expressão completa (sem acrescentar palavras do tema).
 * - 1 palavra: se atingir um tema configurado, inclui as palavras relacionadas.
 */
export function montarConsulta(entrada: string, temas: Tema[] = TEMAS): Consulta {
  const original = entrada.trim().replace(/\s+/g, " ");
  const palavras = normalizar(original).split(" ").filter((p) => p.length > 0);

  if (palavras.length >= 2) {
    const frase = palavras.map(termoDePalavra);
    return { original, termos: frase, frase, relacionados: [], tema: null };
  }

  const base = palavras[0] ?? "";
  const termos: Termo[] = [termoDePalavra(base)];
  const relacionados: string[] = [];
  let tema: string | null = null;

  for (const t of temas) {
    const doTema = [t.busca, ...t.sinonimos].filter((x) => x.trim().length > 0);
    if (doTema.some((x) => normalizar(x) === base)) {
      tema = t.rotulo;
      for (const x of doTema) {
        const normalizado = normalizar(x);
        if (normalizado !== base && !relacionados.some((r) => normalizar(r) === normalizado)) {
          relacionados.push(x);
          termos.push(termoDePalavra(normalizado));
        }
      }
      break;
    }
  }

  return { original, termos, frase: null, relacionados, tema };
}
