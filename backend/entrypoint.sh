#!/bin/sh
set -e

# Production image starts as root only to hand the media volume to appuser
# (a fresh named volume is root-owned), then re-executes itself unprivileged.
if [ "$(id -u)" = "0" ] && id appuser >/dev/null 2>&1; then
  mkdir -p /app/media
  chown -R appuser:appuser /app/media
  # setpriv keeps the environment, so point HOME at the unprivileged user's directory
  # (gunicorn writes its control socket under $HOME).
  export HOME=/home/appuser
  exec setpriv --reuid=appuser --regid=appuser --init-groups sh "$0" "$@"
fi

if [ -n "$POSTGRES_HOST" ]; then
  echo "⏳ Waiting for PostgreSQL at $POSTGRES_HOST:${POSTGRES_PORT:-5432}..."
  until python -c "import os, socket; socket.create_connection((os.environ['POSTGRES_HOST'], int(os.environ.get('POSTGRES_PORT', '5432'))), 2)" 2>/dev/null; do
    sleep 1
  done
fi

if [ "${RUN_MIGRATIONS:-1}" = "1" ]; then
  echo "🗄️  Applying migrations..."
  python manage.py migrate --noinput
fi

python manage.py ensure_superuser

exec "$@"
