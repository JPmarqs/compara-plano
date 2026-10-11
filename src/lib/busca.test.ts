import { describe, it, expect } from "vitest";
import { buscar, encontrarIntervalos, construirTrechos } from "./busca";
import { montarConsulta } from "./consulta";
import type { Plano } from "./tipos";
import type { Tema } from "../temas";

/**
 * Plano de teste pequeno e determinístico.
 * Contagens esperadas para o termo "educação":
 *   página 1 -> 2 ("educação" no início + "educacional")
 *   página 3 -> 1 ("educação" no meio)
 *   página 4 -> 1 ("educação" na última posição da página)
 *   total -> 4
 */
const plano: Plano = {
  candidato: "Candidato Alfa (exemplo fictício)",
  versao: "exemplo-1",
  data_coleta: "2026-10-10",
  url_pdf: "https://example.org/plano-alfa.pdf",
  paginas: [
    { numero: 1, texto: "Educação é a base do plano. O programa educacional fortalece as escolas." },
    { numero: 2, texto: "Saúde e segurança para todas as famílias." },
    { numero: 3, texto: "Reforço no ensino e formação de professores. Também educação." },
    { numero: 4, texto: "A última palavra deste plano é educação" },
  ],
};

const SEM_TEMAS: Tema[] = [];
const TEMAS_TESTE: Tema[] = [
  { id: "educacao", rotulo: "Educação", busca: "educação", sinonimos: ["escola"] },
];

const buscarEducacao = (entrada: string) => buscar(plano, montarConsulta(entrada, SEM_TEMAS));

describe("contagem", () => {
  it("conta as ocorrências por plano e por página", () => {
    const resultado = buscarEducacao("educação");
    expect(resultado.total).toBe(4);
    expect(resultado.paginas.map((p) => p.numero)).toEqual([1, 3, 4]);
    expect(resultado.paginas[0].total).toBe(2);
    expect(resultado.paginas[1].total).toBe(1);
    expect(resultado.paginas[2].total).toBe(1);
  });

  it("acentos e maiúsculas não mudam o resultado", () => {
    expect(buscarEducacao("EDUCAÇÃO").total).toBe(buscarEducacao("educacao").total);
    expect(buscarEducacao("educação").total).toBe(4);
  });

  it("plural e singular encontram o mesmo texto", () => {
    expect(buscarEducacao("escolas").total).toBe(1);
    expect(buscarEducacao("escola").total).toBe(1);
  });

  it("termo inexistente retorna zero e nenhuma página", () => {
    const resultado = buscarEducacao("astronáutica");
    expect(resultado.total).toBe(0);
    expect(resultado.paginas).toEqual([]);
  });

  it("busca por expressão exige palavras vizinhas e respeita acentos", () => {
    const consulta = montarConsulta("segurança para", SEM_TEMAS);
    const resultado = buscar(plano, consulta);
    expect(resultado.total).toBe(1);
    const trecho = resultado.paginas[0].trechos[0];
    const destacado = trecho.segmentos.filter((s) => s.destaque).map((s) => s.texto).join("");
    expect(destacado).toBe("segurança para");
  });

  it("inclui palavras do tema quando configurado (transparente para o usuário)", () => {
    const comSinonimos = buscar(plano, montarConsulta("educação", TEMAS_TESTE));
    expect(comSinonimos.total).toBe(5); // 4 de "educação" + 1 de "escolas"
  });
});

describe("trechos", () => {
  it("palavra no início da página: sem reticências à esquerda, texto original preservado", () => {
    const resultado = buscarEducacao("educação");
    const trecho = resultado.paginas[0].trechos[0];
    expect(trecho.inicioCortado).toBe(false);
    const destaque = trecho.segmentos.find((s) => s.destaque);
    expect(destaque?.texto).toBe("Educação"); // acento e caixa originais
  });

  it("palavra no fim da página: sem reticências à direita", () => {
    const resultado = buscarEducacao("educação");
    const pagina4 = resultado.paginas.find((p) => p.numero === 4)!;
    const trecho = pagina4.trechos[0];
    expect(trecho.fimCortado).toBe(false);
    const ultimo = trecho.segmentos[trecho.segmentos.length - 1];
    expect(ultimo.destaque).toBe(true);
    expect(ultimo.texto).toBe("educação");
  });

  it("mostra contexto antes e depois, unindo ocorrências próximas", () => {
    const resultado = buscarEducacao("educação");
    // Página 1: duas ocorrências próximas unificadas em um trecho, com o texto do meio.
    const trecho = resultado.paginas[0].trechos[0];
    const destaques = trecho.segmentos.filter((s) => s.destaque).map((s) => s.texto);
    expect(destaques).toEqual(["Educação", "educacional"]);
    const meio = trecho.segmentos.find((s) => !s.destaque && s.texto.includes("base do plano"));
    expect(meio).toBeDefined();
    // Página 3: o contexto antes do destaque inclui as palavras vizinhas.
    const pagina3 = resultado.paginas.find((p) => p.numero === 3)!;
    const antes = pagina3.trechos[0].segmentos.find((s) => !s.destaque && s.texto.includes("professores"));
    expect(antes).toBeDefined();
  });

  it("trecho no meio de texto longo: marca o corte com reticências nos dois lados", () => {
    const longo =
      ("Contexto inicial. ").repeat(12) + "reforçar a educação com metas públicas. " + ("Contexto final. ").repeat(12);
    const planoLongo: Plano = { ...plano, paginas: [{ numero: 1, texto: longo }] };
    const resultado = buscar(planoLongo, montarConsulta("educação", SEM_TEMAS));
    const trecho = resultado.paginas[0].trechos[0];
    expect(trecho.inicioCortado).toBe(true);
    expect(trecho.fimCortado).toBe(true);
    const destaque = trecho.segmentos.find((s) => s.destaque);
    expect(destaque?.texto).toBe("educação");
    // Contexto anterior e posterior estão presentes.
    expect(trecho.segmentos[0].destaque).toBe(false);
    expect(trecho.segmentos[0].texto).toContain("Contexto inicial");
    const ultimo = trecho.segmentos[trecho.segmentos.length - 1];
    expect(ultimo.destaque).toBe(false);
    expect(ultimo.texto).toContain("Contexto final");
  });

  it("respeita o limite de trechos por página e informa os ocultos", () => {
    const repetido = ("Uma frase com educação aqui. ").repeat(10);
    const planoLongo: Plano = { ...plano, paginas: [{ numero: 1, texto: repetido }] };
    const resultado = buscar(planoLongo, montarConsulta("educação", SEM_TEMAS));
    const pagina = resultado.paginas[0];
    expect(pagina.total).toBe(10);
    expect(pagina.trechos.length).toBeLessThanOrEqual(5);
  });
});

describe("encontrarIntervalos e construirTrechos (unidade)", () => {
  it("intervalos usam índices do texto original", () => {
    const texto = "A Educação importa.";
    const consulta = montarConsulta("educacao", SEM_TEMAS);
    const intervalos = encontrarIntervalos(texto, consulta);
    expect(intervalos).toHaveLength(1);
    expect(texto.slice(intervalos[0].inicio, intervalos[0].fim)).toBe("Educação");
  });

  it("sem intervalos não há trechos", () => {
    expect(construirTrechos("texto qualquer", [])).toEqual([]);
  });
});
