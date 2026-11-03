# POST /:locale/consentimento  { choice: essential|all, return_to: /path }
# Works without JavaScript (the banner is a plain form); with JavaScript the page sets the same cookie itself.
class ConsentController < ApplicationController
  def create
    choice = params[:choice].to_s
    return head :unprocessable_entity unless Consent::CHOICES.include?(choice)

    cookies[Consent::COOKIE] = { value: choice, expires: Consent::MAX_AGE.from_now, path: "/", same_site: :lax, secure: request.ssl?, httponly: false }
    redirect_to safe_return_path
  end

  private

  # Only local paths, so this can never become an open redirect.
  def safe_return_path
    path = params[:return_to].to_s
    path.start_with?("/") && !path.start_with?("//") && !path.include?("\\") ? path : home_path
  end
end
