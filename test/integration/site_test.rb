require "test_helper"

class SiteTest < ActionDispatch::IntegrationTest
  LOCALES = %w[pt en es ja].freeze

  test "root redirects by Accept-Language and defaults to Portuguese" do
    get "/", headers: { "Accept-Language" => "es-AR,es;q=0.9" }
    assert_redirected_to "/es"

    get "/", headers: { "Accept-Language" => "fr-FR" }
    assert_redirected_to "/pt"
  end

  test "every page renders in every language" do
    LOCALES.each do |locale|
      paths = [ "/#{locale}", "/#{locale}/evidencias", "/#{locale}/galeria" ] +
              Content::Store::FOLDERS.map { |f| "/#{locale}/#{f}" } +
              Content::Store.entries.reject(&:route).map { |e| "/#{locale}/#{e.folder}/#{e.id}" }
      paths.each do |path|
        get path
        assert_response :success, "#{path} failed"
      end
    end
  end

  test "the classic gallery page shows real images with alt text and marks videos as coming soon" do
    get "/pt/galeria"
    assert_response :success
    assert_select "img[alt]:not([alt=\"\"])", minimum: 5
    assert_select ".gallery-soon", minimum: 1
    assert_select "video", 0
  end

  test "pages declare language, canonical and alternates" do
    get "/en/sistemas/hane"
    assert_select "html[lang=en]"
    assert_select "link[rel=canonical][href$='/en/sistemas/hane']"
    assert_select "link[rel=alternate][hreflang=ja][href$='/ja/sistemas/hane']"
    assert_select "link[rel=alternate][hreflang=x-default][href$='/pt/sistemas/hane']"
  end

  test "home exposes honest structured data" do
    get "/en"
    assert_select "script[type='application/ld+json']" do |tags|
      data = JSON.parse(tags.first.text)
      assert_equal "Organization", data["@type"]
      assert_equal "Lucas Frischeisen", data.dig("founder", "name")
      assert_includes data.dig("founder", "alternateName"), "Rukafuu"
    end
  end

  test "entry pages separate proven from planned" do
    get "/pt/sistemas/hane"
    assert_select "h2", text: "Provado nos repositórios"
    assert_select "h2", text: "Planejado — ainda não existe"
  end

  test "untranslated lists announce the fallback" do
    get "/ja/sistemas/hane"
    assert_select "p", text: /英語/
  end

  test "the evidence ledger entry redirects to the ledger" do
    get "/pt/empresa/ledger"
    assert_redirected_to "/pt/evidencias"
  end

  test "external links open safely" do
    get "/pt/sistemas/hane"
    assert_select "a[href^='https://github.com'][rel~=noopener][target=_blank]"
  end

  test "unknown pages answer 404 with a helpful page" do
    get "/pt/sistemas/nao-existe"
    assert_response :not_found
    get "/qualquer/coisa"
    assert_response :not_found
  end

  test "sitemap and robots" do
    get "/sitemap.xml"
    assert_response :success
    assert_includes response.body, "/ja/sistemas/usami"
    get "/robots.txt"
    assert_includes response.body, "Sitemap:"
  end

  test "skip link and landmarks are present" do
    get "/pt"
    assert_select "a.skip[href='#conteudo']"
    assert_select "header nav", 2
    assert_select "main#conteudo"
    assert_select "h1", 1
  end
end
