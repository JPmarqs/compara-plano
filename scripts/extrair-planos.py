#!/usr/bin/env python
"""
Extrai o texto página a página dos PDFs oficiais das propostas de governo
e gera os JSONs usados pelo app (public/data/*.json).

Uso:
    python scripts/extrair-planos.py              # usa a data de hoje
    python scripts/extrair-planos.py --data 2026-10-10

Dependência: pip install -r scripts/requirements.txt

O texto é mantido LITERAL (sem reescrita); apenas tabs viram espaços.
Páginas sem camada de texto ficam com string vazia (ex.: capas com imagem).
A numeração das páginas acompanha o PDF original, para que os links
`url_pdf#page=N` do app abram na página certa.
"""

import argparse
import json
import sys
from datetime import date
from pathlib import Path

from pypdf import PdfReader

RAIZ = Path(__file__).resolve().parent.parent

# Fontes oficiais: PDFs baixados das páginas do TSE (ver README).
FONTES = [
    {
        "arquivo": "assets/proposta-pl.pdf",
        "candidato": "Flávio Bolsonaro",
        "url_pdf": (
            "https://www.tse.jus.br/eleicoes/eleicoes-2026-content/arquivos/"
            "proposta-pl/@@display-file/file/proposta-pl.pdf"
        ),
        "saida": "public/data/plano-flavio-bolsonaro.json",
    },
    {
        "arquivo": "assets/proposta-pt.pdf",
        "candidato": "Lula",
        "url_pdf": (
            "https://www.tse.jus.br/eleicoes/eleicoes-2026-content/arquivos/"
            "proposta-pt/@@display-file/file/proposta-pt.pdf"
        ),
        "saida": "public/data/plano-lula.json",
    },
]


def limpar(texto: str) -> str:
    """Limpeza mínima e segura: tabs viram espaços e espaços à direita caem."""
    linhas = [linha.rstrip() for linha in texto.replace("\t", " ").split("\n")]
    return "\n".join(linhas).strip()


def extrair(fonte: dict, data_coleta: str) -> dict:
    caminho = RAIZ / fonte["arquivo"]
    leitor = PdfReader(caminho)
    paginas = []
    vazias = 0
    for numero, pagina in enumerate(leitor.pages, start=1):
        texto = limpar(pagina.extract_text() or "")
        if not texto:
            vazias += 1
        paginas.append({"numero": numero, "texto": texto})

    total_chars = sum(len(p["texto"]) for p in paginas)
    print(
        f"{fonte['arquivo']}: {len(paginas)} páginas, {total_chars} caracteres, "
        f"{vazias} página(s) sem texto."
    )
    if total_chars < 1000:
        print("ERRO: extração quase vazia — o PDF pode ser digitalizado (sem camada de texto).", file=sys.stderr)
        sys.exit(1)

    return {
        "candidato": fonte["candidato"],
        "versao": f"PDF oficial do TSE ({Path(fonte['arquivo']).name})",
        "data_coleta": data_coleta,
        "url_pdf": fonte["url_pdf"],
        "paginas": paginas,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Extrai texto dos PDFs das propostas para JSON.")
    parser.add_argument("--data", default=date.today().isoformat(), help="Data da coleta (AAAA-MM-DD)")
    args = parser.parse_args()

    for fonte in FONTES:
        dados = extrair(fonte, args.data)
        destino = RAIZ / fonte["saida"]
        destino.parent.mkdir(parents=True, exist_ok=True)
        destino.write_text(
            json.dumps(dados, ensure_ascii=False, separators=(",", ":")),
            encoding="utf-8",
        )
        print(f"  -> {destino.relative_to(RAIZ)} ({destino.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
