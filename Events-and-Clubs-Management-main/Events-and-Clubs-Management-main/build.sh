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

# Create admin user from environment variables if provided (non-fatal)
python manage.py create_admin || true