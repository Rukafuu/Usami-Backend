ENV["RAILS_ENV"] ||= "test"
require_relative "../config/environment"
require "rails/test_help"

module ActiveSupport
  class TestCase
    # Serial on purpose: vite_ruby switches the working directory while rendering the layout, which is not thread-safe
    # (it broke once the suite passed the parallelization threshold). The whole suite still runs in about a minute.
    parallelize(workers: 1)

    # Setup all fixtures in test/fixtures/*.yml for all tests in alphabetical order.
    fixtures :all

    # Add more helper methods to be used by all tests here...
  end
end
