import type { Consulta } from "../lib/consulta";
import type { ResultadoPlano, Trecho } from "../lib/busca";
import { CONFIG } from "../config";

/**
 * Renderização dos resultados.
 * Os dois candidatos passam pelo MESMO renderizador, com as mesmas classes
 * e o mesmo tamanho — a neutralidade é garantida por construção.
 */

function criar(tag: string, className?: string): HTMLElement {
  const el = document.createElement(tag);
  if (className) el.className = className;
  return el;
}

function texto(tag: string, conteudo: string, className?: string): HTMLElement {
  const el = criar(tag, className);
  el.textContent = conteudo;
  return el;
}

function link(href: string, rotulo: string, rotuloAcessivel?: string): HTMLAnchorElement {
  const a = document.createElement("a");
  a.href = href;
  a.textContent = rotulo;
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  if (rotuloAcessivel) a.setAttribute("aria-label", rotuloAcessivel);
  return a;
}

function fraseDeContagem(total: number): string {
  if (total === 0) return "Nenhuma menção encontrada.";
  if (total === 1) return "Aparece 1 vez.";
  return `Aparece ${total} vezes.`;
}

/** Ordem neutra: alfabética fixa OU sorteada a cada busca (nunca ranking). */
export function ordenarResultados(resultados: ResultadoPlano[]): ResultadoPlano[] {
  const copia = [...resultados];
  if (CONFIG.ordemExibicao === "alfabetica") {
    return copia.sort((a, b) => a.candidato.localeCompare(b.candidato, "pt-BR"));
  }
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

export function renderizarResultados(
  alvoCartoes: HTMLElement,
  alvoDetalhe: HTMLElement,
  alvoOrdem: HTMLElement,
  consulta: Consulta,
  resultados: ResultadoPlano[],
): void {
  alvoDetalhe.textContent = detalheDaBusca(consulta);
  alvoOrdem.textContent =
    CONFIG.ordemExibicao === "aleatoria"
      ? "A ordem dos candidatos é sorteada a cada busca. Os dois recebem o mesmo tratamento."
      : "Os candidatos são exibidos em ordem alfabética.";
  alvoCartoes.replaceChildren(...ordenarResultados(resultados).map(cartao));
}

function detalheDaBusca(consulta: Consulta): string {
  if (consulta.frase) {
    return `Busca pela expressão «${consulta.original}», palavra por palavra.`;
  }
  if (consulta.tema && consulta.relacionados.length > 0) {
    return (
      `Busca pela palavra «${consulta.original}». Pelo tema «${consulta.tema}», ` +
      `também foram incluídas as palavras: ${consulta.relacionados.join(", ")}.`
    );
  }
  return `Busca pela palavra «${consulta.original}», incluindo plural e variações do mesmo radical.`;
}

function cartao(resultado: ResultadoPlano, indice: number): HTMLElement {
  const artigo = criar("article", "cartao");
  artigo.setAttribute("aria-labelledby", `candidato-${indice}`);

  const titulo = texto("h1", resultado.candidato);
  titulo.id = `candidato-${indice}`;
  artigo.append(titulo);

  artigo.append(texto("p", fraseDeContagem(resultado.total), "contagem-total"));

  const fonte = criar("p", "fonte");
  fonte.append(
    texto("span", `Fonte: ${resultado.versao} · coletado em ${resultado.dataColeta} · `),
    link(
      resultado.urlPdf,
      "Abrir o PDF oficial (nova aba)",
      `Abrir o PDF oficial de ${resultado.candidato} (abre em nova aba)`,
    ),
  );
  artigo.append(fonte);

  if (resultado.total === 0) {
    artigo.append(texto("p", "Nenhum trecho deste plano corresponde aos termos buscados.", "vazio"));
    return artigo;
  }

  for (const pagina of resultado.paginas) {
    const secao = criar("section", "pagina");
    secao.setAttribute("aria-labelledby", `pagina-${indice}-${pagina.numero}`);
    const h3 = texto("h3", `Página ${pagina.numero}`);
    h3.id = `pagina-${indice}-${pagina.numero}`;
    secao.append(h3);
    secao.append(texto("p", `${fraseDeContagem(pagina.total)} Nesta página.`, "contagem-pagina"));

    const linkPagina = criar("p", "link-pagina");
    linkPagina.append(
      link(
        `${resultado.urlPdf}#page=${pagina.numero}`,
        `Ver a página ${pagina.numero} no PDF oficial (nova aba)`,
        `Ver a página ${pagina.numero} do plano de ${resultado.candidato} no PDF oficial (abre em nova aba)`,
      ),
    );
    secao.append(linkPagina);

    const lista = criar("ol", "trechos");
    for (const trecho of pagina.trechos) {
      lista.append(itemTrecho(trecho, resultado, pagina.numero));
    }
    secao.append(lista);

    if (pagina.trechosOcultos > 0) {
      secao.append(
        texto(
          "p",
          "Alguns trechos desta página não são exibidos aqui; todos estão no PDF oficial.",
          "nota",
        ),
      );
    }

    artigo.append(secao);
  }

  return artigo;
}

function itemTrecho(trecho: Trecho, resultado: ResultadoPlano, numeroPagina: number): HTMLElement {
  const item = criar("li", "trecho");
  const paragrafo = criar("p", "trecho-texto");
  if (trecho.inicioCortado) paragrafo.append("… ");
  for (const segmento of trecho.segmentos) {
    if (segmento.destaque) {
      const mark = criar("mark");
      mark.textContent = segmento.texto;
      paragrafo.append(mark);
    } else {
      paragrafo.append(segmento.texto);
    }
  }
  if (trecho.fimCortado) paragrafo.append(" …");
  item.append(paragrafo);

  const linkTrecho = criar("p", "trecho-link");
  linkTrecho.append(
    link(
      `${resultado.urlPdf}#page=${numeroPagina}`,
      `Ver no PDF (página ${numeroPagina})`,
      `Ver este trecho no PDF oficial, página ${numeroPagina} (abre em nova aba)`,
    ),
  );
  item.append(linkTrecho);
  return item;
}
