require "fileutils"

# Renders the whole site to plain files (HTML, JSON, sitemap, robots, 404) so it can be served by any static host.
# The Rails app stays the single place where the content lives; this is just a snapshot of what it renders.
# Pages that need a server (the assistant, saving the cookie choice, "/" -> language) are handled by the Worker.
class StaticSite
  # Everything in public/ is published except the local build folders and Rails' default error pages.
  PUBLIC_SKIP = %w[vite-dev vite-test 400.html 404.html 406-unsupported-browser.html 422.html 500.html].freeze
  SECURITY_HEADERS = %w[
    Content-Security-Policy X-Content-Type-Options X-Frame-Options Referrer-Policy Permissions-Policy
    Cross-Origin-Opener-Policy Cross-Origin-Resource-Policy
  ].freeze

  attr_reader :written, :skipped

  def initialize(out:, origin:, copy_assets: true, prompts_path: nil)
    @out = Pathname(out)
    @origin = URI(origin)
    @copy_assets = copy_assets
    @prompts_path = prompts_path && Pathname(prompts_path)
    @written = []
    @skipped = []
  end

  def build
    FileUtils.rm_rf(@out)
    FileUtils.mkdir_p(@out)
    copy_assets if @copy_assets

    without_forgery_protection do
      session = new_session
      pages.each { |path| write_page(session, path) }
      %w[/sitemap.xml /robots.txt].each { |path| write_extra(session, path) }
      optional_pages.each { |path| write_optional(session, path) }
      write_not_found(session)
      write_headers(session)
    end
    write_prompts
    self
  end

  # Where each URL lives on disk. "/pt" -> pt.html, "/pt/sistemas/lira" -> pt/sistemas/lira.html, "/pt/os.json" stays.
  def self.file_for(path)
    path = path.delete_prefix("/")
    File.extname(path).empty? ? "#{path}.html" : path
  end

  private

  def helpers = Rails.application.routes.url_helpers

  def pages
    I18n.available_locales.flat_map do |locale|
      base = [ helpers.home_path(locale:), helpers.evidence_path(locale:), helpers.gallery_path(locale:),
               helpers.privacy_path(locale:), helpers.cookies_policy_path(locale:), helpers.os_path(locale:) ]
      folders = Content::Store::FOLDERS.map { |f| helpers.folder_path(locale:, folder: f) }
      entries = Content::Store.entries.reject(&:route).map { |e| helpers.entry_path(locale:, folder: e.folder, slug: e.id) }
      base + folders + entries
    end
  end

  # Pages that are still being built elsewhere (FAQ, llms.txt): published when they answer, reported when they do not.
  def optional_pages
    I18n.available_locales.flat_map do |locale|
      [
        (helpers.faq_path(locale:) if helpers.respond_to?(:faq_path)),
        (helpers.contact_path(locale:) if helpers.respond_to?(:contact_path)),
        (helpers.thanks_path(locale:) if helpers.respond_to?(:thanks_path))
      ].compact
    end +
      (Rails.application.routes.recognize_path("/llms.txt", method: :get) ? %w[/llms.txt] : [])
  rescue ActionController::RoutingError
    []
  end

  def write_optional(session, path)
    session.get(path)
    if session.response.status == 200
      write(self.class.file_for(path), session.response.body)
    else
      @skipped << "#{path} (#{session.response.status})"
    end
  rescue StandardError => e
    @skipped << "#{path} (#{e.class})"
  end

  def new_session
    session = ActionDispatch::Integration::Session.new(Rails.application)
    session.host! @origin.host
    session.https! if @origin.scheme == "https"
    session
  end

  def without_forgery_protection
    before = ActionController::Base.allow_forgery_protection
    ActionController::Base.allow_forgery_protection = false # no per-visitor tokens in files everyone shares
    yield
  ensure
    ActionController::Base.allow_forgery_protection = before
  end

  def fetch(session, path, expect: 200)
    session.get(path)
    raise "#{path} answered #{session.response.status} (expected #{expect})" unless session.response.status == expect

    session.response
  end

  def write_page(session, path)
    response = fetch(session, path)
    write(self.class.file_for(path), response.body)
  end

  def write_extra(session, path) = write(path.delete_prefix("/"), fetch(session, path).body)

  def write_not_found(session)
    write("404.html", fetch(session, "/pt/nao-existe", expect: 404).body)
  end

  def write_headers(session)
    response = fetch(session, "/pt")
    lines = SECURITY_HEADERS.filter_map { |name| (value = response.headers[name]).present? && "  #{name}: #{value}" }
    lines << "  Strict-Transport-Security: max-age=31536000"
    write("_headers", <<~HEADERS)
      /*
      #{lines.join("\n")}

      /vite/*
        Cache-Control: public, max-age=31536000, immutable

      /media/*
        Cache-Control: public, max-age=86400

      /wallpapers/*
        Cache-Control: public, max-age=86400
    HEADERS
  end

  # The assistant's system prompt per language, built from the same YAML as the pages. The Worker bundles it.
  def write_prompts
    return unless @prompts_path

    prompts = I18n.available_locales.index_with { |locale| Assistant::Prompt.system(locale) }
    FileUtils.mkdir_p(@prompts_path.dirname)
    File.write(@prompts_path, JSON.pretty_generate(prompts))
  end

  def copy_assets
    public = Rails.root.join("public")
    (Dir.children(public) - PUBLIC_SKIP).each { |name| FileUtils.cp_r(public.join(name), @out.join(name)) }
  end
  def write(relative, body)
    target = @out.join(relative)
    FileUtils.mkdir_p(target.dirname)
    File.write(target, body)
    @written << relative
  end
end
