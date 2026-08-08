#!/usr/bin/env bash
set -e

REPO_DIR="$(cd "$(dirname "$0")" && pwd)"
DIST_DIR="$REPO_DIR/dist"
TMP_DIR="$(mktemp -d)"

echo "Building..."
cd "$REPO_DIR"
/opt/homebrew/bin/npm run build

echo "Deploying from $DIST_DIR to temp dir $TMP_DIR..."
cp -r "$DIST_DIR/." "$TMP_DIR/"

cd "$TMP_DIR"
git init -q
git checkout -b gh-pages
git add .
git commit -q -m "Deploy $(date '+%Y-%m-%d %H:%M')"
git remote add origin git@github.com:Saranath07/wisdom-presentation.git
git push origin gh-pages --force

cd "$REPO_DIR"
rm -rf "$TMP_DIR"
echo "Done! https://saranath07.github.io/wisdom-presentation/"
