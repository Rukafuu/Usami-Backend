namespace :assistant do
  desc "Shows which AI providers are configured (names only, never the secrets)"
  task check: :environment do
    Assistant::Providers.status.each do |p|
      mark = p[:configured] ? "ok     " : "missing"
      extra = p[:configured] ? "" : "  (needs #{p[:missing].join(', ')})"
      puts format("%-10s %-6s %s%s", p[:id], p[:kind], mark, extra)
    end
  end
end
