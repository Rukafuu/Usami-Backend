# frozen_string_literal: true

class ContactController < ApplicationController
  def new
    @request = ContactRequest.new
  end

  def create
    @request = ContactRequest.new(contact_params)

    if @request.valid?
      @request.deliver
      redirect_to thanks_path(locale: I18n.locale)
    else
      render :new, status: :unprocessable_entity
    end
  end

  def thanks
    response.set_header("X-Robots-Tag", "noindex")
  end

  private

  def contact_params
    params.require(:contact_request).permit(
      :name,
      :email,
      :contact_handle,
      :budget,
      :timeline,
      :details,
      :honeypot,
      services: []
    )
  end
end
