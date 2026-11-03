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
      paths = [ "/#{locale}", "/#{locale}/evidencias", "/#{locale}/galeria", "/#{locale}/perguntas" ] +
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

  test "pages declare 1200x630 og:image, og:url and Twitter card" do
    get "/pt"
    assert_select "meta[property='og:image'][content$='/og/default.png']"
    assert_select "meta[property='og:image:width'][content='1200']"
    assert_select "meta[property='og:image:height'][content='630']"
    assert_select "meta[property='og:url'][content$='/pt']"
    assert_select "meta[name='twitter:card'][content='summary_large_image']"
    assert_select "meta[name='twitter:image'][content$='/og/default.png']"

    get "/pt/sistemas/hane"
    assert_select "meta[property='og:image'][content$='/og/hane.png']"
    assert_select "meta[property='og:url'][content$='/pt/sistemas/hane']"
  end

  test "inner pages expose a BreadcrumbList schema" do
    get "/pt/sistemas/hane"
    assert_select "nav.crumbs a[href$='/pt']"
    assert_select "nav.crumbs a[href$='/pt/sistemas']"
    assert_select "nav.crumbs span[aria-current='page']", text: "hane.core"
    assert_select "script[type='application/ld+json']" do |tags|
      crumbs = tags.map { |t| JSON.parse(t.text) }.find { |d| d["@type"] == "BreadcrumbList" }
      assert_not_nil crumbs
      assert_equal [ "Início", "Sistemas", "hane.core" ], crumbs["itemListElement"].map { |e| e["name"] }
    end
  end

  test "FAQ page exposes FAQPage schema and feeds the assistant knowledge" do
    get "/pt/perguntas"
    assert_response :success
    assert_select ".faq-item", minimum: 5
    assert_select "script[type='application/ld+json']" do |tags|
      faq = tags.map { |t| JSON.parse(t.text) }.find { |d| d["@type"] == "FAQPage" }
      assert_not_nil faq
      assert_operator faq["mainEntity"].size, :>=, 5
      assert_equal "Question", faq["mainEntity"].first["@type"]
    end
    assert_includes Assistant::Knowledge.new(:pt).to_text, "O que a Usami faz?"
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

  test "sitemap, robots and llms.txt" do
    get "/sitemap.xml"
    assert_response :success
    assert_includes response.body, "/ja/sistemas/usami"
    assert_includes response.body, "/pt/perguntas"

    get "/robots.txt"
    assert_includes response.body, "Sitemap:"
    assert_includes response.body, "Disallow: /pt/assistant"
    assert_includes response.body, "Disallow: /en/os.json"

    get "/llms.txt"
    assert_response :success
    assert_includes response.body, "Usami"
    assert_includes response.body, "hane.core"
  end

  test "Cloudflare Web Analytics only loads when a token is configured and all cookies are allowed" do
    ENV["CF_ANALYTICS_TOKEN"] = "cf-test-token"
    get "/pt"
    assert_select "script[src*='cloudflareinsights']", 0

    post "/pt/consentimento", params: { choice: "all", return_to: "/pt" }
    follow_redirect!
    assert_select "script[src*='cloudflareinsights'][data-cf-beacon*='cf-test-token']", 1
  ensure
    ENV.delete("CF_ANALYTICS_TOKEN")
  end

  test "skip link and landmarks are present" do
    get "/pt"
    assert_select "a.skip[href='#conteudo']"
    assert_select "header nav", 2
    assert_select "main#conteudo"
    assert_select "h1", 1
  end
end
