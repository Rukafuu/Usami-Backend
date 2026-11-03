module Assistant
  # Which AI providers have credentials configured. It only ever reports *whether* a key exists:
  # secrets are never returned, logged or sent to the browser.
  module Providers
    Provider = Data.define(:id, :kind, :needs, :optional)

    ALL = [
      Provider.new(:nvidia, :text, %w[NVIDIA_API_KEY], %w[NVIDIA_MODEL]),
      Provider.new(:gemini, :text, %w[GEMINI_API_KEY], %w[GEMINI_MODEL]),
      Provider.new(:gemini_tts, :voice, %w[GEMINI_API_KEY GEMINI_TTS_VOICE], %w[GEMINI_TTS_MODEL GEMINI_TTS_INSTRUCTION]),
      Provider.new(:elevenlabs, :voice, %w[ELEVENLABS_API_KEY ELEVENLABS_VOICE_ID], [])
    ].freeze

    module_function

    def configured?(provider, env = ENV) = provider.needs.all? { |name| env[name].to_s.strip != "" }

    def status(env = ENV)
      ALL.map { |p| { id: p.id, kind: p.kind, configured: configured?(p, env), missing: p.needs.reject { |n| env[n].to_s.strip != "" } } }
    end

    def available(kind, env = ENV) = ALL.select { |p| p.kind == kind && configured?(p, env) }.map(&:id)
  end
end
