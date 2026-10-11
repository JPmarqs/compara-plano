# Planos 2026 — busca nos planos de governo

Aplicação web **neutra, acessível e offline-friendly** para o 2º turno das eleições gerais
brasileiras de 2026 (25/10/2026). O eleitor digita uma palavra (ex.: “educação”) e vê, lado a
lado e com o mesmo tratamento, o que os **dois planos de governo** dizem sobre ela — com
quantidade de menções, trechos literais, número da página e link para a página exata do
**PDF oficial registrado no TSE**.

Sem IA generativa, sem login, sem rastreamento, sem backend. A busca roda inteiramente no
navegador do eleitor.

---

## Como instalar e rodar

Requisitos: Node.js 18+ e npm.

```bash
npm install        # instala as dependências (só de desenvolvimento)
npm run dev        # servidor de desenvolvimento: http://localhost:5173
npm test           # 31 testes unitários (busca, normalização, contagem, trechos)
npm run build      # gera a versão publicável em dist/ (com checagem de tipos)
npm run preview    # serve a versão de produção localmente
```

Para publicar: envie o conteúdo de `dist/` para qualquer hospedagem estática
(GitHub Pages, Netlify, Azure Static Web Apps, CDN etc.). Não há servidor de aplicação.

---

## Suposições que fiz

1. **Stack**: Vite + TypeScript puro, sem framework. Motivo: o produto é busca + páginas
   estáticas; DOM semântico direto mantém o pacote inicial em ~10 KB gzip (muito abaixo do
   limite de 200 KB para 3G) e dá controle total sobre acessibilidade.
2. Os planos reais virão como **um JSON por candidato** em `public/data/`, com `url_pdf`
   público e estável (usado com o fragmento `#page=N`).
3. Ordem de exibição: **sorteada a cada busca** por padrão; alternativa alfabética fixa em
   `src/config.ts` (`ordemExibicao`). Nunca há ranking.
4. O dicionário de palavras relacionadas por tema fica em `src/temas.ts` — editável e
   revisável quanto à neutralidade.
5. Os navegadores dos eleitores abrem fragments de PDF (`pdf#page=3`) — verdadeiro em
   Chrome, Edge, Firefox e Safari.

---

## Estrutura do projeto

```
compara-plano/
├── index.html                 # Marcação semântica das 3 vistas (início, resultados, sobre)
├── assets/                    # PDFs oficiais baixados do TSE (fonte da extração)
│   ├── proposta-pl.pdf        # Flávio Bolsonaro (76 páginas)
│   └── proposta-pt.pdf        # Lula (84 páginas)
├── public/
│   ├── data/                  # ← DADOS gerados a partir dos PDFs (JSON por página)
│   │   ├── plano-flavio-bolsonaro.json
│   │   └── plano-lula.json
│   ├── manifest.webmanifest   # PWA
│   ├── sw.js                  # Service worker (cache offline, atualizável)
│   └── icon.svg
├── scripts/
│   ├── extrair-planos.py      # Extrai texto página a página dos PDFs (pypdf)
│   └── requirements.txt
├── exemplos/                  # Planos fictícios pequenos (modelo para testes)
│   ├── plano-a-exemplo-ficticio.json
│   └── plano-b-exemplo-ficticio.json
├── src/
│   ├── main.ts                # Roteamento por hash, preferências, orquestração
│   ├── styles.css             # Mobile-first, base 18px, alto contraste, foco visível
│   ├── config.ts              # Ajustes: ordem, mínimo de letras, contexto, limite de trechos
│   ├── temas.ts               # Temas sugeridos + dicionário de palavras relacionadas
│   ├── lib/
│   │   ├── normalize.ts       # Remove acentos/caixa SÓ para comparação (com mapa de índices)
│   │   ├── match.ts           # Radicalização e correspondência (determinística)
│   │   ├── consulta.ts        # Montagem da consulta: tema, sinônimos, expressão
│   │   ├── busca.ts           # Busca em memória, contagem e geração de trechos
│   │   ├── dados.ts           # Carregamento/validação dos JSONs
│   │   ├── prefs.ts           # A+/A− e alto contraste (localStorage, só local)
│   │   └── tipos.ts           # Formato do Plano
│   └── ui/resultados.ts       # Renderizador ÚNICO dos cartões (= neutralidade por construção)
└── src/**/*.test.ts           # Testes: normalização, radical, contagem, trechos
```

### Estratégia de busca (por que sem banco de dados)

São apenas dois documentos pequenos: a cada busca o app varre as páginas em memória
(tokenização + correspondência por radical), o que leva milissegundos e permite funcionar
**offline** (os JSONs são guardados em cache pelo service worker). Um índice pré-construído
só se justificaria com dezenas de documentos ou textos gigantes.

Regras, todas determinísticas:

- Normalização: NFD + remoção de marcas + minúsculas, **apenas para comparar**; o texto
  exibido é sempre o original (acentos e caixa preservados, com mapa de índices).
- Radicalização: remoção de até 2 sufixos conhecidos (fixos e revisáveis em `match.ts`);
  comparação por igualdade ou prefixo (radical ≥ 4 letras; 3 letras só se quase igual).
