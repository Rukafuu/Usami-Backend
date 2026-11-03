module ApplicationHelper
  LANGUAGE_NAMES = { pt: "Português", en: "English", es: "Español", ja: "日本語" }.freeze
  HTML_LANG = { pt: "pt-BR", en: "en", es: "es", ja: "ja" }.freeze

  def html_lang = HTML_LANG.fetch(I18n.locale)

  def language_name(locale) = LANGUAGE_NAMES.fetch(locale)

  # URL of the current page in another language (same route, different :locale).
  def alternate_url(locale)
    return home_url(locale: locale) if controller_name == "errors"

    url_for(locale: locale, only_path: false)
  end

  def page_title(title = nil)
    [ title, t("site.name") ].compact.join(" — ")
  end

  def organization_json_ld
    founder = site["founder"]
    {
      "@context" => "https://schema.org",
      "@type" => "Organization",
      "name" => site["name"],
      "description" => localized_site("description"),
      "founder" => {
        "@type" => "Person",
        "name" => founder["name"],
        "alternateName" => founder["aliases"],
        "sameAs" => [ founder["github"] ]
      }
    }.to_json
  end

  def localized(hash) = Content.localize(hash, I18n.locale).value
end
