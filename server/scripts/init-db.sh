#!/bin/bash
# Script to initialize database with PostGIS extension

PGHOST="${PGHOST:-localhost}"
PGPORT="${PGPORT:-5432}"
PGUSER="${PGUSER:-postgres}"
PGPASSWORD="${PGPASSWORD:-postgres}"
PGDATABASE="${PGDATABASE:-floodrelief}"

export PGPASSWORD

echo "Initializing database $PGDATABASE on $PGHOST:$PGPORT..."

# Create database if it doesn't exist
psql -h $PGHOST -p $PGPORT -U $PGUSER -d postgres -c "SELECT 1 FROM pg_database WHERE datname = '$PGDATABASE'" | grep -q 1 || \
psql -h $PGHOST -p $PGPORT -U $PGUSER -d postgres -c "CREATE DATABASE $PGDATABASE"

# Enable PostGIS extension
psql -h $PGHOST -p $PGPORT -U $PGUSER -d $PGDATABASE -c "CREATE EXTENSION IF NOT EXISTS postgis;"

echo "Database initialization complete!"

