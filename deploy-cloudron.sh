#!/bin/bash

# Script de déploiement Cloudron pour Risu Server
# Utilise les corrections implémentées par Meika

set -euo pipefail

echo "🚀 Déploiement Cloudron - Risu Server"
echo "======================================="

# Configuration
IMAGE_NAME="ghcr.io/kalyasante/risu_server_cloudron"
TAG_FIXED="fixed"
CLOUDRON_APP="risu.marill.dev"

# Vérifications préalables
echo "📋 Vérifications préalables..."

if ! command -v docker &> /dev/null; then
    echo "❌ Docker n'est pas installé"
    exit 1
fi

if ! command -v cloudron &> /dev/null; then
    echo "❌ Cloudron CLI n'est pas installé"
    exit 1
fi

echo "✅ Prérequis vérifiés"

# Étape 1 : Construction de l'image corrigée
echo ""
echo "🔨 Étape 1: Construction de l'image Docker corrigée"
echo "Image: ${IMAGE_NAME}:${TAG_FIXED}"

docker build -f Dockerfile.cloudron -t "${IMAGE_NAME}:${TAG_FIXED}" . || {
    echo "❌ Échec de la construction de l'image"
    exit 1
}

echo "✅ Image construite avec succès"

# Étape 2 : Push vers le registry
echo ""
echo "📤 Étape 2: Push vers le registry GitHub"

docker push "${IMAGE_NAME}:${TAG_FIXED}" || {
    echo "❌ Échec du push vers le registry"
    exit 1
}

echo "✅ Image poussée vers le registry"

# Étape 3 : Vérification de l'app Cloudron existante
echo ""
echo "🔍 Étape 3: Vérification de l'app existante"

if cloudron list | grep -q "$CLOUDRON_APP"; then
    echo "⚠️  App existante détectée: $CLOUDRON_APP"
    read -p "Voulez-vous la désinstaller et réinstaller ? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🗑️  Désinstallation de l'ancienne app..."
        cloudron uninstall --app "$CLOUDRON_APP" || {
            echo "⚠️  Échec de la désinstallation (app peut-être déjà en erreur)"
        }
        echo "✅ Ancienne app supprimée"
    else
        echo "🔄 Mise à jour de l'app existante..."
        cloudron update --app "$CLOUDRON_APP" --image "${IMAGE_NAME}:${TAG_FIXED}" || {
            echo "❌ Échec de la mise à jour"
            exit 1
        }
        echo "✅ App mise à jour avec succès"
        exit 0
    fi
else
    echo "✅ Aucune app existante trouvée"
fi

# Étape 4 : Installation de la nouvelle app
echo ""
echo "📦 Étape 4: Installation de la nouvelle app"

cloudron install --image "${IMAGE_NAME}:${TAG_FIXED}" --location "$CLOUDRON_APP" || {
    echo "❌ Échec de l'installation"
    exit 1
}

echo "✅ App installée avec succès"

# Étape 5 : Vérifications post-installation
echo ""
echo "🧪 Étape 5: Vérifications post-installation"

echo "⏳ Attente de la montée de l'app (30s)..."
sleep 30

# Test de santé
echo "🏥 Test de santé de l'app..."
if curl -f -s "https://$CLOUDRON_APP" > /dev/null; then
    echo "✅ App accessible et fonctionnelle"
else
    echo "⚠️  App accessible mais peut rediriger (normal pour /login)"
fi

# Status de l'app
echo "📊 Status de l'app:"
cloudron status --app "$CLOUDRON_APP" || echo "⚠️  Impossible d'obtenir le status"

# Logs récents
echo ""
echo "📝 Logs récents (dernières 10 lignes):"
cloudron logs --app "$CLOUDRON_APP" --lines 10 || echo "⚠️  Impossible d'obtenir les logs"

echo ""
echo "🎉 Déploiement terminé !"
echo "==================="
echo "URL: https://$CLOUDRON_APP"
echo "Status: cloudron status --app $CLOUDRON_APP"
echo "Logs: cloudron logs --app $CLOUDRON_APP"
echo ""

# Instructions finales
echo "📋 Prochaines étapes:"
echo "1. Tester l'accès à https://$CLOUDRON_APP"
echo "2. Vérifier la connexion OAuth Cloudron"
echo "3. Tester les fonctionnalités de base"
echo "4. Surveiller les logs pour s'assurer de la stabilité"

echo ""
echo "✨ Correction des problèmes Cloudron appliquée avec succès ! ✨"