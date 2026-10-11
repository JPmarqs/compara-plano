/**
 * Preferências de leitura: tamanho da letra e alto contraste.
 * Ficam APENAS no aparelho do usuário (localStorage), sem rastreamento.
 */

export interface Preferencias {
  /** Multiplicador do tamanho base da letra (1 = 18px). */
  escala: number;
  altoContraste: boolean;
}

const CHAVE = "compara-plano:preferencias";
const ESCALAS = [1, 1.125, 1.25, 1.5];
const PADRAO: Preferencias = { escala: 1, altoContraste: false };

export function carregarPreferencias(): Preferencias {
  try {
    const bruto = localStorage.getItem(CHAVE);
    if (!bruto) return { ...PADRAO };
    const dados = JSON.parse(bruto) as Partial<Preferencias>;
    const escala = ESCALAS.includes(dados.escala as number) ? (dados.escala as number) : PADRAO.escala;
    return { escala, altoContraste: dados.altoContraste === true };
  } catch {
    return { ...PADRAO };
  }
}

export function salvarPreferencias(prefs: Preferencias): void {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(prefs));
  } catch {
    // Sem armazenamento disponível: segue com as preferências em memória.
  }
}

/** Aplica as preferências no documento e sincroniza os controles. */
export function aplicarPreferencias(prefs: Preferencias): void {
  document.documentElement.style.setProperty("--escala", String(prefs.escala));
  document.documentElement.classList.toggle("alto-contraste", prefs.altoContraste);
  const botao = document.querySelector<HTMLButtonElement>("#btn-alto-contraste");
  if (botao) botao.setAttribute("aria-pressed", String(prefs.altoContraste));
}

/** Ajusta o passo de tamanho da letra (para cima = 1, para baixo = -1). */
export function mudarEscala(prefs: Preferencias, direcao: 1 | -1): Preferencias {
  const atual = ESCALAS.indexOf(prefs.escala);
  const novo = Math.min(ESCALAS.length - 1, Math.max(0, (atual === -1 ? 0 : atual) + direcao));
  return { ...prefs, escala: ESCALAS[novo] };
}
