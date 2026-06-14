#!/usr/bin/env bash
# Exit on error
set -o errexit

cd backend

# Install dependencies
pip install -r requirements.txt

# Convert static asset files
python manage.py collectstatic --no-input

# Apply any outstanding database migrations
python manage.py migrate

# Default departments + admin user (non-fatal if env vars missing)
python manage.py setup_defaults || true