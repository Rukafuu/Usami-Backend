require "test_helper"

class ContentTest < ActiveSupport::TestCase
  LOCALES = %w[pt en es ja].freeze

  test "every entry has a description in every language" do
    Content::Store.entries.each do |entry|
      LOCALES.each do |locale|
        assert Content.localize(entry.instance_variable_get(:@description), locale).translated,
               "#{entry.id} has no #{locale} description"
      end
    end
  end

  test "entries belong to known folders and have unique ids" do
    entries = Content::Store.entries
    assert_equal entries.map(&:id).uniq.size, entries.size
    assert (entries.map(&:folder).uniq - Content::Store::FOLDERS).empty?
  end

  test "every source link is https (the contact email is the one mailto:)" do
    urls = Content::Store.entries.flat_map { |e| e.sources.map(&:url) } +
           Content::Store.ledger.filter_map(&:url)
    assert urls.all? { |u| u.start_with?("https://") || u == "mailto:#{Content::Store.site["contact"]["email"]}" }
  end

  test "every ledger item has a claim in every language and a verification date" do
    Content::Store.ledger.each do |item|
      LOCALES.each { |l| assert item.claim[l].present?, "#{item.source} lacks #{l} claim" }
      assert_kind_of Date, item.verified_on
    end
  end

  test "localize falls back to English and flags it" do
    result = Content.localize({ "en" => "hello", "pt" => "olá" }, "ja")
    assert_equal "hello", result.value
    assert_not result.translated
  end

  test "in-development status is kept for the companion" do
    assert_equal "in_development", Content::Store.find!("sistemas", "usami").status
  end

  test "entries follow the narrative order, not the alphabet" do
    assert_equal %w[lira hane usami enois], Content::Store.entries_in("sistemas").map(&:id)
    assert_equal %w[lucas ledger contact], Content::Store.entries_in("empresa").map(&:id)
  end

  test "unknown entries raise NotFound" do
    assert_raises(Content::NotFound) { Content::Store.find!("sistemas", "nope") }
  end
end
