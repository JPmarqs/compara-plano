import "./styles.css";
import { TEMAS } from "./temas";
import { CONFIG } from "./config";
import { montarConsulta, consultaValida } from "./lib/consulta";
import { buscar } from "./lib/busca";
import { carregarPlanos, recarregarPlanos } from "./lib/dados";
import type { Plano } from "./lib/tipos";
import {
  carregarPreferencias,
  salvarPreferencias,
  aplicarPreferencias,
  mudarEscala,
} from "./lib/prefs";
import { renderizarResultados } from "./ui/resultados";

function elemento<T extends HTMLElement>(seletor: string): T {
  const alvo = document.querySelector<T>(seletor);
  if (!alvo) throw new Error(`Elemento não encontrado na página: ${seletor}`);
  return alvo;
}

/* ---------------- Preferências visuais (A+/A− e alto contraste) ---------------- */

let preferencias = carregarPreferencias();
aplicarPreferencias(preferencias);

elemento<HTMLButtonElement>("#btn-fonte-menor").addEventListener("click", () => {
  preferencias = mudarEscala(preferencias, -1);
  salvarPreferencias(preferencias);
  aplicarPreferencias(preferencias);
});

elemento<HTMLButtonElement>("#btn-fonte-maior").addEventListener("click", () => {
  preferencias = mudarEscala(preferencias, 1);
  salvarPreferencias(preferencias);
  aplicarPreferencias(preferencias);
});

elemento<HTMLButtonElement>("#btn-alto-contraste").addEventListener("click", () => {
  preferencias = { ...preferencias, altoContraste: !preferencias.altoContraste };
  salvarPreferencias(preferencias);
  aplicarPreferencias(preferencias);
});

/* ---------------- Temas sugeridos ---------------- */

const campo = elemento<HTMLInputElement>("#campo-busca");
const erroBusca = elemento<HTMLParagraphElement>("#erro-busca");
const formBusca = elemento<HTMLFormElement>("#form-busca");

const listaTemas = elemento<HTMLUListElement>("#lista-temas");
for (const tema of TEMAS) {
  const item = document.createElement("li");
  const botao = document.createElement("button");
  botao.type = "button";
  botao.className = "tema";
  botao.textContent = tema.rotulo;
  botao.addEventListener("click", () => {
    campo.value = tema.busca;
    submeterBusca(tema.busca);
  });
  item.append(botao);
  listaTemas.append(item);
}

formBusca.addEventListener("submit", (evento) => {
  evento.preventDefault();
  submeterBusca(campo.value);
});

function submeterBusca(entrada: string): void {
  if (!consultaValida(entrada)) {
    erroBusca.textContent = `Digite pelo menos ${CONFIG.caracteresMinimos} letras para buscar.`;
    campo.focus();
    return;
  }
  erroBusca.textContent = "";
  location.hash = `#/resultados?q=${encodeURIComponent(entrada.trim())}`;
}

/* ---------------- Roteamento (hash) ---------------- */

type NomeVista = "inicio" | "resultados" | "sobre";

interface Rota {
  nome: NomeVista;
  q?: string;
}

function lerRota(): Rota {
  const bruto = location.hash.slice(1); // sem "#"
  if (bruto.startsWith("/resultados")) {
    const interrogacao = bruto.indexOf("?");
    const params = new URLSearchParams(interrogacao >= 0 ? bruto.slice(interrogacao + 1) : "");
    const q = params.get("q");
    if (q && consultaValida(q)) return { nome: "resultados", q };
    return { nome: "inicio" };
  }
  if (bruto.startsWith("/sobre")) return { nome: "sobre" };
  return { nome: "inicio" };
}

const TITULOS: Record<NomeVista, string> = {
  inicio: "Planos 2026 — busca nos planos de governo",
  resultados: "Resultados — Planos 2026",
  sobre: "Sobre e metodologia — Planos 2026",
};

function mostrarVista(nome: NomeVista): void {
  for (const v of ["inicio", "resultados", "sobre"] as NomeVista[]) {
    elemento(`#vista-${v}`).hidden = v !== nome;
  }
  for (const link of document.querySelectorAll<HTMLAnchorElement>("a[data-rota]")) {
    if (link.dataset.rota === nome) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  }
  document.title = TITULOS[nome];
}

function focarTitulo(nome: NomeVista): void {
  elemento<HTMLElement>(`#titulo-${nome}`).focus();
}

/* ---------------- Vista de resultados ---------------- */

