class EntriesController < ApplicationController
  def show
    @entry = Content::Store.find!(params[:folder], params[:slug])
    redirect_to evidence_path, status: :moved_permanently if @entry.route == "evidencias"
  end
end
