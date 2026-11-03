module Content
  class Entry
    attr_reader :id, :folder, :filename, :status, :route, :stack, :sources, :order

    def initialize(data)
      @id = data.fetch("id")
      @order = data.fetch("order", 99)
      @folder = data.fetch("folder")
      @filename = data.fetch("filename")
      @status = data.fetch("status")
      @route = data["route"]
      @stack = Array(data["stack"])
      @sources = Array(data["sources"]).map { |s| Source.new(s["label"], s["url"], s["icon"], s["detail"]) }
      @title = data["title"] || {}
      @photo = data["photo"]
      @about = data["about"] || {}
      @description = data.fetch("description")
      @proven = data["proven"] || {}
      @planned = data["planned"] || {}
    end

    Source = Data.define(:label, :url, :icon, :detail)

    # Shape consumed by the React shell (and, later, the assistant's knowledge base).
    def as_os_json(locale)
      proven = proven(locale)
      planned = planned(locale)
      {
        id: id, folder: folder, filename: filename, status: status, route: route,
        stack: stack, description: description(locale),
        proven: Array(proven.value), planned: Array(planned.value),
        title: title(locale),
        about: about(locale),
        photo: (@photo && { src: @photo["src"], small: @photo["small"], width: @photo["width"], height: @photo["height"], alt: photo_alt(locale) }),
        listsTranslated: (proven.value.blank? || proven.translated) && (planned.value.blank? || planned.translated),
        sources: sources.map { |s| { label: s.label, url: s.url, icon: s.icon, detail: s.detail }.compact }
      }
    end

    # A descriptive page title ("Hane — agents with a budget and an audit trail"); the file name when none was written.
    # The founder's portrait and his own "about me" text (one string per paragraph), for entries that have them.
    attr_reader :photo
    def about(locale) = Array(Content.localize(@about, locale).value)
    def photo_alt(locale) = @photo && Content.localize(@photo["alt"], locale).value

    def title(locale) = Content.localize(@title, locale).value.presence || filename
    def description(locale) = Content.localize(@description, locale).value
    def proven(locale) = Content.localize(@proven, locale)
    def planned(locale) = Content.localize(@planned, locale)
  end
end
