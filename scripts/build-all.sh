#!/bin/bash
set -e

echo "=== SBS SimLab — Full Build ==="

echo ""
echo "--- Installing root dependencies ---"
npm install --include=dev

echo ""
echo "--- Building landing page ---"
cd landing && npm install --include=dev && npm run build && cd ..

echo ""
echo "--- Building Beer Game ---"
cd games/beer-game && npm install --include=dev && npm run build && cd ../..

echo ""
echo "--- Building People Express ---"
cd games/people-express && npm install --include=dev && npm run build && cd ../..

echo ""
echo "--- Building Newsvendor ---"
cd games/newsvendor && npm install --include=dev && npm run build && cd ../..

echo ""
echo "--- Building Moon Survival ---"
cd games/moon-survival && npm install --include=dev && npm run build && cd ../..

echo ""
echo "=== All builds complete ==="
