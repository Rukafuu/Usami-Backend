require "test_helper"

class NoInlineStylesTest < ActionDispatch::IntegrationTest
  # The site's CSP is "style-src 'self'": an inline style attribute is silently ignored by browsers, so icons and layouts
  # built on one look fine in development (where the CSP is relaxed) and break in production.
  test "pages never use inline style attributes" do
    paths = %w[/pt /en /pt/empresa/contact /pt/empresa/lucas /pt/sistemas/lira /ja/cookies /es/privacidade /pt/perguntas /pt/evidencias /pt/galeria]
    paths.each do |path|
      get path
      assert_response :success
      assert_no_match(/\sstyle="/, response.body, "#{path} has an inline style attribute")
    end
  end

  test "every channel icon has a CSS rule" do
    css = Rails.root.join("app/frontend/styles/main.css").read
    Content::Store.find!("empresa", "contact").sources.filter_map(&:icon).reject { |i| i == "enois" }.each do |icon|
      assert_includes css, ".ch-icon--#{icon}", "no CSS rule for the #{icon} icon"
    end
  end
end
