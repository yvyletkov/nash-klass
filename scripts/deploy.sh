#!/usr/bin/env bash
# Сборка и публикация сайта в ветку gh-pages (GitHub Pages).
# Ключи Supabase берутся из .env.local, если файл есть.
set -e
cd "$(dirname "$0")/.."
npm run build
cd dist
touch .nojekyll
git init -q
git checkout -q -b gh-pages
git add -A
git commit -q -m "deploy $(date +%F-%H%M)"
git push -f "$(git -C .. remote get-url origin)" gh-pages
rm -rf .git
