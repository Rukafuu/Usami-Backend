require "test_helper"

class FounderTest < ActionDispatch::IntegrationTest
  LOCALES = %w[pt en es ja].freeze

  test "the founder's page shows his portrait and his own words in every language" do
    LOCALES.each do |locale|
      get "/#{locale}/empresa/lucas"
      assert_response :success
      assert_select "figure.portrait img[src='/media/lucas-800.jpg'][alt]"
      assert_select "section.about h2", text: I18n.t("entry.about", locale: locale)
      assert_select "section.about p", 8
    end
    get "/en/empresa/lucas"
    assert_match(/also known as Ruka or Reskyume/, response.body)
  end

  test "the portrait files exist and are small enough for the web" do
    %w[lucas-400.jpg lucas-800.jpg].each do |name|
      path = Rails.public_path.join("media", name)
      assert path.exist?, "#{name} missing"
      assert_operator path.size, :<, 350.kilobytes
    end
  end

  test "structured data ties the name to the portrait" do
    get "/pt/empresa/lucas"
    ld = css_select("script[type='application/ld+json']").map { |s| JSON.parse(s.text) }.find { |j| j["@type"] == "Person" }
    assert_equal "Lucas Frischeisen", ld["name"]
    assert_match(%r{/media/lucas-800\.jpg\z}, ld["image"])
    assert_includes ld["alternateName"], "Ruka"
    assert_equal "Usami", ld["worksFor"]["name"]

    get "/pt"
    org = JSON.parse(css_select("script[type='application/ld+json']").first.text)
    assert_match(%r{/media/lucas-800\.jpg\z}, org["founder"]["image"])
  end

  test "the home page has a short founder card that links to his page" do
    get "/pt"
    assert_select ".founder-card img[alt]"
    assert_select ".founder-card a[href='/pt/empresa/lucas']"
  end

  test "only the founder's entry has a photo or an about text, and every language has all paragraphs" do
    with_photo = Content::Store.entries.select(&:photo)
    assert_equal [ "lucas" ], with_photo.map(&:id)
    counts = LOCALES.map { |l| with_photo.first.about(l).size }
    assert_equal [ 8 ], counts.uniq
    LOCALES.each { |l| assert with_photo.first.photo_alt(l).present? }
  end

  test "the assistant knows his story and labels it as his own words" do
    text = Assistant::Knowledge.new("pt").to_text
    assert_includes text, "the founder's own words"
    assert_includes text, "Ruka ou Reskyume"
  end

  test "the OS data carries the about text and the portrait" do
    get "/en/os.json"
    lucas = JSON.parse(response.body)["entries"].find { |e| e["id"] == "lucas" }
    assert_equal 8, lucas["about"].size
    assert_equal "/media/lucas-400.jpg", lucas["photo"]["small"]
  end
end
