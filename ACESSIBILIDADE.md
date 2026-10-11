# Checklist de acessibilidade (WCAG 2.1 AA)

## Validado neste projeto (por construção e por verificação automática no navegador)

### Estrutura e navegação

- [x] HTML semântico: `header`, `nav`, `main`, `section`, `article`, `footer`, listas e
      hierarquia de títulos (h1 por vista → h2 por candidato → h3 por página).
- [x] `lang="pt-BR"` no documento; título da página atualizado por vista.
- [x] Link “Pular para o conteúdo” como primeiro item focável; âncora não quebra o
      roteamento por hash.
- [x] Foco gerenciado a cada mudança de vista: o título (h1, `tabindex="-1"`) recebe o foco,
      então leitores de tela anunciam a nova tela.
- [x] Foco visível em todo controle (`outline` 3px + deslocamento; cor do foco tem contraste
      alto nos dois modos).
- [x] Navegação completa por teclado testada no fluxo principal: busca por tema →
      resultados → links dos trechos → Sobre → preferências (controles nativos `<button>`,
      `<a>` e `<input>`).

### Conteúdo e linguagem

- [x] Linguagem simples: “Aparece N vezes”, “Quantas vezes aparece” — sem jargão
      (“ocorrências”, “rankings”).
- [x] Aviso obrigatório sempre visível junto aos resultados (`role="note"`): “A quantidade de
      menções não indica a qualidade ou a viabilidade das propostas.”
- [x] Estados claros: carregando (“Carregando os dois planos…”, `role="status"`), nenhum
      resultado (mensagem + cartões com “Nenhuma menção encontrada”), termo muito curto
      (mensagem junto ao campo, `role="alert"`) e erro de carregamento (mensagem + botão
      “Tentar carregar de novo”).
- [x] Transparência da busca: a tela informa quando palavras do tema foram incluídas.

### Contraste (matemática, WCAG 2.1 AA — 4.5:1 texto, 3:1 componentes)

| Elemento | Combinação | Razão |
| --- | --- | --- |
| Texto padrão sobre fundo | `#1b1b1b` / `#ffffff` | ≈ 16,5:1 |
| Links e botão principal | `#0a4f8f` / `#ffffff` | ≈ 8,3:1 |
| Aviso (fundo claro) | `#4a3000` / `#fff7e0` | ≈ 11:1 |
| Destaque `<mark>` | `#1b1b1b` / `#ffe08a` | ≈ 13:1 |
| Erro | `#9b1c1c` / `#ffffff` | ≈ 8:1 |
| Modo alto contraste | `#ffffff`/`#ffff00`/`#00ffff` sobre `#000000` | ≥ 12:1 |

- [x] Destaque da palavra usa **fundo + sublinhado** (não depende só da cor).
- [x] Modo alto contraste completo (fundo, texto, links, bordas, foco, destaque) com
      alternância por botão (`aria-pressed`) e persistência local.

### Alvos de toque e tipografia

- [x] Base de 18px; A+/A− ajustam de 100% a 150% e persistem no aparelho.
- [x] Todos os botões e links de navegação com área mínima de 48px.
- [x] Campo de busca grande (56px) e botão principal destacado.

### Layout responsivo

- [x] Mobile-first; validado a 360px **sem rolagem horizontal** (scrollWidth ≤ viewport).
- [x] Desktop (≥ 900px): dois cartões lado a lado; celular: cartões empilhados.
- [x] Texto quebra palavras longas (`overflow-wrap`) para não estourar a largura.

### Privacidade (requisito de acessibilidade/confiança)

- [x] Sem login, sem cookies de rastreamento; preferências só em `localStorage` local.

---

## O que ainda preciso testar manualmente

- [ ] **Leitores de tela reais**: NVDA + Firefox/Chrome (Windows), VoiceOver (iOS/macOS),
      TalkBack (Android). Verificar: anúncio do status de carregamento, rótulos dos links de
      trecho (“Ver este trecho no PDF oficial, página N”), anúncio do `<mark>` como trecho
      destacado e ordem de leitura dos dois cartões.
- [ ] **Navegação por teclado em profundidade**: ordem do Tab no cabeçalho → busca →
      temas → resultados; ativação dos botões de tema por Enter/Espaço; comportamento do
      foco ao voltar/avançar do navegador (histórico).
- [ ] **Zoom de 200% e reflow a 400%** (WCAG 1.4.10) em desktop e celular reais.
- [ ] **Leitura em telas pequenas reais** (ex.: iPhone SE 375px, Android 360px) com o
      teclado virtual aberto — o formulário precisa continuar usável.
- [ ] **Modo alto contraste do sistema** (Windows High Contrast / `forced-colors`) — não
      há estilo dedicado ainda; verificar legibilidade com os temas do sistema.
- [ ] **Aparelhos e navegadores antigos** (Android Go com Chrome antigo; browsers sem
      `structuredClone`/`fetch` moderno): o app usa `fetch`, `URLSearchParams`, `NFD` —
      testar nos mínimos suportados.
- [ ] **Funcionamento offline**: depois da primeira visita, repetir a busca sem conexão
      (service worker) e instalação como app (manifest) em Android e desktop.
- [ ] **Links `#page=N`** nos visualizadores de PDF usados pelo público-alvo.
- [ ] **Teste com usuários de 60+** (obrigatório antes do lançamento): compreensão do aviso
      sobre contagem, dos termos “sinônimos incluídos” e dos links “nova aba”.
