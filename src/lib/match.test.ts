import { describe, it, expect } from "vitest";
import { radicaliza, termoCorresponde, termoDePalavra } from "./match";
import { normalizar } from "./normalize";

const termo = (palavra: string) => termoDePalavra(normalizar(palavra));

describe("radicaliza", () => {
  it("extrai o radical de palavras comuns", () => {
    expect(radicaliza("educacao")).toContain("educ");
    expect(radicaliza("escolas")).toContain("escola");
    expect(radicaliza("seguranca")).toContain("segur");
    expect(radicaliza("trabalhador")).toContain("trabalh");
  });

  it("mantém a palavra quando não há sufixo conhecido", () => {
    expect(radicaliza("saude")).toEqual(["saude"]);
    expect(radicaliza("meio")).toEqual(["meio"]);
  });

  it("não reduz radicais a menos de 3 letras", () => {
    for (const candidato of radicaliza("acao")) {
      expect(candidato.length).toBeGreaterThanOrEqual(3);
    }
  });
});

describe("termoCorresponde", () => {
  it("aceita acento e caixa diferentes (normalização prévia)", () => {
    const t = termo("Educação");
    expect(termoCorresponde(normalizar("EDUCAÇÃO"), t)).toBe(true);
    expect(termoCorresponde(normalizar("educacao"), t)).toBe(true);
  });

  it("aceita plural e singular", () => {
    const escola = termo("escola");
    expect(termoCorresponde(normalizar("escolas"), escola)).toBe(true);
    const escolas = termo("escolas");
    expect(termoCorresponde(normalizar("escola"), escolas)).toBe(true);
  });

  it("aceita variações do mesmo radical", () => {
    const t = termo("educação");
    expect(termoCorresponde(normalizar("educar"), t)).toBe(true);
    expect(termoCorresponde(normalizar("educacional"), t)).toBe(true);
    expect(termoCorresponde(normalizar("educador"), t)).toBe(true);
  });

  it("não casa palavras de assunto diferente", () => {
    const t = termo("educação");
    expect(termoCorresponde(normalizar("escola"), t)).toBe(false);
    expect(termoCorresponde(normalizar("saúde"), t)).toBe(false);
    expect(termoCorresponde(normalizar("astronáutica"), t)).toBe(false);
  });

  it("funciona com palavras curtas de 3 letras (igual ou quase igual)", () => {
    const lei = termo("lei");
    expect(termoCorresponde("lei", lei)).toBe(true);
    expect(termoCorresponde("leis", lei)).toBe(true);
    expect(termoCorresponde("lei", termo("leis"))).toBe(true);
  });
});
