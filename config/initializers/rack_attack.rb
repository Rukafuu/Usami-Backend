# Throttles the only endpoint that costs money. Keyed by client IP (Cloudflare sets CF-Connecting-IP).
class Rack::Attack
  ASSISTANT = %r{\A/(pt|en|es|ja)/assistant\z}

  throttle("assistant/minute", limit: 8, period: 60) do |req|
    (req.get_header("HTTP_CF_CONNECTING_IP") || req.ip) if req.post? && req.path.match?(ASSISTANT)
  end

  throttle("assistant/hour", limit: 60, period: 3600) do |req|
    (req.get_header("HTTP_CF_CONNECTING_IP") || req.ip) if req.post? && req.path.match?(ASSISTANT)
  end

  self.throttled_responder = lambda do |_request|
    [ 429, { "Content-Type" => "application/json", "Retry-After" => "60" }, [ { error: "busy" }.to_json ] ]
  end
end

Rails.application.config.middleware.use Rack::Attack
Rails.application.config.after_initialize { Rack::Attack.cache.store = ActiveSupport::Cache::MemoryStore.new }