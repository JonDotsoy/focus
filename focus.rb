class Focus < Formula
  desc ""
  homepage "https://github.com/JonDotsoy/focus#readme"
  url "https://api.github.com/repos/JonDotsoy/focus/tarball/46c4990432be9e6d0f3935fdc0fa23fa7b7c1b09"
  sha256 "d772d13da804f76a26405faf5e27359ab86c6d9a0f90f9c30e0cbff1b746b80c"
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
