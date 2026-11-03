# POST /:locale/assistant  { messages: [{role, content}, ...] }  ->  text/event-stream
# Events: "delta" {text}, "done" {}, "error" {code}. The visitor's text is never logged.
class AssistantController < ApplicationController
  include ActionController::Live

  MAX_BODY = 8_000

  def create
    return render(json: { error: "too_large" }, status: :payload_too_large) if request.content_length.to_i > MAX_BODY

    history = params.permit(messages: %i[role content])[:messages]
    last = Array(history).last
    return render(json: { error: "empty" }, status: :unprocessable_entity) unless last && last[:role] == "user" && last[:content].to_s.strip.present?

    client = nvidia
    return render(json: { error: "unavailable" }, status: :service_unavailable) unless client.configured?
    return render(json: { error: "busy" }, status: :too_many_requests) unless Assistant::Budget.shared.take!

    response.headers["Content-Type"] = "text/event-stream"
    response.headers["Cache-Control"] = "no-store"
    response.headers["X-Accel-Buffering"] = "no"
    begin
      client.stream(Assistant::Prompt.messages(I18n.locale, history.map(&:to_h))) { |text| send_event("delta", text: text) }
      send_event("done", {})
    rescue Assistant::Nvidia::Error => e
      Rails.logger.warn("assistant: provider failure (#{e.message})")
      send_event("error", code: "provider")
    ensure
      response.stream.close
    end
  end

  private

  def nvidia = Assistant::Nvidia.new

  def send_event(name, data)
    response.stream.write("event: #{name}\ndata: #{data.to_json}\n\n")
  end
end