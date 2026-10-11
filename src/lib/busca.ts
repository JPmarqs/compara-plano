import { normalizarComMapa } from "./normalize";
import { termoCorresponde } from "./match";
import type { Consulta } from "./consulta";
import type { Plano } from "./tipos";
import { CONFIG } from "../config";

/**
 * Busca textual determinística, no cliente, em memória.
 * Não há banco de dados nem servidor: com dois documentos pequenos,
 * varrer as páginas a cada busca é rápido e mantém o app offline.
 */

export interface Intervalo {
  /** Incluído. Índices no texto ORIGINAL. */
  inicio: number;
  /** Excluído. Índices no texto ORIGINAL. */
  fim: number;
}

export interface Segmento {
  texto: string;
  /** true = parte da palavra(s) que casa com a busca (exibida com <mark>). */
  destaque: boolean;
}

export interface Trecho {
  segmentos: Segmento[];
  /** true = o trecho começa antes do início da página (há reticências). */
  inicioCortado: boolean;
  /** true = o trecho termina depois do fim da página (há reticências). */
  fimCortado: boolean;
}

export interface ResultadoPagina {
  numero: number;
  total: number;
  trechos: Trecho[];
  /** Quantos trechos da página ficaram de fora do limite de exibição. */
  trechosOcultos: number;
}

export interface ResultadoPlano {
  candidato: string;
  versao: string;
  dataColeta: string;
  urlPdf: string;
  total: number;
  paginas: ResultadoPagina[];
}

/** Encontra, no texto original, os intervalos que casam com a consulta. */
export function encontrarIntervalos(texto: string, consulta: Consulta): Intervalo[] {
  const { texto: normalizado, mapa } = normalizarComMapa(texto);

  // Tokenização no texto normalizado ([a-z0-9]+, sem acentos).
  const tokens: { inicio: number; fim: number; palavra: string }[] = [];
  const re = /[a-z0-9]+/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(normalizado)) !== null) {
    tokens.push({ inicio: m.index, fim: m.index + m[0].length, palavra: m[0] });
  }

  const intervalos: Intervalo[] = [];

  if (consulta.frase) {
    const partes = consulta.frase;
    for (let i = 0; i + partes.length <= tokens.length; i++) {
      let casa = true;
      for (let j = 0; j < partes.length; j++) {
        if (!termoCorresponde(tokens[i + j].palavra, partes[j])) {
          casa = false;
          break;
        }
      }
      if (casa) {
        const inicio = tokens[i].inicio;
        const fim = tokens[i + partes.length - 1].fim;
        intervalos.push({ inicio: mapa[inicio], fim: mapa[fim - 1] + 1 });
      }
    }
  } else {
    for (const token of tokens) {
      if (consulta.termos.some((termo) => termoCorresponde(token.palavra, termo))) {
        intervalos.push({ inicio: mapa[token.inicio], fim: mapa[token.fim - 1] + 1 });
      }
    }
  }

  return intervalos;
}

/** Monta os trechos (com contexto e destaque) a partir dos intervalos. */
export function construirTrechos(texto: string, intervalos: Intervalo[]): Trecho[] {
  const ordenados = [...intervalos].sort((a, b) => a.inicio - b.inicio);

  // Funde intervalos que se sobrepõem (casos raros de expressões sobrepostas).
  const fundidos: Intervalo[] = [];
  for (const iv of ordenados) {
    const ultimo = fundidos[fundidos.length - 1];
    if (ultimo && iv.inicio <= ultimo.fim) {
      ultimo.fim = Math.max(ultimo.fim, iv.fim);
    } else {
      fundidos.push({ ...iv });
    }
  }

  // Janelas de contexto; janelas próximas são unidas em um único trecho.
  const janelas: { inicio: number; fim: number }[] = [];
  const contexto = CONFIG.contextoTrecho;
  for (const iv of fundidos) {
    let inicio = Math.max(0, iv.inicio - contexto);
    let fim = Math.min(texto.length, iv.fim + contexto);
    if (inicio > 0) {
      const espaco = texto.indexOf(" ", inicio);
      if (espaco !== -1 && espaco < iv.inicio) inicio = espaco + 1;
    }
    if (fim < texto.length) {
      const espaco = texto.lastIndexOf(" ", fim);
      if (espaco > iv.fim) fim = espaco;
    }
    const ultima = janelas[janelas.length - 1];
    if (ultima && inicio <= ultima.fim) {
      ultima.fim = Math.max(ultima.fim, fim);
    } else {
      janelas.push({ inicio, fim });
    }
  }

  return janelas.map((janela) => segmentar(texto, janela, fundidos));
}

function segmentar(
  texto: string,
  janela: { inicio: number; fim: number },
  intervalos: Intervalo[],
): Trecho {
  const segmentos: Segmento[] = [];
  let pos = janela.inicio;
  for (const iv of intervalos) {
    if (iv.fim <= janela.inicio || iv.inicio >= janela.fim) continue;
    const inicio = Math.max(iv.inicio, janela.inicio);
    const fim = Math.min(iv.fim, janela.fim);
    if (inicio > pos) segmentos.push({ texto: texto.slice(pos, inicio), destaque: false });
    segmentos.push({ texto: texto.slice(inicio, fim), destaque: true });
    pos = fim;
  }
  if (pos < janela.fim) segmentos.push({ texto: texto.slice(pos, janela.fim), destaque: false });
  return {
    segmentos,
    inicioCortado: janela.inicio > 0,
    fimCortado: janela.fim < texto.length,
  };
}

/** Busca em um plano completo. */
export function buscar(plano: Plano, consulta: Consulta): ResultadoPlano {
  const paginas: ResultadoPagina[] = [];
  let total = 0;

  for (const pagina of plano.paginas) {
    const intervalos = encontrarIntervalos(pagina.texto, consulta);
    if (intervalos.length === 0) continue;
    total += intervalos.length;
    const todos = construirTrechos(pagina.texto, intervalos);
    const limite = CONFIG.maxTrechosPorPagina;
    paginas.push({
      numero: pagina.numero,
      total: intervalos.length,
      trechos: todos.slice(0, limite),
      trechosOcultos: Math.max(0, todos.length - limite),
    });
  }

  return {
    candidato: plano.candidato,
    versao: plano.versao,
    dataColeta: plano.data_coleta,
    urlPdf: plano.url_pdf,
    total,
    paginas,
  };
}
