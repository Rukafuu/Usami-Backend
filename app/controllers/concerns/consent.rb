# The visitor's cookie choice. "essential" is the default: nothing optional loads until they say "all".
module Consent
  COOKIE = :usami_consent
  CHOICES = %w[essential all].freeze
  MAX_AGE = 180.days

  extend ActiveSupport::Concern

  included { helper_method :consent_choice, :consent_asked? }

  def consent_choice = CHOICES.include?(cookies[COOKIE]) ? cookies[COOKIE] : "essential"
  def consent_asked? = CHOICES.include?(cookies[COOKIE])
end
