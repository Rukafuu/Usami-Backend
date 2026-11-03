# Usami Backend (Usami-Backend)

Aplicação **Ruby on Rails 8** e **Cloudflare Worker** do site institucional da **Usami** e do sistema **Fuwarch Linux**.

## O que esta camada contém

- pp/controllers, pp/models, pp/views, pp/helpers — Renderização clássica acessível (SSR) nos 4 idiomas (pt, en, es, ja), endpoints de consentimento LGPD (/consentimento), políticas legais (/privacidade, /cookies), FAQ (/perguntas), Evidências (/evidencias), Galeria (/galeria), SEO (/robots.txt, /sitemap.xml, /llms.txt), Open Graph 1200×630 e payload /os.json.
- pp/models/assistant/ & pp/controllers/assistant_controller.rb — Orquestração da assistente **Usami** via API da NVIDIA com orçamento por IP/dia, escopo restrito aos fatos verificados (Assistant::Knowledge) e proteção CSRF/Rack::Attack.
- config/content/ — Fonte única da verdade em YAML (site.yml, services.yml, ledger.yml, legal.yml, aq.yml, gallery.yml e entries/*.yml).
- cloudflare/ & script/export_static.rb — Exportador estático e Cloudflare Worker para deploy na borda.
- in/og-images — Gerador dos cartões Open Graph 1200×630 em public/og/.
- 	est/ — Suíte de integração e modelos Minitest (67 testes / 751 asserções).

## Repositórios Relacionados

- [Rukafuu/Usami-Frontend](https://github.com/Rukafuu/Usami-Frontend) — Shell interativa Fuwarch Linux (React 19 + TypeScript + Vite).
- [Rukafuu/Usami-Design-System](https://github.com/Rukafuu/Usami-Design-System) — Tokens Coffee & Cream, estilos e identidade visual.
