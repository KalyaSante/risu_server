# 🔐 Configuration OAuth - Cartographie Services

## 📋 Étapes de configuration

### 1. Copier les variables d'environnement
```bash
cp .env.example .env
```

### 2. Configurer les variables OAuth dans `.env`
```env
# OAuth Configuration  
OAUTH_BASE_URL=https://auth.kalya.com
OAUTH_CLIENT_ID=ton-client-id-ici
OAUTH_CLIENT_SECRET=ton-client-secret-ici
OAUTH_REDIRECT_URI=http://localhost:3333/auth/callback
```

### 3. Enregistrer ton client OAuth sur le serveur Kalya

#### Option A: Automatique (recommandé)
```bash
# Modifier d'abord commands/register_oauth_client.ts
# Ajouter ton token de développeur dans Authorization
node ace oauth:register
```

#### Option B: Manuel via API
```bash
curl -X POST https://auth.kalya.com/api/oauth/clients \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TON_DEV_TOKEN" \
  -d '{
    "name": "Cartographie Services Kalya",
    "redirect": "http://localhost:3333/auth/callback"
  }'
```

### 4. Lancer les migrations
```bash
node ace migration:run
```

### 5. Démarrer l'application
```bash
npm run dev
```

## 🎯 Flow d'authentification

1. **Accès à l'app** → `/` (route protégée)
2. **Redirection** → `/auth/login` (page de connexion)
3. **Clic "Se connecter"** → `/auth/oauth/login` (redirection OAuth)
4. **Serveur OAuth** → Écran de consentement Kalya
5. **Autorisation** → `/auth/callback` (réception du code)
6. **Échange token** → Stockage en session + création/màj utilisateur
7. **Accès accordé** → Retour sur `/` avec utilisateur connecté

## 🛠️ URLs importantes

- **Login**: `/auth/login`
- **Callback OAuth**: `/auth/callback` 
- **Logout**: `/logout`
- **Dashboard**: `/` (page principale protégée)

## 🔄 Gestion des tokens

- **Access token**: Stocké en session, renouvelé automatiquement
- **Refresh token**: Utilisé pour renouveler l'access token
- **Expiration**: Gérée automatiquement par le middleware
- **Logout**: Révoque les tokens côté serveur OAuth

## 🚨 Troubleshooting

### "État OAuth invalide"
- Vérifier que la session fonctionne
- CSRF token bien configuré

### "Token exchange failed"  
- Vérifier client_id/client_secret
- Vérifier redirect_uri exact
- Vérifier que le client OAuth est bien enregistré

### "User info fetch failed"
- Token expiré/invalide
- Problème de réseau avec le serveur OAuth

### Redirection en boucle
- Vérifier le middleware OAuth dans start/kernel.ts
- Session_driver configuré (cookie/memory)
