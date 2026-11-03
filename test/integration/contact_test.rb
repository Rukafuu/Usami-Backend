require "test_helper"

class ContactTest < ActionDispatch::IntegrationTest
  test "every channel in site.yml is also listed in contato.msg, so the OS and the classic pages agree" do
    urls = Content::Store.find!("empresa", "contact").sources.map(&:url)
    channels = Content::Store.site["contact"]
    assert_includes urls, "mailto:#{channels["email"]}"
    assert_includes urls, "https://wa.me/#{channels["whatsapp"].delete("^0-9")}"
    %w[linkedin enois soundcloud].each { |key| assert_includes urls, channels[key] }
    assert_includes urls, Content::Store.site["founder"]["github"]
  end

  test "every channel in contato.msg has an icon file that exists" do
    sources = Content::Store.find!("empresa", "contact").sources
    assert sources.all?(&:icon)
    sources.each do |s|
      ext = s.icon == "enois" ? "ico" : "svg"
      assert Rails.root.join("public/brand/channels/#{s.icon}.#{ext}").exist?, "missing icon for #{s.label}"
    end
    get "/pt/empresa/contact"
    assert_select "ul.sources a .ch-icon", sources.size
  end

  test "home has a contact call to action above the fold, a footer list and a phone bar" do
    get "/pt"
    assert_select ".hero .cta a[href^='mailto:devreskyume@gmail.com']"
    assert_select ".hero .cta a[href='https://wa.me/5511981826659']"
    assert_select "footer .foot-contact a", minimum: 5
    assert_select "nav.cta-bar a", 2
    assert_select ".hero .cta-note", text: /72 horas.*Monster/
  end

  test "structured data carries the contact point and profiles" do
    get "/en"
    ld = JSON.parse(css_select("script[type='application/ld+json']").first.text)
    assert_equal "devreskyume@gmail.com", ld["email"]
    assert_equal "ContactPoint", ld["contactPoint"]["@type"]
    assert_includes ld["founder"]["sameAs"], "https://linkedin.com/in/rukafuu"
  end

  test "contact page renders its channels in all four languages" do
    %w[pt en es ja].each do |locale|
      get "/#{locale}/empresa/contact"
      assert_response :success
      assert_select "ul.sources a[href='https://wa.me/5511981826659']"
    end
  end
end
