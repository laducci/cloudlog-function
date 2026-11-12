#!/usr/bin/env bash
# Gera cloudlog-function.zip pronto para "az functionapp deployment source config-zip".
set -euo pipefail
cd "$(dirname "$0")/.."
npm ci
npm run build
rm -rf .package cloudlog-function.zip
mkdir .package
cp -r dist host.json package.json package-lock.json .package/
(cd .package && npm ci --omit=dev --ignore-scripts && zip -qr ../cloudlog-function.zip .)
rm -rf .package
echo "Pacote gerado: cloudlog-function.zip"
