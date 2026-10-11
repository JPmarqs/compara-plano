import { describe, it, expect } from "vitest";
import { montarConsulta, consultaValida } from "./consulta";
import type { Tema } from "../temas";

const TEMAS_TESTE: Tema[] = [
  {
    id: "educacao",
    rotulo: "Educação",
    busca: "educação",
    sinonimos: ["escola", "ensino"],
  },
  {
    id: "meio-ambiente",
    rotulo: "Meio ambiente",
    busca: "meio ambiente",
    sinonimos: ["ambiental"],
  },
];

describe("consultaValida", () => {
  it("exige o mínimo de 3 caracteres (após aparar espaços)", () => {
    expect(consultaValida("ab")).toBe(false);
    expect(consultaValida("  ed ")).toBe(false);
    expect(consultaValida("abc")).toBe(true);
    expect(consultaValida("  educação ")).toBe(true);
  });
});

describe("montarConsulta", () => {
  it("acrescenta as palavras do tema quando a busca atinge um tema", () => {
    const consulta = montarConsulta("educação", TEMAS_TESTE);
    expect(consulta.tema).toBe("Educação");
    expect(consulta.relacionados).toEqual(["escola", "ensino"]);
    expect(consulta.frase).toBeNull();
    expect(consulta.termos).toHaveLength(3); // educação + 2 relacionadas
  });

  it("também ativa o tema quando a busca usa uma palavra relacionada", () => {
    const consulta = montarConsulta("escola", TEMAS_TESTE);
    expect(consulta.tema).toBe("Educação");
    expect(consulta.relacionados).toContain("educação");
    expect(consulta.relacionados).not.toContain("escola");
  });

  it("não acrescenta nada quando a palavra não pertence a nenhum tema", () => {
    const consulta = montarConsulta("cachorro", TEMAS_TESTE);
    expect(consulta.tema).toBeNull();
    expect(consulta.relacionados).toEqual([]);
    expect(consulta.termos).toHaveLength(1);
  });

  it("trata 2+ palavras como expressão, sem acrescentar palavras do tema", () => {
    const consulta = montarConsulta("meio ambiente", TEMAS_TESTE);
    expect(consulta.frase).not.toBeNull();
    expect(consulta.frase).toHaveLength(2);
    expect(consulta.relacionados).toEqual([]);
    expect(consulta.tema).toBeNull();
  });

  it("preserva o texto original digitado para exibição", () => {
    const consulta = montarConsulta("  Meio   Ambiente ", TEMAS_TESTE);
    expect(consulta.original).toBe("Meio Ambiente");
  });
});
