require "test_helper"
require "tmpdir"

class StaticSiteTest < ActiveSupport::TestCase
  ORIGIN = "https://usami.example.dev".freeze

  # Rendering every page in four languages takes a while, so the site is built once for the whole class.
  DIR = Dir.mktmpdir("usami-site")
  PROMPTS = File.join(DIR, "prompts.json")
  SITE = StaticSite.new(out: File.join(DIR, "site"), origin: ORIGIN, copy_assets: false, prompts_path: PROMPTS).build
  Minitest.after_run { FileUtils.rm_rf(DIR) }

  setup do
    @out = Pathname(DIR).join("site")
    @prompts = PROMPTS
  end
  test "maps addresses to files the static host serves without trailing slashes" do
    assert_equal "pt.html", StaticSite.file_for("/pt")
    assert_equal "pt/sistemas/lira.html", StaticSite.file_for("/pt/sistemas/lira")
    assert_equal "pt/os.json", StaticSite.file_for("/pt/os.json")
  end

  test "writes every page in every language, the OS data, sitemap, robots and a 404" do
    %w[pt en es ja].each do |l|
      %w[.html].each do
        assert @out.join("#{l}.html").exist?, "#{l} home"
        assert @out.join("#{l}/privacidade.html").exist?
        assert @out.join("#{l}/cookies.html").exist?
        assert @out.join("#{l}/evidencias.html").exist?
        assert @out.join("#{l}/galeria.html").exist?
        assert @out.join("#{l}/os.json").exist?
      end
      Content::Store::FOLDERS.each { |f| assert @out.join("#{l}/#{f}.html").exist?, "#{l} #{f}" }
    end
    assert @out.join("pt/sistemas/lira.html").exist?
    assert @out.join("404.html").exist?
    assert_includes @out.join("sitemap.xml").read, "#{ORIGIN}/pt/privacidade"
    assert_includes @out.join("robots.txt").read, "#{ORIGIN}/sitemap.xml"
  end

  test "pages point to the public address and carry no per-visitor tokens" do
    html = @out.join("en.html").read
    assert_includes html, %(<link rel="canonical" href="#{ORIGIN}/en">)
    assert_match(%r{og:image" content="#{Regexp.escape(ORIGIN)}/}, html)
    assert_not_includes html, "csrf-token"
    assert_not_includes html, "authenticity_token"
  end

  test "the cookie banner and the contact are in the files" do
    html = @out.join("pt.html").read
    assert_includes html, "data-consent-banner"
    assert_includes html, "mailto:devreskyume@gmail.com"
  end

  test "the security headers are exported for the static host" do
    headers = @out.join("_headers").read
    assert_includes headers, "Content-Security-Policy: default-src 'self'"
    assert_includes headers, "frame-ancestors 'none'"
    assert_includes headers, "/vite/*"
  end

  test "the assistant's prompts come from the same content, one per language" do
    prompts = JSON.parse(File.read(@prompts))
    assert_equal %w[pt en es ja].sort, prompts.keys.sort
    assert_includes prompts["pt"], "Lucas Frischeisen"
    assert_includes prompts["ja"], "Japanese"
  end
end
