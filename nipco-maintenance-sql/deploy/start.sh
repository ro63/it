#!/usr/bin/env bash
# Local Linux/macOS helper: builds the SPA, copies it to wwwroot and runs the API.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
API_DIR="$ROOT/server/Nipco.Maintenance.Api"

cd "$ROOT"
[ -d node_modules ] || npm install
npm run build

rm -rf "$API_DIR/wwwroot"
mkdir -p "$API_DIR/wwwroot"
cp -R "$ROOT/dist/." "$API_DIR/wwwroot/"

cd "$API_DIR"
ASPNETCORE_ENVIRONMENT=Development dotnet run
