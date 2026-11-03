# Be sure to restart your server when you modify this file.
# The site serves only its own scripts, styles, fonts and images; the assistant
# talks to our own endpoint, so connect-src stays on :self as well.
Rails.application.configure do
  config.content_security_policy do |policy|
    policy.default_src :self
    policy.font_src    :self
    policy.img_src     :self, :data, "https://i1.sndcdn.com", "https://*.sndcdn.com"
    policy.frame_src   :self, "https://w.soundcloud.com"
    policy.object_src  :none
    policy.script_src  :self
    policy.style_src   :self
    policy.connect_src :self
    policy.base_uri    :self
    policy.form_action :self
    policy.frame_ancestors :none

    if Rails.env.development?
      # Vite hot reload when the dev server is running.
      vite = "http://#{ViteRuby.config.host_with_port}"
      ws = "ws://#{ViteRuby.config.host_with_port}"
      policy.script_src  *policy.script_src, :unsafe_eval, vite
      policy.style_src   *policy.style_src, :unsafe_inline
      policy.connect_src *policy.connect_src, vite, ws
    end
  end
end
