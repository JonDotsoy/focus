class Focus < Formula
  desc ""
  homepage "https://github.com/JonDotsoy/focus#readme"
  url "https://api.github.com/repos/JonDotsoy/focus/tarball/537c9ee0c2f36ca8a2a8b02ee3e23ac6f7652aed"

  sha256 "4b759d0cb7206eb3c5cf9d9de1dc34a16e41d4ec69de4c2b40755054bc8cca67"
  license "MIT"
  version "v0.1.0"

  depends_on "oven-sh/bun/bun"
  depends_on "make"

  def install
    system "make", "install"
    system "make", "build"
    bin.install "bin/focus" => "focus"
    bin.install "bin/focusd" => "focusd"
  end

  test do
    system "false"
  end

  service do
    run [opt_bin/"focusd"]
    keep_alive true
    working_dir var
    log_path var/"log/focusd.log"
    error_log_path var/"log/focusd.log"
  end
end
