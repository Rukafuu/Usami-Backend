require "test_helper"

class SecurityHeadersTest < ActionDispatch::IntegrationTest
  test "pages ship a strict content security policy" do
    get "/pt"
    csp = response.headers["Content-Security-Policy"]
    assert_includes csp, "default-src 'self'"
    assert_includes csp, "object-src 'none'"
    assert_includes csp, "frame-ancestors 'none'"
    assert_not_includes csp, "unsafe-inline"
    assert_not_includes csp, "unsafe-eval"
  end
end
