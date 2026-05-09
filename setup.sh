#!/bin/bash
echo ""
echo "========================================="
echo "  SmartCity Monitor v2 - Linux/Mac Setup"
echo "========================================="
echo ""

echo "[1/3] Installing server dependencies..."
cd server && npm install && cd ..

echo ""
echo "[2/3] Installing client dependencies..."
cd client && npm install --legacy-peer-deps && cd ..

echo ""
echo "[3/3] Creating .env file..."
cd server
[ ! -f .env ] && cp .env.example .env
cd ..

echo ""
echo "========================================="
echo "  ✓ Setup complete!"
echo ""
echo "  Start the project:"
echo "  Terminal 1: cd server && npm run dev"
echo "  Terminal 2: cd client && npm run dev"
echo ""
echo "  Open: http://localhost:5173"
echo "========================================="
