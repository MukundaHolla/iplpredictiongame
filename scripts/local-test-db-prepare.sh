#!/usr/bin/env bash

set -euo pipefail

export DATABASE_URL="${TEST_DATABASE_URL:-postgresql://postgres:postgres@localhost:5432/iplpredictiongame_test}"
export DIRECT_URL="${TEST_DIRECT_URL:-postgresql://postgres:postgres@localhost:5432/iplpredictiongame_test}"

pnpm db:deploy
