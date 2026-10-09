# projeto/ead.md — Sala EAD do Curso Técnico em Enfermagem

## Produto

- Aplicação de página única em `ead.postodeenfermagem.com.br`.
- Papéis: aluno, docente e administrador, vindos dos vínculos da pessoa com a organização na API.
- A API é a fonte única de verdade. O navegador guarda só rascunho em andamento.
- Login pelo login central (`entrar.postodeenfermagem.com.br`).

## Limites clínicos

- O sistema ensina a organizar o cuidado já prescrito. Não cria conduta, dose nem horário que não esteja prescrito ou aprazado.
- Toda conduta de exercício traz a regra de origem: na dúvida, o aluno consulta o enfermeiro.
- Toda correção automática pode ser revista pelo docente, que dá a nota final e comenta a decisão.
- Nenhum dado real de paciente. Prescrições de exercício são fictícias.

## Inventário visual

Fonte: `src/styles.css` (padrão "60plus") e `src/content/guia.css`. Nada fora desta lista é criado sem autorização.

- Variáveis CSS: --accent, --accent-ink, --action, --action-ink, --bg, --c1, --c1s, --c2, --c2s, --c3, --c3s, --c4, --c4s, --cc, --cs, --err, --errs, --f-body, --f-display, --f-mono, --ink, --line, --muted, --na, --no, --ok, --paper, --sel, --selt
- Classes CSS: .aberto, .acts, .alert, .ativa, .ativo, .auth, .auth-card, .avg, .bar, .beh, .box, .brand, .btn, .btn-ajuda, .btn-ajuda-flutuante, .c, .card, .card-foot, .card-top, .cards, .cell, .chip, .chips, .cycle, .danger, .dot, .dropdown-divider, .dropdown-header, .dropdown-item, .dropdown-item-active, .dropdown-section-title, .dropdown-user-email, .dropdown-user-name, .e, .err, .estrutura-card, .estrutura-card-badge, .estrutura-card-conteudo, .estrutura-card-desc, .estrutura-card-img, .estrutura-card-link, .estrutura-card-overlay, .estrutura-card-titulo, .estrutura-grid, .etapa-corrente-box, .etapa-corrente-rotulo, .etapa-pill, .etapa-tags, .eyebrow, .field, .fields, .fill, .form, .full, .ghost, .group, .guia, .guia-alerta-box, .guia-alerta-tag, .guia-alerta-texto, .guia-apoio-card, .guia-btn-tentar, .guia-btn-voltar, .guia-exemplo-card, .guia-exemplo-texto, .guia-ficha-badge, .guia-ficha-cabecalho, .guia-ficha-card, .guia-ficha-titulo, .guia-fonte-item, .guia-fonte-link, .guia-fonte-texto, .guia-fontes-lista, .guia-header, .guia-header-sub, .guia-header-titulo, .guia-linha-corpo, .guia-linha-item, .guia-linha-lado-direito, .guia-linha-rotulo, .guia-linha-seta, .guia-linha-titulo, .guia-lista-itens, .guia-lista-tabela, .guia-ordem, .guia-passos-ordenados, .guia-root, .guia-secao, .guia-secao-titulo, .guia-status-msg, .guia-subsecao-label, .guia-texto-objetivo, .guia-texto-secundario, .guia-ver-tambem-btn, .guia-ver-tambem-grid, .guia-ver-tambem-seta, .h, .head, .heat, .heat-wrap, .hint, .in, .info, .item, .items, .k1, .k2, .k3, .k4, .l, .label, .lbl, .legend, .legend-cap, .legend-scale, .link, .m, .missing, .modal-backdrop, .modal-box, .modal-close-btn, .modal-header, .mono, .msg, .muted, .n, .na, .narrow, .nav, .num, .o, .page, .prog, .q, .rate, .ref, .rep, .s, .sala-dashboard, .sala-etcr-page, .sala-etcr-root, .sala-hero, .sala-hero-sub, .sala-hero-titulo, .saved, .sec, .sec-head, .seg, .since, .small, .sources, .sq, .sub, .tabs, .tag, .tbl, .toggle, .topbar, .topbar-drawer-backdrop, .topbar-drawer-body, .topbar-drawer-brand, .topbar-drawer-close, .topbar-drawer-group, .topbar-drawer-group-items, .topbar-drawer-group-title, .topbar-drawer-header, .topbar-drawer-item, .topbar-drawer-item-icon, .topbar-drawer-item-label, .topbar-drawer-logo, .topbar-drawer-panel, .topbar-drawer-school, .topbar-drawer-turma-badge, .topbar-ead, .topbar-ead-brand, .topbar-ead-brand-wrap, .topbar-ead-in, .topbar-ead-logo, .topbar-ead-nav, .topbar-ead-school, .topbar-ead-sub, .topbar-ead-titles, .topbar-hamburger-btn, .topbar-menu-btn, .topbar-menu-chevron, .topbar-menu-group, .topbar-submenu, .topbar-submenu-icon, .topbar-submenu-item, .topbar-submenu-label, .topbar-user-avatar, .topbar-user-btn, .topbar-user-chevron, .topbar-user-dropdown, .topbar-user-name, .topbar-user-wrap, .topic, .topics, .track, .two, .warn, .when, .who, .wrap
