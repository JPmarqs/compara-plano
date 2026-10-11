import { describe, it, expect } from "vitest";
import { normalizar, normalizarComMapa } from "./normalize";

describe("normalizar", () => {
  it("remove acentos e ignora maiúsculas/minúsculas", () => {
    expect(normalizar("Educação")).toBe("educacao");
    expect(normalizar("EDUCAÇÃO")).toBe("educacao");
    expect(normalizar("educação")).toBe("educacao");
    expect(normalizar("Saúde")).toBe("saude");
    expect(normalizar("AÇÃO")).toBe("acao");
    expect(normalizar("Ç")).toBe("c");
    expect(normalizar("Ônibus")).toBe("onibus");
  });

  it("não altera palavras sem acento", () => {
    expect(normalizar("escola")).toBe("escola");
    expect(normalizar("meio ambiente")).toBe("meio ambiente");
  });
});

describe("normalizarComMapa", () => {
  it("mantém o mapa de índices apontando para o texto original", () => {
    const original = "Educação é importantíssima.";
    const { texto, mapa } = normalizarComMapa(original);

    expect(texto).toBe("educacao e importantissima.");
    expect(mapa).toHaveLength(texto.length);

    // O destaque feito no texto normalizado corresponde ao original.
    const inicio = texto.indexOf("educacao");
    const fim = inicio + "educacao".length;
    expect(original.slice(mapa[inicio], mapa[fim - 1] + 1)).toBe("Educação");
  });

  it("mapa linha a linha: cada caractere normalizado aponta para o seu original", () => {
    const original = "AÇÃO";
    const { texto, mapa } = normalizarComMapa(original);
    expect(texto).toBe("acao");
    expect(mapa).toEqual([0, 1, 2, 3]);
    expect(original.slice(mapa[1], mapa[1] + 1)).toBe("Ç");
    expect(original.slice(mapa[3], mapa[3] + 1)).toBe("O");
  });
});
