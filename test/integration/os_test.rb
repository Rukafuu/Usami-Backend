require "test_helper"

class OsTest < ActionDispatch::IntegrationTest
  test "serves the shell payload in each language" do
    %w[pt en es ja].each do |locale|
      get "/#{locale}/os.json"
      assert_response :success
      data = JSON.parse(response.body)
      assert_equal locale, data["locale"]
      assert_equal Content::Store.entries.size, data["entries"].size
      assert data["ui"]["shell"]["boot"].is_a?(Array)
      assert_equal Content::Store::FOLDERS, data["folders"]
    end
  end

  test "names the company and the emulated system separately" do
    get "/pt/os.json"
    site = JSON.parse(response.body)["site"]
    assert_equal "Usami", site["name"]
    assert_equal "Fuwarch Linux", site["osName"]
    %w[pt en es ja].each do |locale|
      get "/#{locale}/os.json"
      assert JSON.parse(response.body).dig("ui", "apps", "about_emulated").present?, "#{locale} lacks the emulation notice"
    end
  end

  test "about-the-system metadata comes from real sources and admits what was not measured" do
    get "/pt/os.json"
    system = JSON.parse(response.body)["system"]
    names = system["libraries"].map { |l| l["name"] }
    assert_includes names, "rails"
    assert_includes names, "react"
    assert system["libraries"].all? { |l| l["version"].present? }
    tokens = system["tokens"]
    assert_equal system["totalTokens"], tokens["input"] + tokens["cacheCreation"] + tokens["output"],
                 "total must be fresh input + cache writes + output (cache re-reads excluded)"
    assert_operator system["prompts"], :>, 0
    assert_operator tokens["cacheRead"], :>, 0
  end

  test "gallery only points to files that exist, and videos are honest placeholders" do
    get "/pt/os.json"
    gallery = JSON.parse(response.body)["gallery"]
    assert_operator gallery.size, :>=, 5
    gallery.each do |item|
      if item["placeholder"]
        assert_nil item["src"], "#{item["id"]} is a placeholder and must not have a file"
        assert_equal "video", item["kind"]
      else
        %w[src thumb].each { |k| assert Rails.public_path.join(item[k].delete_prefix("/")).file?, "#{item["id"]} #{k} is missing" }
      end
    end
  end

  test "flags untranslated lists" do
    get "/ja/os.json"
    hane = JSON.parse(response.body)["entries"].find { |e| e["id"] == "hane" }
    assert_equal false, hane["listsTranslated"]
    get "/pt/os.json"
    hane = JSON.parse(response.body)["entries"].find { |e| e["id"] == "hane" }
    assert_equal true, hane["listsTranslated"]
  end

  test "supports conditional requests" do
    get "/en/os.json"
    etag = response.headers["ETag"]
    get "/en/os.json", headers: { "If-None-Match" => etag }
    assert_response :not_modified
  end

  test "layout mounts the shell with the current page" do
    get "/pt/sistemas/hane"
    assert_select "#usamios[data-endpoint='/pt/os.json'][data-folder=sistemas][data-slug=hane]"
  end
end
