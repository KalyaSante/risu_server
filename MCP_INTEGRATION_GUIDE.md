# 🤖 Guide d'intégration MCP pour Kalya

## 🎯 Vue d'ensemble

Cette intégration ajoute un serveur MCP (Model Context Protocol) à ton projet Kalya, permettant à Claude de se connecter directement à ton application pour :

- 📋 Consulter et gérer tes serveurs et services
- ⚡ Accéder aux statuts en temps réel
- 🔍 Rechercher dans ta base de données
- ⚙️ Contrôler les services (start/stop/restart)
- 📊 Obtenir des statistiques système

## 🚀 Installation et Configuration

### 1. Prérequis
Assure-toi d'avoir :
- ✅ Un compte Claude Pro, Max, Team ou Enterprise
- ✅ Kalya déployé et accessible depuis internet
- ✅ Des API keys configurées dans Kalya (via `/settings/security`)

### 2. Variables d'environnement

Ajoute ces variables à ton fichier `.env` :

```env
# MCP Configuration
MCP_ENABLED=true
MCP_SERVER_NAME="Kalya MCP Server"
MCP_SERVER_VERSION="1.0.0"
MCP_DEBUG=false

# URL publique de ton serveur Kalya (pour Claude)
MCP_PUBLIC_URL="https://ton-domaine.com"
```

### 3. Configuration CORS

Si ton Kalya est sur un domaine différent de Claude, ajoute dans `config/cors.ts` :

```typescript
// Ajouter les domaines Claude si nécessaire
origin: [
  'https://claude.ai',
  'https://api.anthropic.com',
  // ... autres domaines
]
```

### 4. Test de l'installation

#### 4.1 Vérification locale
```bash
# Démarrer le serveur
npm run dev

# Tester les endpoints MCP
curl http://localhost:3333/mcp/health
curl http://localhost:3333/mcp/tools
```

#### 4.2 Test avec une API key
```bash
# Remplace YOUR_API_KEY par une vraie clé depuis /settings/security
curl -H "X-API-Key: YOUR_API_KEY" \
     -H "Content-Type: application/json" \
     -X POST http://localhost:3333/mcp \
     -d '{"method": "tools/list"}'
```

Réponse attendue :
```json
{
  "tools": [
    {
      "name": "list_servers",
      "description": "Liste tous les serveurs avec leurs informations de base"
    },
    ...
  ]
}
```

## 🔗 Configuration dans Claude

### 1. Accéder aux intégrations custom

#### Pour Claude Pro/Max :
1. Va dans les paramètres de Claude
2. Section "Integrations"
3. Clique "Add custom integration"

#### Pour Claude Team/Enterprise :
1. Seuls les Primary Owners peuvent configurer
2. Basculer sur "Organization integrations"
3. Section "Integrations" → "Add custom integration"

### 2. Ajouter l'intégration Kalya

**URL du serveur MCP :**
```
https://ton-domaine.com/mcp
```

**Nom suggéré :**
```
Kalya Server Management
```

**Description :**
```
Gestion de serveurs et services Kalya - contrôle des infrastructures et monitoring
```

### 3. Authentification

Quand Claude demande l'authentification :
1. Il te redirigera vers ton interface Kalya
2. Connecte-toi avec ton compte habituel
3. Autoriser l'accès à l'API Kalya
4. Claude recevra automatiquement une API key temporaire

## 🛠️ Outils MCP disponibles

| Outil | Description | Paramètres |
|-------|-------------|------------|
| `list_servers` | Liste tous les serveurs | Aucun |
| `get_server_status` | Statut détaillé d'un serveur | `serverId` |
| `list_services` | Liste tous les services | Aucun |
| `manage_service` | Contrôle un service | `serviceId`, `action` |
| `get_service_dependencies` | Dépendances d'un service | `serviceId` |
| `search_database` | Recherche dans la DB | `query`, `table?` |
| `get_system_stats` | Statistiques générales | Aucun |

## 🎨 Exemples d'utilisation avec Claude

### Surveillance générale
```
"Peux-tu me donner un aperçu de l'état de mes serveurs Kalya ?"
```

### Gestion de services
```
"Redémarre le service nginx sur le serveur web-01"
```

### Debugging
```
"Recherche tous les services qui contiennent 'database' dans leur nom"
```

### Analyse des dépendances
```
"Montre-moi les dépendances du service API principal"
```

## 🔐 Sécurité et bonnes pratiques

### 1. API Keys
- ✅ Utilise des API keys avec des permissions limitées
- ✅ Rotate régulièrement les clés (recommandé : 90 jours)
- ✅ Désactive les clés inutilisées
- ✅ Monitor l'usage dans les logs Kalya

### 2. Accès réseau
- ✅ Kalya doit être accessible depuis internet pour Claude
- ✅ Utilise HTTPS en production (Let's Encrypt recommandé)
- ✅ Configure un firewall pour limiter l'accès si nécessaire

### 3. Monitoring
- ✅ Surveille les appels MCP dans les logs Kalya
- ✅ Active les alertes pour les actions critiques
- ✅ Review régulièrement les permissions accordées

## 🐛 Debugging

### Problèmes courants

#### 1. "API key manquante" 
```bash
# Vérifier que tu as une API key active
curl -H "X-API-Key: ta-cle" http://ton-domaine.com/mcp/health
```

#### 2. "Serveur MCP inaccessible"
```bash
# Tester la connectivité
curl http://ton-domaine.com/mcp/health
# Doit retourner {"status": "healthy", ...}
```

#### 3. "Outils non disponibles"
```bash
# Vérifier les outils MCP
curl http://ton-domaine.com/mcp/tools
```

### Logs utiles
```bash
# Logs AdonisJS
tail -f tmp/logs/app.log

# Filtrer les requêtes MCP
tail -f tmp/logs/app.log | grep "MCP"
```

## 🚀 Mise en production

### 1. Variables d'environnement production
```env
MCP_ENABLED=true
MCP_DEBUG=false
MCP_PUBLIC_URL="https://kalya.ton-domaine.com"
```

### 2. Reverse proxy (Nginx/Apache)
```nginx
# Configuration Nginx pour /mcp
location /mcp {
    proxy_pass http://localhost:3333;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

### 3. SSL/TLS
```bash
# Avec Certbot (Let's Encrypt)
sudo certbot --nginx -d kalya.ton-domaine.com
```

## 📚 Ressources

- [Documentation MCP officielle](https://modelcontextprotocol.io)
- [Guide Anthropic Custom Integrations](https://support.anthropic.com/en/articles/11175166-getting-started-with-custom-integrations-using-remote-mcp)
- [Sécurité MCP](https://support.anthropic.com/en/articles/11175166-getting-started-with-custom-integrations-using-remote-mcp#h_9088ccdf4d)

## 🎉 C'est parti !

Une fois configuré, tu pourras dire à Claude :

> "Connecte-toi à mon serveur Kalya et donne-moi un rapport sur l'état de mes services"

Et Claude aura accès direct à ton infrastructure ! (≧◡≦)

---

**Note :** Cette intégration respecte le protocole MCP d'Anthropic et utilise l'authentification existante de Kalya pour une sécurité optimale.
