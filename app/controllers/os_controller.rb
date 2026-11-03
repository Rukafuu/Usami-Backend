class OsController < ApplicationController
  # Everything the UsamiOS shell needs for one language, in one cacheable document.
  def show
    payload = {
      locale: I18n.locale,
      site: {
        name: site["name"],
        osName: site["os_name"],
        founderBirthday: site.dig("founder", "birthday"),
        headline: localized_site("headline"),
        description: localized_site("description"),
        pillars: site["pillars"].map { |p| { title: localize(p["title"]), text: localize(p["text"]) } }
      },
      ui: %w[shell apps entry status folders evidence nav terminal eggs consent].index_with { |key| I18n.t(key) },
      folders: Content::Store::FOLDERS,
      entries: Content::Store.entries.map { |e| e.as_os_json(I18n.locale) },
      ledger: Content::Store.ledger.map do |item|
        { claim: localize(item.claim), source: item.source, url: item.url, verifiedOn: item.verified_on.iso8601 }
      end,
      services: Content::Store.services.map { |s| { title: localize(s["title"]), text: localize(s["text"]) } },
      gallery: Content::Store.gallery.map do |m|
        { id: m["id"], entry: m["entry"], kind: m["kind"], src: m["src"], thumb: m["thumb"],
          placeholder: m["placeholder"] == true, caption: localize(m["caption"]) }
      end,
      system: Content::SystemInfo.call
    }
    return unless stale?(etag: payload, public: true)

    render json: payload
  end

  private

  def localize(hash) = Content.localize(hash, I18n.locale).value
end
