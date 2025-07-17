#!/bin/bash

set -euo pipefail

echo "Starting Risu Server..."

# ===================================
# Détection automatique d'environnement
# ===================================
if [ -n "${CLOUDRON_APP_ORIGIN:-}" ]; then
    ENVIRONMENT="cloudron"
    echo "🌩️  Cloudron environment detected"
elif [ -n "${DOCKER_ENV:-}" ] || [ -f /.dockerenv ]; then
    ENVIRONMENT="docker"
    echo "🐳 Docker classic environment detected"
else
    ENVIRONMENT="local"
    echo "💻 Local development environment detected"
fi

# ===================================
# Configuration selon l'environnement
# ===================================

# Variables communes
export NODE_ENV=${NODE_ENV:-production}
export PORT=${PORT:-3333}
export HOST=${HOST:-0.0.0.0}
export LOG_LEVEL=${LOG_LEVEL:-info}
export SESSION_DRIVER=${SESSION_DRIVER:-cookie}
export TZ=${TZ:-UTC}

# Configuration spécifique par environnement
case $ENVIRONMENT in
    "cloudron")
        echo "🔧 Configuring for Cloudron..."

        # Dossiers Cloudron
        mkdir -p /app/data/database /app/data/uploads /run/app

        # APP_KEY pour Cloudron
        if [ ! -f /app/data/app.key ]; then
            echo "Generating application key for Cloudron..."
            node -e "console.log(require('crypto').randomBytes(32).toString('base64'))" > /app/data/app.key
        fi
        APP_KEY=$(cat /app/data/app.key)

        # Base de données Cloudron
        export DB_CONNECTION=sqlite
        export DB_DATABASE=/app/data/database/app.sqlite

        # OAuth Cloudron
        if [ -n "${OAUTH_CLIENT_ID:-}" ]; then
            export OAUTH_BASE_URL="https://${CLOUDRON_API_ORIGIN}"
            export OAUTH_CLIENT_ID="${OAUTH_CLIENT_ID}"
            export OAUTH_CLIENT_SECRET="${OAUTH_CLIENT_SECRET}"
            export OAUTH_REDIRECT_URI="https://${CLOUDRON_APP_ORIGIN}/auth/callback"
            export OAUTH_SCOPES="profile,email"
            export OAUTH_ENDPOINT_AUTHORIZE="/api/v1/oauth/authorize"
            export OAUTH_ENDPOINT_TOKEN="/api/v1/oauth/token"
            export OAUTH_ENDPOINT_USER_INFO="/api/v1/profile"
            export OAUTH_USER_FIELD_ID="id"
            export OAUTH_USER_FIELD_EMAIL="email"
            export OAUTH_USER_FIELD_NAME="displayName"
        fi

        # Chemins de stockage Cloudron
        export UPLOAD_PATH=/app/data/uploads
        export LOG_PATH=/run/app
        ;;

    "docker")
        echo "🔧 Configuring for Docker classic..."

        # Dossiers Docker classique
        mkdir -p /app/data/database /app/data/uploads /app/data/logs

        # APP_KEY pour Docker
        if [ ! -f /app/data/app.key ]; then
            echo "Generating application key for Docker..."
            node -e "console.log(require('crypto').randomBytes(32).toString('base64'))" > /app/data/app.key
        fi
        APP_KEY=$(cat /app/data/app.key)

        # Base de données Docker (peut être SQLite ou externe)
        export DB_CONNECTION=${DB_CONNECTION:-sqlite}
        export DB_DATABASE=${DB_DATABASE:-/app/data/database/app.sqlite}
        export DB_HOST=${DB_HOST:-127.0.0.1}
        export DB_PORT=${DB_PORT:-3306}
        export DB_USER=${DB_USER:-}
        export DB_PASSWORD=${DB_PASSWORD:-}

        # OAuth Docker (optionnel, utilise les variables d'env existantes)
        # Les variables OAUTH_* sont utilisées telles quelles si définies

        # Chemins de stockage Docker
        export UPLOAD_PATH=${UPLOAD_PATH:-/app/data/uploads}
        export LOG_PATH=${LOG_PATH:-/app/logs}
        ;;

    "local")
        echo "🔧 Configuring for local development..."

        # Dossiers développement local
        mkdir -p ./tmp/database ./tmp/uploads ./tmp/logs

        # APP_KEY pour développement
        if [ ! -f ./tmp/app.key ]; then
            echo "Generating application key for local dev..."
            node -e "console.log(require('crypto').randomBytes(32).toString('base64'))" > ./tmp/app.key
        fi
        APP_KEY=$(cat ./tmp/app.key)

        # Configuration développement
        export NODE_ENV=development
        export DB_CONNECTION=sqlite
        export DB_DATABASE=./tmp/database/app.sqlite
        export UPLOAD_PATH=./tmp/uploads
        export LOG_PATH=./tmp/logs
        ;;
esac

# Variables d'environnement finales
export APP_KEY="$APP_KEY"

# ===================================
# Initialisation base de données
# ===================================

# Créer la base si elle n'existe pas (SQLite)
if [ "$DB_CONNECTION" = "sqlite" ] && [ ! -f "$DB_DATABASE" ]; then
    echo "Creating SQLite database: $DB_DATABASE"
    mkdir -p "$(dirname "$DB_DATABASE")"
    touch "$DB_DATABASE"
    chmod 640 "$DB_DATABASE"
fi

# Permissions pour Cloudron
if [ "$ENVIRONMENT" = "cloudron" ]; then
    # Les permissions sont déjà gérées par Cloudron
    echo "Skipping permission setup for Cloudron"
elif [ "$ENVIRONMENT" = "docker" ]; then
    # Permissions pour Docker classique - l'utilisateur node est déjà configuré
    echo "Setting up permissions for Docker environment"
    # Pas besoin de changer d'utilisateur, on est déjà node
fi

# ===================================
# Migrations et démarrage
# ===================================

echo "Running database migrations..."
# Adapter le chemin selon l'environnement
if [ "$ENVIRONMENT" = "cloudron" ]; then
    cd /app/code
else
    cd /app
fi

node build/bin/console.js migration:run || {
    echo "Migrations failed, but continuing..."
}

echo "Starting Risu Server on $HOST:$PORT in $ENVIRONMENT mode..."
exec node build/bin/server.js
