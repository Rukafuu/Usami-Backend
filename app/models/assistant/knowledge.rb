module Assistant
  # Everything Usami may say about the company, built only from config/content/*.yml
  # (the same files the site renders). Nothing here is written by hand or invented at runtime.
  class Knowledge
    LOCALES = %w[pt en es ja].freeze

    def initialize(locale, store: Content::Store)
      @locale = locale.to_s
      @store = store
    end

    def to_text
      [ company, services, faq, systems, ledger ].join("\n\n")
    end

    private

    def company
      site = @store.site
      founder = site["founder"]
      <<~TEXT.strip
        ## Company
        Name: #{site["name"]}. Emulated system shown on this website: #{site["os_name"]} (not a real distribution yet; a real one is only planned).
        Founder: #{founder["name"]} (online aliases: #{Array(founder["aliases"]).join(", ")}). GitHub: #{founder["github"]}
        Headline: #{localize(site["headline"])}
        About: #{localize(site["description"])}
      TEXT
    end

    def services
      lines = Array(@store.services).map { |s| "- #{localize(s["title"])}: #{localize(s["text"])}" }
      "## What the company offers\n#{lines.join("\n")}"
    end

    def faq
      lines = Array(@store.faq).map { |i| "Q: #{localize(i["q"])}\nA: #{localize(i["a"])}" }
      "## Frequently asked questions (answer these the same way)\n#{lines.join("\n\n")}"
    end

    def systems
      blocks = @store.entries.map do |e|
        data = e.as_os_json(@locale)
        out = [ "### #{data[:filename]} (id: #{data[:id]}, folder: #{data[:folder]}, status: #{data[:status]})", data[:description].to_s ]
        out << "Stack: #{data[:stack].join(", ")}" if data[:stack].any?
        out << "Proven (backed by the sources): #{data[:proven].join("; ")}" if data[:proven].any?
        out << "Planned (NOT built yet): #{data[:planned].join("; ")}" if data[:planned].any?
        out << "Sources: #{data[:sources].map { |s| "#{s[:label]} <#{s[:url]}>" }.join(", ")}" if data[:sources].any?
        out.join("\n")
      end
      "## Projects and folders\n#{blocks.join("\n\n")}"
    end

    def ledger
      lines = @store.ledger.map { |i| "- #{i.claim} [source: #{i.source}#{" <#{i.url}>" if i.url}, verified #{i.verified_on}]" }
      "## Evidence ledger (claims with a source)\n#{lines.join("\n")}"
    end

    def localize(hash) = Content.localize(hash, @locale).value.to_s
  end
end
