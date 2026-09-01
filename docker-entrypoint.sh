#!/bin/sh
# Runs as root (the image's default at container start - see Dockerfile,
# there's no static USER anymore). A bind-mounted host directory - like
# docker-compose.yml's ./results - is owned by whoever/whatever created it on
# the host, not by the image's pwuser; on a real Linux host, a bind-mount
# source directory Docker auto-creates typically ends up root:root, mode 755,
# which pwuser can't write into. Fix up the mount points this suite actually
# writes to, then drop to pwuser for the real process via gosu.
set -e

for dir in /results /app/coverage /app/playwright-report /app/allure-results; do
  if [ -d "$dir" ]; then
    chmod -R a+rwX "$dir" 2>/dev/null || true
  fi
done

exec gosu pwuser "$@"
