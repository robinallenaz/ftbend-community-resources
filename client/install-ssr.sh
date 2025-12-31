#!/bin/bash
echo "Installing SSR dependencies..."

# Core SSR dependencies
npm install express
npm install @types/express
npm install http-proxy-middleware

# Development dependencies
npm install -D @types/node

echo "SSR dependencies installed!"
echo "Run 'npm run dev:ssr' to test SSR locally"
