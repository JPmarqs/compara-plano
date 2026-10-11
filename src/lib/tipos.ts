/** Formato esperado dos planos (extração literal dos PDFs oficiais do TSE). */
export interface PaginaPlano {
  numero: number;
  texto: string;
}

export interface Plano {
  candidato: string;
  versao: string;
  data_coleta: string;
  url_pdf: string;
  paginas: PaginaPlano[];
}
