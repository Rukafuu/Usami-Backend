Rails.application.routes.draw do
  get "up" => "rails/health#show", as: :rails_health_check
  get "robots.txt" => "seo#robots", defaults: { format: :text }
  get "sitemap.xml" => "seo#sitemap", defaults: { format: :xml }
  get "llms.txt" => "seo#llms", defaults: { format: :text }

  root "locales#redirect"

  scope ":locale", locale: /pt|en|es|ja/ do
    get "/", to: "pages#home", as: :home
    post "assistant", to: "assistant#create", as: :assistant
    get "os.json", to: "os#show", as: :os, defaults: { format: :json }
    get "evidencias", to: "evidence#index", as: :evidence
    get "galeria", to: "gallery#index", as: :gallery
    get "perguntas", to: "faq#index", as: :faq
    get "contato", to: "contact#new", as: :contact
    post "contato", to: "contact#create"
    get "obrigado", to: "contact#thanks", as: :thanks
    get "privacidade", to: "legal#privacy", as: :privacy
    get "cookies", to: "legal#cookies_policy", as: :cookies_policy
    post "consentimento", to: "consent#create", as: :consent
    get ":folder", to: "folders#show", as: :folder, constraints: { folder: /sistemas|contribuicoes|laboratorio|empresa/ }
    get ":folder/:slug", to: "entries#show", as: :entry, constraints: { folder: /sistemas|contribuicoes|laboratorio|empresa/ }
    get "erro/:code", to: "errors#show", as: :error, constraints: { code: /402|403|404|500/ }
  end

  match "*unmatched", to: "errors#not_found", via: :all
end
