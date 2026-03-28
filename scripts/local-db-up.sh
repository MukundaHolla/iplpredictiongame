#!/usr/bin/env bash

set -euo pipefail

docker compose up -d postgres

until docker compose exec -T postgres pg_isready -U postgres -d iplpredictiongame_dev >/dev/null 2>&1; do
  sleep 1
done

echo "Local Postgres is ready on localhost:5432."
