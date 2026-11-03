module Assistant
  # Daily cap on model calls, so a runaway loop or a flood can never run up a bill.
  # Counters live in this process (one container); a restart resets them, which only errs on the generous side.
  class Budget
    def initialize(limit: ENV.fetch("ASSISTANT_DAILY_LIMIT", "400").to_i, clock: -> { Date.current })
      @limit = limit
      @clock = clock
      @mutex = Mutex.new
      @day = nil
      @count = 0
    end

    # Returns true and counts the call when there is budget left.
    def take!
      @mutex.synchronize do
        today = @clock.call
        (@day, @count = today, 0) if @day != today
        return false if @count >= @limit
        @count += 1
        true
      end
    end

    def self.shared = @shared ||= new
    def self.reset! = @shared = nil
  end
end