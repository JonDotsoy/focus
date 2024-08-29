class Focus < Formula
  desc ""
  homepage "https://github.com/JonDotsoy/focus#readme"
  url "https://api.github.com/repos/JonDotsoy/cofy/tarball/q-v0.8.0"
  sha256 "c640c1ca843728d1e9c0515bad166e15de10aded9806ec831f3bd3d969faa609"
  license "MIT"
  version "q-v0.8.0"

  depends_on "oven-sh/bun/bun"
  depends_on "make"

  def install
    system "make", "install"
    system "make", "build"
    bin.install "dist/cofy" => "cofy"
  end

  test do
    system "false"
  end

  def services

  end
end
