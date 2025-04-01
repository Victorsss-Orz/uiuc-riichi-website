.PHONY: dev build start clean

# Compile TypeScript, then start the server
dev: build start

# Compile TypeScript files
build:
	npx tsc
	npm run postbundle

# Start the server
start:
	npm run start

# Clean the dist folder
clean:
	rm -rf dist

deps:
	npm install
	