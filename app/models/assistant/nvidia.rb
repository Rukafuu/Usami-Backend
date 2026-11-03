require "net/http"
require "json"

module Assistant
  # Talks to NVIDIA's OpenAI-compatible chat endpoint and yields text chunks as they stream in.
  # The key is read from the environment at call time and is never logged or returned.
  class Nvidia
    class Error < StandardError; end

    URL = URI("https://integrate.api.nvidia.com/v1/chat/completions")
    DEFAULT_MODEL = "meta/llama-3.3-70b-instruct"

    def initialize(env: ENV, transport: nil)
      @env = env
      @transport = transport || method(:http_stream)
    end

    def configured? = @env["NVIDIA_API_KEY"].to_s.strip != ""
    def model = @env["NVIDIA_MODEL"].to_s.strip.presence || DEFAULT_MODEL

    # Yields each piece of text. Raises Error on any failure (message never contains the key).
    def stream(messages, max_tokens: 500, &block)
      raise Error, "not configured" unless configured?
      body = { model: model, messages: messages, max_tokens: max_tokens, temperature: 0.4, stream: true }
      buffer = +""
      @transport.call(URL, body, @env["NVIDIA_API_KEY"].strip) do |chunk|
        buffer << chunk
        while (line = buffer.slice!(/\A.*\n/))
          text = parse(line)
          block.call(text) if text
        end
      end
    end

    private

    def parse(line)
      line = line.strip
      return unless line.start_with?("data:")
      payload = line.delete_prefix("data:").strip
      return if payload.empty? || payload == "[DONE]"
      JSON.parse(payload).dig("choices", 0, "delta", "content").presence
    rescue JSON::ParserError
      nil
    end

    def http_stream(uri, body, key)
      http = Net::HTTP.new(uri.host, uri.port)
      http.use_ssl = true
      http.open_timeout = 5
      http.read_timeout = 30
      request = Net::HTTP::Post.new(uri, "Content-Type" => "application/json", "Accept" => "text/event-stream", "Authorization" => "Bearer #{key}")
      request.body = JSON.generate(body)
      http.request(request) do |response|
        raise Error, "provider answered #{response.code}" unless response.is_a?(Net::HTTPSuccess)
        response.read_body { |chunk| yield chunk }
      end
    rescue Net::OpenTimeout, Net::ReadTimeout, SocketError, SystemCallError, OpenSSL::SSL::SSLError => e
      raise Error, e.class.name
    end
  end
end