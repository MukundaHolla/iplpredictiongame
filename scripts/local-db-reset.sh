#!/usr/bin/env bash

set -euo pipefail

docker compose down -v
bash scripts/local-db-up.sh
