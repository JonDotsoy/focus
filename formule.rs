class Focus < Formula
  desc ""
  homepage "https://github.com/JonDotsoy/focus#readme"
  url "https://api.github.com/repos/JonDotsoy/focus/tarball/de65b86176b923ed19f957d4466d9a8ec0b72b60"
  sha256 "656d979e82bd9f8bd66b856c5090a1421e14bfd3e45c568272a594a9f5253708"
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

  def services

  end
end
