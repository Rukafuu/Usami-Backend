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
        "image" => founder_photo_url,
        "sameAs" => [ founder["github"], contact["linkedin"], contact["enois"], contact["soundcloud"] ]
      }.compact,
      "email" => contact["email"],
      "contactPoint" => {
        "@type" => "ContactPoint",
        "contactType" => "customer support",
        "email" => contact["email"],
        "telephone" => contact["whatsapp"],
        "availableLanguage" => %w[pt en es ja]
      }
    }.to_json
  end

  def founder_entry = Content::Store.entries.find { |e| e.photo }
  def founder_photo_url = founder_entry && "#{request.base_url}#{founder_entry.photo["src"]}"

  # The person behind the company, for the founder's own page: the portrait is what lets search engines tie the name to a face.
  def person_json_ld(entry)
    founder = site["founder"]
    {
      "@context" => "https://schema.org",
      "@type" => "Person",
      "name" => founder["name"],
      "alternateName" => founder["aliases"],
      "image" => "#{request.base_url}#{entry.photo["src"]}",
      "jobTitle" => entry.title(I18n.locale).split(" — ").last,
      "description" => meta_description(entry.about(I18n.locale).first, limit: 300),
      "worksFor" => { "@type" => "Organization", "name" => site["name"] },
      "sameAs" => [ founder["github"], contact["linkedin"], contact["enois"], contact["soundcloud"] ]
    }.to_json
  end

  # Visible trail ("Início / Sistemas / hane.core") plus the matching BreadcrumbList for search engines.
  # `crumbs` are [label, url] pairs; the last one is the current page and is not a link.
  def breadcrumbs(*crumbs)
    trail = [ [ t("nav.home"), home_url ], *crumbs ]
    links = trail.each_with_index.map do |(label, url), i|
      i == trail.size - 1 ? tag.span(label, aria: { current: "page" }) : link_to(label, url)
    end
    json = {
      "@context" => "https://schema.org",
      "@type" => "BreadcrumbList",
      "itemListElement" => trail.each_with_index.map { |(label, url), i| { "@type" => "ListItem", "position" => i + 1, "name" => label, "item" => url } }
    }
    tag.nav(safe_join(links, " / "), class: "mono crumbs", aria: { label: t("nav.breadcrumbs") }) +
      tag.script(json.to_json.html_safe, type: "application/ld+json")
  end

  def faq_json_ld(items)
    {
      "@context" => "https://schema.org",
      "@type" => "FAQPage",
      "mainEntity" => items.map do |item|
        { "@type" => "Question", "name" => localized(item["q"]), "acceptedAnswer" => { "@type" => "Answer", "text" => localized(item["a"]) } }
      end
    }.to_json
  end

  # Social preview image: a 1200×630 card per entry when one was generated (bin/og-images), the brand card otherwise.
  def og_image_url
    path = content_for?(:og_image) ? content_for(:og_image) : "/og/default.png"
    "#{request.base_url}#{path}"
  end

  # Cloudflare Web Analytics: cookieless, but the cookie policy promises any measurement only runs with "Allow all".
  def analytics_token = ENV["CF_ANALYTICS_TOKEN"].presence
  def analytics_enabled? = analytics_token.present? && consent_choice == "all"

  # Icon of a contact channel: a line icon that follows the text colour (CSS mask), or Énois' own favicon.
  def channel_icon(icon)
    return if icon.blank?
    return image_tag("/brand/channels/enois.ico", class: "ch-icon ch-icon--img", alt: "", width: 18, height: 18) if icon == "enois"

    # One CSS class per icon: the site's CSP forbids inline style attributes.
    tag.span(class: "ch-icon ch-icon--#{icon}", aria: { hidden: true })
  end

  def contact = site["contact"]
  def whatsapp_url = "https://wa.me/#{contact["whatsapp"].delete("^0-9")}"
  def whatsapp_label = contact["whatsapp"].sub(/\A\+55(\d{2})(\d{5})(\d{4})\z/, "+55 \\1 \\2-\\3")

  # Search results show about 155 characters: cut at a word boundary instead of in the middle of a word.
  def meta_description(text, limit: 155)
    text = text.to_s.squish
    return text if text.length <= limit

    "#{text[0, limit].sub(/\s+\S*\z/, "").sub(/[\s,;:—-]+\z/, "")}…"
  end

  def localized(hash) = Content.localize(hash, I18n.locale).value
end
