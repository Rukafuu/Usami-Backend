class ApplicationController < ActionController::Base
  include Consent

  before_action :set_locale
  rescue_from Content::NotFound, with: :render_not_found

  helper_method :site, :localized_site

  def default_url_options = { locale: I18n.locale }

  private

  def set_locale
    requested = params[:locale].to_s
    I18n.locale = I18n.available_locales.map(&:to_s).include?(requested) ? requested : I18n.default_locale
  end

  def site = Content::Store.site

  def localized_site(key) = Content.localize(site[key], I18n.locale).value

  def render_not_found
    @code = 404
    @config = ErrorsController::ERROR_CONFIGS[404]
    render "errors/show", status: :not_found, formats: :html
  end
end
