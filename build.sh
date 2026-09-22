#!/bin/bash
set -e

echo "[1/2] Building frontend assets with Webpack..."
npm run build

echo "[2/2] Compiling Go Web application with embedded assets..."
go build -ldflags="-s -w" -o xiuxian .

echo "Build Success! Generated executable: ./xiuxian"
