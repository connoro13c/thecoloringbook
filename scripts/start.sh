#!/bin/bash

# Start script for Coloring Book App
# Kills any existing processes on port 3000 and starts the development server

echo "🔍 Checking for processes on port 3000..."

# Find and kill any processes using port 3000
PORT_PROCESS=$(lsof -ti:3000 2>/dev/null)

if [ ! -z "$PORT_PROCESS" ]; then
    echo "🚫 Killing existing process on port 3000 (PID: $PORT_PROCESS)"
    kill -9 $PORT_PROCESS
    sleep 2
else
    echo "✅ Port 3000 is available"
fi

echo "🚀 Starting Next.js development server on port 3000..."
npm run dev