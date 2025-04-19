.PHONY: dev build start clean

# Compile TypeScript, then start the server
dev: build dev

# Compile TypeScript files
build:
	npx tsc
	npm run postbundle

# Start the server in Dev mode
dev:
	npm run dev

# Clean the dist folder
clean:
	rm -rf dist

deps:
	npm install
	