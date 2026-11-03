class SeoController < ApplicationController
  skip_before_action :set_locale

  def robots
    render plain: "User-agent: *\nAllow: /\n\nSitemap: #{request.base_url}/sitemap.xml\n"
  end

  def sitemap
    @urls = I18n.available_locales.flat_map do |locale|
      base = [ home_url(locale: locale), evidence_url(locale: locale), gallery_url(locale: locale) ]
      folders = Content::Store::FOLDERS.map { |f| folder_url(locale: locale, folder: f) }
      entries = Content::Store.entries.reject(&:route).map { |e| entry_url(locale: locale, folder: e.folder, slug: e.id) }
      base + folders + entries
    end
  end
end
