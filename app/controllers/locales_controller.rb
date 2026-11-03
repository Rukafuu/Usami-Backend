class LocalesController < ApplicationController
  # "/" has no content of its own: send visitors to the language they asked for.
  def redirect
    response.set_header("Vary", "Accept-Language")
    redirect_to home_path(locale: preferred_locale), status: :found
  end

  private

  def preferred_locale
    asked = request.headers["Accept-Language"].to_s.split(",").map { |part| part[/\A\s*([a-z]{2})/i, 1]&.downcase }
    asked.find { |l| I18n.available_locales.map(&:to_s).include?(l) } || I18n.default_locale
  end
end
