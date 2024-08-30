COMMIT_SHA := `git rev-parse HEAD`
COMMIT_SHASUM_256 := `curl -L "https://api.github.com/repos/JonDotsoy/focus/tarball/$(COMMIT_SHA)" | shasum -a 256`

install:
	bun install

build:
	bun build --compile ./src/client.ts --outfile bin/focus
	bun build --compile ./src/server.ts --outfile bin/focusd

build-brew-formule:
	git rev-parse HEAD > ${TMPDIR}/.focus-build.HEAD
	curl -L "https://api.github.com/repos/JonDotsoy/focus/tarball/`cat ${TMPDIR}/.focus-build.HEAD`" | shasum -a 256 | cut -d' ' -f1 > ${TMPDIR}/.focus-build.SHASUM256

	cat ./focus.rb.template | sed "s/{{COMMIT_SHASUM_256}}/`cat ${TMPDIR}/.focus-build.SHASUM256`/g" | sed "s/{{COMMIT_SHA}}/`cat ${TMPDIR}/.focus-build.HEAD`/g" > ./focus.rb

	brew reinstall ./focus.rb
