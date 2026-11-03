module Content
  # Real build metadata for "About the system": libraries straight from the lockfiles,
  # session metrics from config/content/build.yml (null means "not measured").
  module SystemInfo
    module_function

    def call
      build = YAML.safe_load_file(Rails.root.join("config/content/build.yml"), permitted_classes: [ Time ])
      tokens = build["tokens"] || {}
      {
        version: build["version"],
        startedAt: build["started_at"]&.iso8601,
        measuredAt: build["measured_at"]&.iso8601,
        models: build["models"],
        prompts: build["prompts"],
        apiResponses: build["api_responses"],
        tokens: {
          input: tokens["input"], cacheCreation: tokens["cache_creation"],
          cacheRead: tokens["cache_read"], output: tokens["output"]
        },
        totalTokens: build["total_tokens"],
        libraries: ruby_libraries + js_libraries
      }
    end

    def ruby_libraries
      lock = Bundler::LockfileParser.new(Rails.root.join("Gemfile.lock").read)
      direct = Bundler.definition.dependencies.map(&:name)
      lock.specs.select { |s| direct.include?(s.name) }.uniq(&:name).sort_by(&:name)
              .map { |s| { name: s.name, version: s.version.to_s, ecosystem: "ruby" } }
    end

    def js_libraries
      manifest = JSON.parse(Rails.root.join("package.json").read)
      lock = JSON.parse(Rails.root.join("package-lock.json").read)
      names = manifest.fetch("dependencies", {}).keys + manifest.fetch("devDependencies", {}).keys
      names.sort.map do |name|
        { name: name, version: lock.dig("packages", "node_modules/#{name}", "version"), ecosystem: "npm" }
      end
    end
  end
end
