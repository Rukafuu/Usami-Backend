require "test_helper"

class AssistantProvidersTest < ActionDispatch::IntegrationTest
  test "reports which providers are configured without exposing any value" do
    env = { "NVIDIA_API_KEY" => "nvapi-secret", "GEMINI_API_KEY" => "  ", "ELEVENLABS_API_KEY" => "k" }
    status = Assistant::Providers.status(env)

    assert_equal true, status.find { |p| p[:id] == :nvidia }[:configured]
    assert_equal false, status.find { |p| p[:id] == :gemini }[:configured], "a blank value is not a key"
    assert_equal [ "ELEVENLABS_VOICE_ID" ], status.find { |p| p[:id] == :elevenlabs }[:missing]
    assert_not_includes status.to_s, "nvapi-secret"
  end

  test "lists available providers by kind" do
    env = { "NVIDIA_API_KEY" => "x", "ELEVENLABS_API_KEY" => "k", "ELEVENLABS_VOICE_ID" => "v" }
    assert_equal [ :nvidia ], Assistant::Providers.available(:text, env)
    assert_equal [ :elevenlabs ], Assistant::Providers.available(:voice, env)
  end

  test "no secret ever reaches the browser payload or the HTML" do
    secrets = ENV.slice("NVIDIA_API_KEY", "GEMINI_API_KEY", "ELEVENLABS_API_KEY", "USAMI_API_TOKEN").values.reject(&:blank?)
    get "/pt/os.json"
    html = response.body
    get "/pt"
    html += response.body
    secrets.each { |secret| assert_not_includes html, secret }
  end

  test "parameter filtering covers API keys and tokens" do
    filtered = ActiveSupport::ParameterFilter.new(Rails.application.config.filter_parameters)
    %w[NVIDIA_API_KEY gemini_api_key api_token USAMI_API_TOKEN].each do |name|
      assert_equal "[FILTERED]", filtered.filter(name => "secret")[name], "#{name} must be filtered from logs"
    end
  end
end
