class SeoController < ApplicationController
  skip_before_action :set_locale

  def robots
    disallowed = I18n.available_locales.flat_map { |l| [ "/#{l}/assistant", "/#{l}/consentimento", "/#{l}/os.json" ] }
    rules = [ "User-agent: *", "Allow: /", *disallowed.map { |p| "Disallow: #{p}" }, "", "Sitemap: #{request.base_url}/sitemap.xml" ]
    render plain: "#{rules.join("\n")}\n"
  end

  def sitemap
    @urls = I18n.available_locales.flat_map do |locale|
      base = [ home_url(locale: locale), evidence_url(locale: locale), gallery_url(locale: locale), faq_url(locale: locale), privacy_url(locale: locale), cookies_policy_url(locale: locale) ]
      folders = Content::Store::FOLDERS.map { |f| folder_url(locale: locale, folder: f) }
      entries = Content::Store.entries.reject(&:route).map { |e| entry_url(locale: locale, folder: e.folder, slug: e.id) }
      base + folders + entries
    end
  end

  def llms
    render plain: Assistant::Knowledge.new(:pt).to_text
  end
end
