module Content
  class NotFound < StandardError; end

  # Picks the text for a locale, falling back to English, then Portuguese.
  # `translated` is false when a fallback was used so views can say so.
  Localized = Data.define(:value, :translated)

  def self.localize(hash, locale)
    hash ||= {}
    locale = locale.to_s
    return Localized.new(hash[locale], true) if hash[locale].present?

    fallback = %w[en pt].find { |l| hash[l].present? }
    Localized.new(fallback ? hash[fallback] : nil, false)
  end
end
