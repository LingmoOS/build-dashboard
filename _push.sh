#!/bin/bash
cd /home/lingmo/build-dashboard
{
echo "=== add ==="
git add -A
echo "add rc=$?"
echo "=== commit ==="
git commit -m "Initial build dashboard"
echo "commit rc=$?"
echo "=== remote ==="
git remote add origin https://github.com/LingmoOS/build-dashboard.git
echo "remote rc=$?"
echo "=== push ==="
git push -u origin main
echo "push rc=$?"
echo "=== log ==="
git log --oneline
} > /tmp/dash_push.log 2>&1
cat /tmp/dash_push.log
