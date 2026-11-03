Rails.application.routes.draw do
  get "up" => "rails/health#show", as: :rails_health_check
  get "robots.txt" => "seo#robots", defaults: { format: :text }
  get "sitemap.xml" => "seo#sitemap", defaults: { format: :xml }

  root "locales#redirect"

  scope ":locale", locale: /pt|en|es|ja/ do
    get "/", to: "pages#home", as: :home
    post "assistant", to: "assistant#create", as: :assistant
    get "os.json", to: "os#show", as: :os, defaults: { format: :json }
    get "evidencias", to: "evidence#index", as: :evidence
    get "galeria", to: "gallery#index", as: :gallery
    get ":folder", to: "folders#show", as: :folder, constraints: { folder: /sistemas|contribuicoes|laboratorio|empresa/ }
    get ":folder/:slug", to: "entries#show", as: :entry, constraints: { folder: /sistemas|contribuicoes|laboratorio|empresa/ }
  end

  match "*unmatched", to: "errors#not_found", via: :all
end
