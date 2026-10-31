#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"
stow -t ~ home
