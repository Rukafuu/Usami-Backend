module Content
  # Single source of truth for everything the site (and the assistant) states.
  # Reads config/content/*.yml; nothing here is invented at runtime.
  class Store
    ROOT = Rails.root.join("config/content")
    FOLDERS = %w[sistemas contribuicoes laboratorio empresa].freeze
    LedgerItem = Data.define(:claim, :source, :url, :verified_on)

    class << self
      def site = @site ||= load_yaml("site.yml")

      def entries
        @entries ||= Dir[ROOT.join("entries/*.yml")].map { |f| Entry.new(YAML.safe_load_file(f)) }.sort_by { |e| [ e.order, e.id ] }
      end

      def entries_in(folder) = entries.select { |e| e.folder == folder }

      def find!(folder, id)
        entries.find { |e| e.folder == folder && e.id == id } or raise NotFound
      end

      def ledger
        @ledger ||= load_yaml("ledger.yml").map do |row|
          LedgerItem.new(row["claim"], row["source"], row["url"], row["verified_on"])
        end
      end

      def legal = @legal ||= load_yaml("legal.yml")
      def services = @services ||= load_yaml("services.yml")
      def gallery = @gallery ||= Array(load_yaml("gallery.yml"))
      def faq = @faq ||= Array(load_yaml("faq.yml"))

      def reset! = (@site = @entries = @ledger = @services = @gallery = @legal = @faq = nil)

      private

      def load_yaml(name) = YAML.safe_load_file(ROOT.join(name), permitted_classes: [ Date ])
    end
  end
end
