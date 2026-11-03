class GalleryController < ApplicationController
  # Classic-page twin of the Gallery app: the same media, with real alt text.
  def index
    @items = Content::Store.gallery.map do |m|
      entry = Content::Store.entries.find { |e| e.id == m["entry"] }
      { media: m, caption: Content.localize(m["caption"], I18n.locale).value, entry: entry }
    end
  end
end
