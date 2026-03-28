#!/usr/bin/env bash

set -euo pipefail

bash scripts/local-test-db-prepare.sh
bash scripts/with-local-db.sh pnpm test:integration
