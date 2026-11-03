class FoldersController < ApplicationController
  def show
    @folder = params[:folder]
    @entries = Content::Store.entries_in(@folder)
  end
end
