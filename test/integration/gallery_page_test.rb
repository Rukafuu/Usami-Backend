require "test_helper"

class GalleryPageTest < ActionDispatch::IntegrationTest
  test "the gallery page has one section per project, in the order of the site, and a folder index" do
    %w[pt en es ja].each do |locale|
      get "/#{locale}/galeria"
      assert_response :success
      assert_select "nav.gallery-folders a", minimum: 5
      sections = css_select("section.gallery-folder").map { |s| s["id"] }
      assert_equal sections.uniq, sections
      assert_equal %w[lira hane usami enois liraos audax], sections
      # every index link points at a real section
      css_select("nav.gallery-folders a").each { |a| assert_includes sections, a["href"].delete_prefix("#") }
    end
  end

  test "every image can be opened at full size, and has real alt text" do
    get "/pt/galeria"
    assert_select "section.gallery-folder a[target='_blank'][href^='/media/'] img[alt]", minimum: 20
    css_select("section.gallery-folder img").each { |img| assert img["alt"].to_s.size > 10, "alt text missing" }
  end

  test "the OS data exposes the project titles the folders are named after" do
    get "/en/os.json"
    titles = JSON.parse(response.body)["entries"].to_h { |e| [ e["id"], e["title"] ] }
    assert_equal "Hane", titles["hane"].split(" — ").first
    assert_equal "Énois", titles["enois"].split(" — ").first
  end
end
