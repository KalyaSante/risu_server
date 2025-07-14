# 🔐 Guide de Configuration OAuth Flexible

Ce guide t'explique comment configurer l'OAuth pour n'importe quel provider.

## 🚀 Étapes d'installation

1. **Lancer la migration** :
```bash
node ace migration:run
```

2. **Configurer ton .env** selon le provider choisi (exemples ci-dessous)

3. **Tester en mode développement** pour voir les champs disponibles dans la console

## 🔧 Configurations par Provider

### GitHub
```env
OAUTH_BASE_URL=https://github.com
OAUTH_CLIENT_ID=your_github_client_id
OAUTH_CLIENT_SECRET=your_github_client_secret
OAUTH_REDIRECT_URI=http://localhost:3333/auth/callback
OAUTH_SCOPES=user:email

OAUTH_ENDPOINT_AUTHORIZE=/login/oauth/authorize
OAUTH_ENDPOINT_TOKEN=/login/oauth/access_token
OAUTH_ENDPOINT_USER_INFO=https://api.github.com/user

OAUTH_USER_FIELD_ID=id
OAUTH_USER_FIELD_EMAIL=email
OAUTH_USER_FIELD_NAME=name
```

### Google
```env
OAUTH_BASE_URL=https://accounts.google.com
OAUTH_CLIENT_ID=your_google_client_id
OAUTH_CLIENT_SECRET=your_google_client_secret
OAUTH_REDIRECT_URI=http://localhost:3333/auth/callback
OAUTH_SCOPES=openid,email,profile

OAUTH_ENDPOINT_AUTHORIZE=/o/oauth2/v2/auth
OAUTH_ENDPOINT_TOKEN=/o/oauth2/token
OAUTH_ENDPOINT_USER_INFO=https://www.googleapis.com/oauth2/v2/userinfo

OAUTH_USER_FIELD_ID=id
OAUTH_USER_FIELD_EMAIL=email
OAUTH_USER_FIELD_NAME=name
```

### Discord
```env
OAUTH_BASE_URL=https://discord.com
OAUTH_CLIENT_ID=your_discord_client_id
OAUTH_CLIENT_SECRET=your_discord_client_secret
OAUTH_REDIRECT_URI=http://localhost:3333/auth/callback
OAUTH_SCOPES=identify,email

OAUTH_ENDPOINT_AUTHORIZE=/api/oauth2/authorize
OAUTH_ENDPOINT_TOKEN=/api/oauth2/token
OAUTH_ENDPOINT_USER_INFO=https://discord.com/api/users/@me

OAUTH_USER_FIELD_ID=id
OAUTH_USER_FIELD_EMAIL=email
OAUTH_USER_FIELD_NAME=username
```

### GitLab
```env
OAUTH_BASE_URL=https://gitlab.com
OAUTH_CLIENT_ID=your_gitlab_client_id
OAUTH_CLIENT_SECRET=your_gitlab_client_secret
OAUTH_REDIRECT_URI=http://localhost:3333/auth/callback
OAUTH_SCOPES=read_user

OAUTH_ENDPOINT_AUTHORIZE=/oauth/authorize
OAUTH_ENDPOINT_TOKEN=/oauth/token
OAUTH_ENDPOINT_USER_INFO=/api/v4/user

OAUTH_USER_FIELD_ID=id
OAUTH_USER_FIELD_EMAIL=email
OAUTH_USER_FIELD_NAME=name
```

## 🐛 Debug et Troubleshooting

### Mode Développement
En mode `NODE_ENV=development`, la console affiche :
- Les données brutes du provider OAuth
- La liste de tous les champs disponibles

### Champs Imbriqués
Tu peux utiliser la notation avec points pour les champs imbriqués :
```env
OAUTH_USER_FIELD_EMAIL=user.profile.email
OAUTH_USER_FIELD_NAME=user.profile.display_name
```

### Fallbacks Automatiques
Le système essaie automatiquement ces fallbacks :
- **ID** : `id` → `sub` → `user_id`
- **Email** : `email` → `email_address`
- **Nom** : `name` → `full_name` → `display_name` → `first_name + last_name` → `login`

## ⚙️ Options Avancées

### Support PKCE
Pour les providers qui l'exigent :
```env
OAUTH_USE_PKCE=true
```

### Timeout Personnalisé
```env
OAUTH_REQUEST_TIMEOUT=15000  # 15 secondes
```

### Headers Personnalisés
```env
OAUTH_USER_AGENT=MonApp/2.0
OAUTH_ACCEPT_HEADER=application/vnd.api+json
```

## 🎯 Avantages

✅ **Robustesse** : Gère les changements d'email via `provider_id`  
✅ **Flexibilité** : S'adapte à n'importe quel provider OAuth  
✅ **Simplicité** : Juste 3 champs : ID, email, nom  
✅ **Debug facile** : Mode développement avec logs détaillés  
✅ **Zero code** : Tout se configure via .env  

## 🔄 Migration des Données Existantes

Si tu as déjà des utilisateurs avec l'ancien système :
```sql
-- Script pour migrer les données existantes
UPDATE users 
SET provider_id = id 
WHERE provider_id IS NULL AND password IS NULL;
```

## 🚨 Points Important

- Le champ `provider_id` stocke l'ID du serveur OAuth original
- L'`id` local reste un UUID généré par Adonis
- `updateOrCreate` utilise `provider_id` pour éviter les doublons
- Support complet des providers non-standards via configuration
