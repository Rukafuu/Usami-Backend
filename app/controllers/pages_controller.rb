class PagesController < ApplicationController
  def home
    @folders = Content::Store::FOLDERS.index_with { |f| Content::Store.entries_in(f) }
  end
end
