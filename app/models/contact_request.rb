# frozen_string_literal: true

require "net/http"
require "json"

class ContactRequest
  include ActiveModel::Model
  include ActiveModel::Attributes

  attribute :name, :string
  attribute :email, :string
  attribute :contact_handle, :string
  attribute :services, default: -> { [] }
  attribute :budget, :string
  attribute :timeline, :string
  attribute :details, :string
  attribute :honeypot, :string

  AVAILABLE_SERVICES = %w[
    design_engineering
    design_system
    ai_agents
    fullstack
    consulting
  ].freeze

  AVAILABLE_BUDGETS = %w[
    under_5k
    5k_to_15k
    15k_to_30k
    over_30k
    international_usd
  ].freeze

  AVAILABLE_TIMELINES = %w[
    urgent
    standard
    flexible
  ].freeze

  validates :name, presence: true, length: { maximum: 100 }
  validates :email, presence: true, length: { maximum: 120 }, format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :details, presence: true, length: { minimum: 10, maximum: 4000 }
  validates :budget, inclusion: { in: AVAILABLE_BUDGETS }, allow_blank: true
  validates :timeline, inclusion: { in: AVAILABLE_TIMELINES }, allow_blank: true

  def spam?
    honeypot.present?
  end

  def deliver
    return true if spam?

    payload = build_lead_data
    persist_lead(payload)
    notify_discord(payload)
    true
  end

  def formatted_services(locale = I18n.locale)
    list = Array(services).reject(&:blank?)
    return I18n.t("contact_form.services.none", default: "Não especificado") if list.empty?

    list.map { |s| I18n.t("contact_form.services.#{s}", default: s.humanize) }.join(", ")
  end

  def formatted_budget
    return "A combinar" if budget.blank?

    I18n.t("contact_form.budgets.#{budget}", default: budget)
  end

  def formatted_timeline
    return "Flexível" if timeline.blank?

    I18n.t("contact_form.timelines.#{timeline}", default: timeline)
  end

  private

  def build_lead_data
    {
      id: SecureRandom.uuid,
      created_at: Time.current.iso8601,
      name: name.to_s.strip,
      email: email.to_s.strip.downcase,
      contact_handle: contact_handle.to_s.strip,
      services: Array(services).reject(&:blank?),
      budget: budget.presence || "not_specified",
      timeline: timeline.presence || "not_specified",
      details: details.to_s.strip
    }
  end

  def persist_lead(data)
    leads_path = Rails.root.join("log", "leads.jsonl")
    FileUtils.mkdir_p(leads_path.dirname)
    File.open(leads_path, "a", encoding: "UTF-8") do |f|
      f.puts(JSON.generate(data))
    end
    Rails.logger.info("[ORÇAMENTO] Lead registrado: #{data[:name]} <#{data[:email]}> (ID: #{data[:id]})")
  rescue StandardError => e
    Rails.logger.error("[ORÇAMENTO] Falha ao gravar lead local: #{e.message}")
  end

  def notify_discord(data)
    webhook_url = ENV["DISCORD_WEBHOOK_URL"]
    return unless webhook_url.present?

    uri = URI.parse(webhook_url)
    return unless uri.is_a?(URI::HTTP) || uri.is_a?(URI::HTTPS)

    fields = [
      { name: "👤 Nome", value: data[:name], inline: true },
      { name: "✉️ E-mail", value: data[:email], inline: true },
      { name: "💬 Outro Contato", value: data[:contact_handle].presence || "Não informado", inline: true },
      { name: "🛠️ Serviços", value: formatted_services, inline: false },
      { name: "💰 Orçamento Estimado", value: formatted_budget, inline: true },
      { name: "⏱️ Prazo Desejado", value: formatted_timeline, inline: true },
      { name: "📝 Detalhes do Projeto", value: data[:details].truncate(1000), inline: false }
    ]

    body = {
      username: "Usami Lead Desk",
      avatar_url: "https://usami.ia.br/brand/icon-512.png",
      embeds: [
        {
          title: "🐰 Nova Solicitação de Orçamento!",
          color: 0xdf8244,
          description: "Um visitante acabou de enviar um briefing pelo formulário do site.",
          fields: fields,
          footer: { text: "ID: #{data[:id]} · Usami Lead Desk" },
          timestamp: data[:created_at]
        }
      ]
    }

    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl = (uri.scheme == "https")
    http.open_timeout = 4
    http.read_timeout = 5

    req = Net::HTTP::Post.new(uri.request_uri, { "Content-Type" => "application/json" })
    req.body = JSON.generate(body)
    http.request(req)
  rescue StandardError => e
    Rails.logger.warn("[ORÇAMENTO] Erro ao enviar webhook para o Discord: #{e.message}")
  end
end
