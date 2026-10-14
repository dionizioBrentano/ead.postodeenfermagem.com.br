import type { SugestaoPreparo } from "../api/ead";

export interface SugestaoPreparoComCamposInternos extends SugestaoPreparo {
  fonte: string;
  observacao: string;
}

export const ANOTACAO_INTERNA = "ANOTACAO-INTERNA-NAO-EXIBIR";

/**
 * Catálogo de teste com os 16 medicamentos de referência do seeder da API
 * (EadMedicamentoReferenciaSeeder.php) mais o item pediátrico usado nos testes de faixa etária.
 */
export const CATALOGO_TESTE_COMPLETO: SugestaoPreparoComCamposInternos[] = [
  // Item pediátrico para teste de seleção por idade
  {
    id: "cat-dipirona-ped-gotas",
    nome: "Dipirona",
    apresentacao: "500 mg/mL solução oral em gotas",
    faixa_etaria: "pediatrico",
    via_preferencial: "VO",
    preparo: "Diluir as gotas em água filtrada",
    tempo_administracao: "Imediato",
    fonte: ANOTACAO_INTERNA,
    observacao: ANOTACAO_INTERNA,
  },
  // 1. Ceftriaxona
  {
    id: "cat-ceftriaxona-adulto",
    nome: "Ceftriaxona",
    apresentacao: "1 g pó liofilizado",
    faixa_etaria: "adulto",
    via_preferencial: "EV",
    preparo: "Reconstituir em 10 mL de AD e diluir em 100 mL de SF 0,9%",
    tempo_administracao: "30 min",
    fonte: ANOTACAO_INTERNA,
    observacao: ANOTACAO_INTERNA,
  },
  // 2. Cefazolina
  {
    id: "cat-cefazolina-adulto",
    nome: "Cefazolina",
    apresentacao: "1 g pó para solução injetável",
    faixa_etaria: "adulto",
    via_preferencial: "EV",
    preparo: "Reconstituir em 10 mL de AD e diluir em 100 mL de SF 0,9%",
    tempo_administracao: "30 min",
    fonte: ANOTACAO_INTERNA,
    observacao: ANOTACAO_INTERNA,
  },
  // 3. Meropenem
  {
    id: "cat-meropenem-adulto",
    nome: "Meropenem",
    apresentacao: "1 g pó liofilizado",
    faixa_etaria: "adulto",
    via_preferencial: "EV",
    preparo: "Reconstituir com 20 mL de AD; diluir em 100 mL de SF 0,9%",
    tempo_administracao: "30 minutos",
    fonte: ANOTACAO_INTERNA,
    observacao: ANOTACAO_INTERNA,
  },
  // 4. Vancomicina
  {
    id: "cat-vancomicina-adulto",
    nome: "Vancomicina",
    apresentacao: "500 mg pó liofilizado",
    faixa_etaria: "adulto",
    via_preferencial: "EV",
    preparo: "Reconstituir com 10 mL de AD; diluir em 100 a 200 mL de SF 0,9%",
    tempo_administracao: "60 minutos",
    fonte: ANOTACAO_INTERNA,
    observacao: ANOTACAO_INTERNA,
  },
  // 5. Metronidazol
  {
    id: "cat-metronidazol-adulto",
    nome: "Metronidazol",
    apresentacao: "500 mg/100 mL bolsa plástica",
    faixa_etaria: "adulto",
    via_preferencial: "EV",
    preparo: "Pronto para uso",
    tempo_administracao: "60 min",
    fonte: ANOTACAO_INTERNA,
    observacao: ANOTACAO_INTERNA,
  },
  // 6. Ciprofloxacino
  {
    id: "cat-ciprofloxacino-adulto",
    nome: "Ciprofloxacino",
    apresentacao: "2 mg/mL (200 mg/100 mL) bolsa",
    faixa_etaria: "adulto",
    via_preferencial: "EV",
    preparo: "Pronto para uso (não necessita reconstituição)",
    tempo_administracao: "60 minutos",
    fonte: ANOTACAO_INTERNA,
    observacao: ANOTACAO_INTERNA,
  },
  // 7. Piperacilina + Tazobactam
  {
    id: "cat-piperacilina-tazobactam-adulto",
    nome: "Piperacilina + Tazobactam",
    apresentacao: "4 g + 0,5 g pó liofilizado",
    faixa_etaria: "adulto",
    via_preferencial: "EV",
    preparo: "Reconstituir em 20 mL de AD e diluir em 100 mL de SF 0,9%",
    tempo_administracao: "30 min",
    fonte: ANOTACAO_INTERNA,
    observacao: ANOTACAO_INTERNA,
  },
  // 8. Ampicilina + Sulbactam
  {
    id: "cat-ampicilina-sulbactam-adulto",
    nome: "Ampicilina + Sulbactam",
    apresentacao: "1,5 g pó liofilizado",
    faixa_etaria: "adulto",
    via_preferencial: "EV",
    preparo: "Reconstituir com 3,2 mL de AD; diluir em 100 mL de SF 0,9%",
    tempo_administracao: "15 a 30 minutos",
    fonte: ANOTACAO_INTERNA,
    observacao: ANOTACAO_INTERNA,
  },
  // 9. Dipirona (EV adulto)
  {
    id: "cat-dipirona-adulto",
    nome: "Dipirona",
    apresentacao: "500 mg/mL ampola 2 mL",
    faixa_etaria: "adulto",
    via_preferencial: "EV",
    preparo: "Diluir em 20 mL de SF 0,9%",
    tempo_administracao: "10 min",
    fonte: ANOTACAO_INTERNA,
    observacao: ANOTACAO_INTERNA,
  },
  // 10. Ondansetrona
  {
    id: "cat-ondansetrona-adulto",
    nome: "Ondansetrona",
    apresentacao: "2 mg/mL ampola 4 mL",
    faixa_etaria: "adulto",
    via_preferencial: "EV",
    preparo: "Diluir em 50 mL de SF 0,9%",
    tempo_administracao: "15 min",
    fonte: ANOTACAO_INTERNA,
    observacao: ANOTACAO_INTERNA,
  },
  // 11. Tramadol
  {
    id: "cat-tramadol-adulto",
    nome: "Tramadol",
    apresentacao: "50 mg/mL ampola 2 mL",
    faixa_etaria: "adulto",
    via_preferencial: "EV",
    preparo: "Diluir em 100 mL de SF 0,9%",
    tempo_administracao: "30 min",
    fonte: ANOTACAO_INTERNA,
    observacao: ANOTACAO_INTERNA,
  },
  // 12. Omeprazol
  {
    id: "cat-omeprazol-adulto",
    nome: "Omeprazol",
    apresentacao: "40 mg pó liofilizado",
    faixa_etaria: "adulto",
    via_preferencial: "EV",
    preparo: "Reconstituir no diluente próprio",
    tempo_administracao: "5 min",
    fonte: ANOTACAO_INTERNA,
    observacao: ANOTACAO_INTERNA,
  },
  // 13. Hidrocortisona
  {
    id: "cat-hidrocortisona-adulto",
    nome: "Hidrocortisona",
    apresentacao: "500 mg pó liofilizado",
    faixa_etaria: "adulto",
    via_preferencial: "EV",
    preparo: "Reconstituir em 5 mL de AD e diluir em 50 mL de SF 0,9%",
    tempo_administracao: "15 min",
    fonte: ANOTACAO_INTERNA,
    observacao: ANOTACAO_INTERNA,
  },
  // 14. Furosemida
  {
    id: "cat-furosemida-adulto",
    nome: "Furosemida",
    apresentacao: "10 mg/mL ampola 2 mL",
    faixa_etaria: "adulto",
    via_preferencial: "EV",
    preparo: "Pode ser administrada sem diluir ou diluída em SF 0,9%",
    tempo_administracao: "2 min",
    fonte: ANOTACAO_INTERNA,
    observacao: ANOTACAO_INTERNA,
  },
  // 15. Enoxaparina
  {
    id: "cat-enoxaparina-adulto",
    nome: "Enoxaparina",
    apresentacao: "40 mg/0,4 mL seringa preenchida",
    faixa_etaria: "adulto",
    via_preferencial: "SC",
    preparo: "Pronto para uso",
    tempo_administracao: "Aplicação subcutânea",
    fonte: ANOTACAO_INTERNA,
    observacao: ANOTACAO_INTERNA,
  },
  // 16. Insulina regular
  {
    id: "cat-insulina-regular-adulto",
    nome: "Insulina regular",
    apresentacao: "100 UI/mL frasco-ampola",
    faixa_etaria: "adulto",
    via_preferencial: "SC",
    preparo: "Aspirar em seringa própria de insulina",
    tempo_administracao: "Aplicação subcutânea",
    fonte: ANOTACAO_INTERNA,
    observacao: ANOTACAO_INTERNA,
  },
];
