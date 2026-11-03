class GalleryController < ApplicationController
  # Classic-page twin of the Gallery app: the same media in one section per project, with real alt text.
  def index
    items = Content::Store.gallery.map do |m|
      entry = Content::Store.entries.find { |e| e.id == m["entry"] }
      { media: m, caption: Content.localize(m["caption"], I18n.locale).value, entry: entry }
    end
    # Projects in the order of the site (not the order the images were added).
    @folders = Content::Store.entries.filter_map do |entry|
      mine = items.select { |i| i[:entry]&.id == entry.id }
      { entry: entry, items: mine } if mine.any?
    end
  end
end