- Sinônimos: se a busca atinge um tema de `temas.ts`, as palavras relacionadas entram na
  busca e **são informadas na tela** (“também foram incluídas as palavras: …”).
- Expressões: 2+ palavras são buscadas como expressão com palavras vizinhas.

---

## Como usar os planos reais (já aplicados nesta versão)

Os PDFs oficiais estão em `assets/` (baixados das páginas do TSE):

- Flávio Bolsonaro: `assets/proposta-pl.pdf` —
  [página do TSE](https://www.tse.jus.br/eleicoes/eleicoes-2026-content/propostas-de-governo-dos-candidatos-ao-cargo-de-presidente-da-republica-eleicoes-2026/flavio-bolsonaro)
- Lula: `assets/proposta-pt.pdf` —
  [página do TSE](https://www.tse.jus.br/eleicoes/eleicoes-2026-content/propostas-de-governo-dos-candidatos-ao-cargo-de-presidente-da-republica-eleicoes-2026/lula-propostas-de-governo)

Para (re)gerar os JSONs que o app consome:

```bash
pip install -r scripts/requirements.txt   # só na primeira vez (biblioteca pypdf)
python scripts/extrair-planos.py          # usa a data de hoje
```

O script grava `public/data/plano-flavio-bolsonaro.json` e `public/data/plano-lula.json`.
Se os PDFs forem atualizados no TSE, baixe os novos arquivos em `assets/`, rode o script
de novo e bumpie o nome do cache em `public/sw.js`.

### Formato dos dados (o mesmo das versões fictícias)

```json
{
  "candidato": "Nome do candidato",
  "versao": "PDF oficial do TSE (arquivo.pdf)",
  "data_coleta": "AAAA-MM-DD",
  "url_pdf": "https://www.tse.jus.br/.../proposta-x.pdf",
  "paginas": [
    { "numero": 1, "texto": "texto literal da página 1" }
  ]
}
```

A numeração `numero` acompanha o PDF original, e o app monta os links `url_pdf#page=N`,
de modo que cada trecho abre na página exata do documento oficial. As páginas sem camada
de texto (ex.: capas apenas com imagem) ficam com `texto` vazio e simplesmente não geram
resultados.

Os arquivos em `exemplos/` são fictícios (`example.org`) e servem de modelo/teste.

---

## Critérios de aceite e como foram cobertos

| Critério | Como está coberto |
| --- | --- |
| “educação” retorna resultados para ambos com estrutura visual igual | Um único renderizador (`ui/resultados.ts`); os dois cartões têm os mesmos elementos e classes |
| “educacao”/“EDUCAÇÃO” retornam o mesmo resultado | Normalização de acentos e caixa; teste automatizado + validação no navegador |
| Todo trecho tem página e link para o PDF | Cada trecho e cada página têm link `#page=N`; teste automatizado |
| Fluxo completo só com teclado | Elementos nativos, foco movido para o título a cada navegação, link “pular para o conteúdo” |
| 360px sem rolagem horizontal | Validado no navegador (scrollWidth ≤ viewport); `min-width: 0` nos cartões e `overflow-wrap` |
| Aviso sobre contagem sempre visível junto aos resultados | Bloco fixo `role="note"` acima dos cartões |

---

## Checklist de acessibilidade

Ver [ACESSIBILIDADE.md](./ACESSIBILIDADE.md): o que foi validado por construção/verificação
automática e o que ainda precisa de teste manual (leitores de tela em aparelhos reais,
ampliação de 400%, etc.).

---

## Riscos e limitações identificados

1. **Radical heurístico**: regras fixas de sufixo podem gerar falsos positivos (palavras
   parecidas de assunto diferente) e falsos negativos (variações fora das regras). É
   consciente: determinístico, explicável e revisável — e está documentado na página Sobre.
2. **Sinônimos são opinião configurável**: dicionário curto e revisável; deve ser auditado
   por neutralidade antes de publicar com dados reais.
3. **Extração de PDF**: erros de conversão (colunas, hifenizações, ligaduras) afetam
   contagens e trechos. A rastreabilidade (página + link) é o antídoto.
4. **Contagem sem contexto**: negações e ironias contam igual; o aviso fixo cobre isso.
5. **Fragmento `#page=N`** depende do visualizador de PDF do navegador (funciona nos
   principais; em alguns apps nativos pode abrir no início do documento).
6. **Atualização do app**: o service worker usa cache-first para arquivos estáticos — ao
   publicar uma nova versão, bumpie o nome do cache em `public/sw.js`.
7. **Ferramentas de desenvolvimento**: o `npm audit` aponta vulnerabilidades no Vitest
   (somente no runner de testes, que exige Node 20+ para a versão corrigida). Elas **não**
   afetam o artefato publicado, que não tem dependências de execução.

---

## Privacidade

Sem login, sem cookies de rastreamento, sem analytics. A busca nunca sai do navegador.
Preferências visuais ficam em `localStorage`, apenas no aparelho.
