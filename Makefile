install:
	bun install

build:
	bun build --compile ./src/client.ts --outfile bin/focus
	bun build --compile ./src/server.ts --outfile bin/focusd
