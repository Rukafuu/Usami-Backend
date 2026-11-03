class FaqController < ApplicationController
  def index
    @items = Content::Store.faq
  end
end
