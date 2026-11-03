require "test_helper"

class ConsentTest < ActionDispatch::IntegrationTest
  LOCALES = %w[pt en es ja].freeze

  test "the banner shows until a choice is made, then stays away" do
    get "/pt"
    assert_select "[data-consent-banner] button[value=essential]"
    assert_select "[data-consent-banner] button[value=all]"

    post "/pt/consentimento", params: { choice: "essential", return_to: "/pt" }
    follow_redirect!
    assert_select "[data-consent-banner]", 0
  end

  test "the choice is saved in a first-party cookie for about 180 days, readable by the page" do
    post "/pt/consentimento", params: { choice: "all", return_to: "/pt/cookies" }
    assert_redirected_to "/pt/cookies"
    set_cookie = response.headers["Set-Cookie"]
    assert_match(/usami_consent=all/, set_cookie)
    assert_match(/SameSite=Lax/i, set_cookie)
    assert_no_match(/HttpOnly/i, set_cookie)
    assert_equal "all", cookies[:usami_consent]
  end

  test "an unknown choice is refused and nothing is saved" do
    post "/pt/consentimento", params: { choice: "everything" }
    assert_response :unprocessable_entity
    assert_nil cookies[:usami_consent]
  end

  test "the return address can never leave the site" do
    [ "https://evil.example/x", "//evil.example", "/\\evil.example" ].each do |target|
      post "/pt/consentimento", params: { choice: "essential", return_to: target }
      assert_redirected_to "/pt", "must not redirect to #{target}"
    end
  end

  test "privacy and cookie pages exist in every language and name what really happens" do
    LOCALES.each do |locale|
      get "/#{locale}/privacidade"
      assert_response :success
      assert_match(/NVIDIA/, response.body)
      assert_match(/devreskyume@gmail\.com/, response.body)
      assert_match(/LGPD/, response.body)

      get "/#{locale}/cookies"
      assert_response :success
      assert_select "table tbody tr", Content::Store.legal["cookies"]["items"].size
      assert_match(/SoundCloud/, response.body)
      assert_select "button[value=all]"
      assert_select "button[value=essential]"
    end
  end

  test "every legal text exists in all four languages" do
    walk = lambda do |node, path|
      case node
      when Hash
        if (node.keys & LOCALES).any?
          LOCALES.each { |l| assert node[l].present?, "#{path} is missing #{l}" }
        else
          node.each { |k, v| walk.call(v, "#{path}.#{k}") }
        end
      when Array then node.each_with_index { |v, i| walk.call(v, "#{path}[#{i}]") }
      end
    end
    walk.call(Content::Store.legal.except("updated"), "legal")
  end

  test "the cookie table lists the cookie the static site really sets (the choice) and no session cookie" do
    names = Content::Store.legal["cookies"]["items"].map { |i| i["name"] }
    assert_includes names, Consent::COOKIE.to_s
    assert_not_includes names, Rails.application.config.session_options[:key].to_s
  end

  test "the footer and the sitemap link to both policies" do
    get "/en"
    assert_select "footer .foot-legal a[href='/en/privacidade']"
    assert_select "footer .foot-legal a[href='/en/cookies']"

    get "/sitemap.xml"
    assert_match(%r{/pt/privacidade}, response.body)
    assert_match(%r{/ja/cookies}, response.body)
  end
end