const tituloResultados = elemento<HTMLHeadingElement>("#titulo-resultados");
const statusResultados = elemento<HTMLParagraphElement>("#status-resultados");
const caixaResultados = elemento<HTMLDivElement>("#caixa-resultados");
const btnTentar = elemento<HTMLButtonElement>("#btn-tentar-novamente");
const cartoes = elemento<HTMLDivElement>("#cartoes");
const detalheBusca = elemento<HTMLParagraphElement>("#detalhe-busca");
const notaOrdem = elemento<HTMLParagraphElement>("#nota-ordem");

let geracaoExibicao = 0;
let primeiraExecucao = true;

btnTentar.addEventListener("click", () => {
  recarregarPlanos();
  executarRota();
});

async function exibirResultados(consultaBruta: string): Promise<void> {
  const geracao = ++geracaoExibicao;
  mostrarVista("resultados");
  caixaResultados.hidden = true;
  btnTentar.hidden = true;
  statusResultados.classList.remove("status-erro");
  statusResultados.textContent = "Carregando os dois planos…";
  tituloResultados.textContent = `Resultados da busca por «${consultaBruta}»`;

  try {
    const planos = await carregarPlanos();
    if (geracao !== geracaoExibicao) return; // usuário já navegou para outra busca

    const consulta = montarConsulta(consultaBruta);
    const resultados = planos.map((plano) => buscar(plano, consulta));
    renderizarResultados(cartoes, detalheBusca, notaOrdem, consulta, resultados);

    caixaResultados.hidden = false;
    statusResultados.textContent = resultados.every((r) => r.total === 0)
      ? `Nenhuma menção encontrada para «${consulta.original}». Tente outra palavra ou um tema da página inicial.`
      : "";
    focarTitulo("resultados");
  } catch (erro) {
    if (geracao !== geracaoExibicao) return;
    statusResultados.classList.add("status-erro");
    statusResultados.textContent =
      "Não foi possível carregar os planos agora. Verifique a conexão e tente de novo.";
    btnTentar.hidden = false;
    caixaResultados.hidden = true;
  }
}

/* ---------------- Vista sobre (metadados dos dados carregados) ---------------- */

let metadadosPreenchidos = false;

async function preencherMetadados(): Promise<void> {
  if (metadadosPreenchidos) return;
  const alvo = elemento<HTMLDivElement>("#meta-planos");
  const erroEl = elemento<HTMLParagraphElement>("#meta-erro");
  try {
    const planos = await carregarPlanos();
    alvo.replaceChildren(...planos.map(cartaoMetadado));
    erroEl.textContent = "";
    metadadosPreenchidos = true;
  } catch {
    erroEl.textContent = "Não foi possível carregar os dados dos planos agora.";
  }
}

function cartaoMetadado(plano: Plano): HTMLElement {
  const div = criarDiv("meta-cartao");
  const h3 = document.createElement("h3");
  h3.textContent = plano.candidato;
  div.append(h3);

  const lista = document.createElement("dl");
  lista.append(campo2("Versão", plano.versao));
  lista.append(campo2("Data da coleta do texto", plano.data_coleta));
  div.append(lista);

  const p = document.createElement("p");
  const a = document.createElement("a");
  a.href = plano.url_pdf;
  a.textContent = "Abrir o PDF oficial (nova aba)";
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  p.append(a);
  div.append(p);
  return div;
}

function campo2(rotulo: string, valor: string): HTMLElement {
  const frag = document.createDocumentFragment();
  const dt = document.createElement("dt");
  dt.textContent = rotulo;
  const dd = document.createElement("dd");
  dd.textContent = valor;
  frag.append(dt, dd);
  const wrapper = document.createElement("div");
  wrapper.append(frag);
  return wrapper;
}

function criarDiv(className: string): HTMLDivElement {
  const div = document.createElement("div");
  div.className = className;
  return div;
}

/* ---------------- Execução do roteamento ---------------- */

function executarRota(): void {
  // Âncoras internas (ex.: "pular para o conteúdo") não trocam de vista.
  if (location.hash && !location.hash.startsWith("#/")) return;

  const rota = lerRota();
  if (rota.nome === "resultados" && rota.q) {
    void exibirResultados(rota.q);
  } else if (rota.nome === "sobre") {
    mostrarVista("sobre");
    void preencherMetadados();
    if (!primeiraExecucao) focarTitulo("sobre");
  } else {
    mostrarVista("inicio");
    if (!primeiraExecucao) focarTitulo("inicio");
  }
  primeiraExecucao = false;
}

window.addEventListener("hashchange", executarRota);
executarRota();

/* ---------------- PWA (apenas na versão publicada) ---------------- */

if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {
      // Sem service worker o app continua funcionando, apenas sem cache offline.
    });
  });
}
