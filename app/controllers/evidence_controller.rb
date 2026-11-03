class EvidenceController < ApplicationController
  def index
    @items = Content::Store.ledger
  end
end
