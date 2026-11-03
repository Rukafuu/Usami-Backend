class ErrorsController < ApplicationController
  ERROR_CONFIGS = {
    402 => { image: "/wallpapers/melody-studio-landscape.jpg" },
    403 => { image: "/wallpapers/chess-night.jpg" },
    404 => { image: "/wallpapers/starlit-window-landscape.jpg" },
    500 => { image: "/wallpapers/cafe-night-landscape.jpg" }
  }.freeze

  def show
    @code = params[:code].to_i
    @code = 404 unless ERROR_CONFIGS.key?(@code)
    @config = ERROR_CONFIGS[@code]

    render "errors/show", status: @code, formats: :html
  end

  def not_found
    @code = 404
    @config = ERROR_CONFIGS[404]
    render "errors/show", status: :not_found, formats: :html
  end
end
