#!/usr/bin/env bash

set -euo pipefail

export DATABASE_URL="${DATABASE_URL:-postgresql://postgres:postgres@localhost:5432/iplpredictiongame_dev}"
export DIRECT_URL="${DIRECT_URL:-postgresql://postgres:postgres@localhost:5432/iplpredictiongame_dev}"
export TEST_DATABASE_URL="${TEST_DATABASE_URL:-postgresql://postgres:postgres@localhost:5432/iplpredictiongame_test}"
export TEST_DIRECT_URL="${TEST_DIRECT_URL:-postgresql://postgres:postgres@localhost:5432/iplpredictiongame_test}"

exec "$@"
