import type { Plano } from "./tipos";

/**
 * Carregamento dos planos (JSON estático, servido pelo mesmo host).
 * Os dados nunca saem do navegador; aqui só são baixados uma vez e guardados
 * em memória para as buscas seguintes serem instantâneas (inclusive offline,
 * depois que o service worker os guardar em cache).
 */

let promessa: Promise<Plano[]> | null = null;

const ARQUIVOS = ["data/plano-flavio-bolsonaro.json", "data/plano-lula.json"];

function caminho(relativo: string): string {
  return `${import.meta.env.BASE_URL}${relativo}`;
}

/** Carrega (e memoriza) os dois planos. */
export function carregarPlanos(): Promise<Plano[]> {
  if (!promessa) {
    promessa = Promise.all(ARQUIVOS.map(buscarPlano)).catch((erro) => {
      promessa = null; // permite tentar de novo em caso de falha
      throw erro;
    });
  }
  return promessa;
}

/** Descarta o cache em memória (usado pelo botão "tentar de novo"). */
export function recarregarPlanos(): void {
  promessa = null;
}

async function buscarPlano(relativo: string): Promise<Plano> {
  const url = caminho(relativo);
  const resposta = await fetch(url);
  if (!resposta.ok) {
    throw new Error(`Não foi possível carregar ${url} (status ${resposta.status}).`);
  }
  return validarPlano(await resposta.json(), url);
}

function validarPlano(dados: unknown, origem: string): Plano {
  if (typeof dados !== "object" || dados === null) {
    throw new Error(`Formato inválido em ${origem}.`);
  }
  const d = dados as Record<string, unknown>;
  for (const campo of ["candidato", "versao", "data_coleta", "url_pdf"]) {
    if (typeof d[campo] !== "string" || (d[campo] as string).trim() === "") {
      throw new Error(`Campo "${campo}" ausente ou inválido em ${origem}.`);
    }
  }
  if (!Array.isArray(d.paginas) || d.paginas.length === 0) {
    throw new Error(`Nenhuma página encontrada em ${origem}.`);
  }
  d.paginas.forEach((p, i) => {
    const pagina = p as Record<string, unknown>;
    if (typeof pagina?.numero !== "number" || typeof pagina?.texto !== "string") {
      throw new Error(`Página ${i + 1} inválida em ${origem}.`);
    }
  });
  return d as unknown as Plano;
}
