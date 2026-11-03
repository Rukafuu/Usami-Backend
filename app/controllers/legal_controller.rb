class LegalController < ApplicationController
  PAGES = { "privacy" => "privacidade", "cookies" => "cookies" }.freeze

  def privacy = show("privacy")
  def cookies_policy = show("cookies")

  private

  def show(page)
    @page = page
    @legal = Content::Store.legal
    @content = @legal.fetch(page)
    render :show
  end
end
