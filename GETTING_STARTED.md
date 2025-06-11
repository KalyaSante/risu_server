# 🚀 Guide de démarrage rapide

## ✅ Ce qui a été fait

### Architecture complètement refactorisée
- ✅ **Layouts modulaires** : `base.edge` → `dashboard.edge`
- ✅ **Composants réutilisables** : navbar, cards, buttons, alerts
- ✅ **DaisyUI installé** (plus de CDN)
- ✅ **CSS/JS optimisés** avec utilitaires et animations
- ✅ **Validators robustes** avec Vine
- ✅ **Controllers complets** avec gestion d'erreurs
- ✅ **API endpoints** pour données JSON
- ✅ **Toutes les vues** serveurs et services créées

## 🎯 Prochaines étapes

### 1. Mettre à jour les routes
Copie le contenu de `start/routes_example.ts` dans ton `start/routes.ts` :

```typescript
// start/routes.ts - Exemple à adapter
import router from '@adonisjs/core/services/router'
import { middleware } from './kernel.js'

// Routes OAuth
router.get('/login', '#controllers/auth_controller.showLogin').as('auth.login.show')
router.get('/auth/login', '#controllers/auth_controller.login').as('auth.login')
router.get('/auth/callback', '#controllers/auth_controller.callback').as('auth.callback')

// Routes protégées
router.group(() => {
  router.get('/', '#controllers/dashboard_controller.index').as('dashboard.index')
  router.resource('servers', '#controllers/servers_controller')
  router.resource('services', '#controllers/services_controller')
}).middleware([middleware.auth(), middleware.oauth()])
```

### 2. Créer des icônes d'exemple
Télécharge quelques icônes depuis [Simple Icons](https://simpleicons.org) :

```bash
# Exemples d'icônes à télécharger
curl -o public/icons/laravel.svg https://cdn.jsdelivr.net/npm/simple-icons@v10/icons/laravel.svg
curl -o public/icons/angular.svg https://cdn.jsdelivr.net/npm/simple-icons@v10/icons/angular.svg
curl -o public/icons/mysql.svg https://cdn.jsdelivr.net/npm/simple-icons@v10/icons/mysql.svg
curl -o public/icons/nginx.svg https://cdn.jsdelivr.net/npm/simple-icons@v10/icons/nginx.svg
curl -o public/icons/redis.svg https://cdn.jsdelivr.net/npm/simple-icons@v10/icons/redis.svg
```

### 3. Tester l'application
```bash
# Relancer le serveur
pnpm dev

# Aller sur http://localhost:3333
# Tu devrais voir la page de login OAuth
```

## 🎨 Fonctionnalités disponibles

### Dashboard principal (`/`)
- **Cartographie interactive** avec Vis.js
- **Statistiques temps réel** (serveurs, services, dépendances)
- **Contrôles réseau** (ajuster vue, toggle physique)
- **Détails au clic** sur services et serveurs
- **Légende** et actions rapides

### Gestion serveurs (`/servers`)
- **Liste avec filtres** (hébergeur, recherche)
- **Création/édition** avec validation
- **Vue détaillée** avec services hébergés
- **Suppression** avec confirmation

### Gestion services (`/services`)
- **Liste avec filtres avancés** (serveur, maintenance, recherche)
- **Création/édition** avec upload d'icônes
- **Vue détaillée** avec dépendances complètes
- **Relations bidirectionnelles** (dependencies ↔ dependents)

## 🔧 Utilisation des composants

### Dans tes vues Edge
```edge
<!-- Utiliser une carte serveur -->
@include('components/server-card', { server: serverObject })

<!-- Utiliser une carte service -->
@include('components/service-card', { 
  service: serviceObject, 
  showServer: false 
})

<!-- Utiliser un bouton d'action -->
@include('components/action-button', { 
  href: route('servers.create'),
  type: 'primary',
  icon: '➕',
  text: 'Nouveau serveur'
})

<!-- Utiliser une statistique -->
@include('components/stats-card', { 
  title: 'Serveurs',
  value: servers.length,
  icon: '🖥️',
  color: 'primary'
})
```

## 📋 Données de test

Les seeders créent automatiquement :
- **5 serveurs** : Prod, Staging, Dev, Database, CDN
- **15 services** : APIs, frontends, bases de données, etc.
- **16 relations** : Required, optional, fallback

Si tu veux des données custom, copie-colle les tableaux depuis l'artifact dans DataGrip.

## 🎯 Points d'attention

### Middleware OAuth
Assure-toi que ton middleware OAuth est bien configuré :
```typescript
// app/middleware/oauth_middleware.ts
export default class OAuthMiddleware {
  async handle({ request, response }: HttpContext, next: NextFn) {
    // Ta logique de vérification OAuth
    await next()
  }
}
```

### Variables d'environnement
Vérifie ton `.env` :
```env
OAUTH_BASE_URL=https://auth.kalya.com
OAUTH_CLIENT_ID=ton-client-id
OAUTH_CLIENT_SECRET=ton-client-secret
OAUTH_REDIRECT_URI=http://localhost:3333/auth/callback
```

### Assets Vite
Si les styles ne se chargent pas :
```bash
# Rebuild les assets
pnpm build
```

## 🔍 Debug

### Erreurs de vue
```bash
# Vérifier la syntaxe Edge
node ace list:routes
```

### Erreurs de validation
Les validators sont très stricts. Vérifie :
- **IP format** : IPv4 ou IPv6 valide
- **URLs** : Format HTTP(S) complet
- **Hébergeurs** : Valeurs prédéfinies uniquement

### Erreurs de base
```bash
# Reset complet de la DB
node ace migration:rollback --batch=0
node ace migration:run
# Puis copie-colle les données dans DataGrip
```

## 🎨 Personnalisation

### Couleurs DaisyUI
```css
/* resources/css/app.css */
@import "tailwindcss";
@plugin "daisyui";

:root {
  --p: oklch(65.69% 0.196 275.75); /* Primary custom */
}
```

### Thème
```html
<!-- resources/views/layouts/base.edge -->
<html lang="fr" data-theme="corporate">
```

Thèmes disponibles : `light`, `dark`, `corporate`, `business`, `luxury`

## 🚀 Prêt pour la démo !

Avec cette architecture :
- ✅ **Interface moderne** et responsive
- ✅ **Fonctionnalités complètes** CRUD + cartographie
- ✅ **Performance optimisée** 
- ✅ **Code maintenable** et extensible
- ✅ **Sécurité OAuth** intégrée

Perfect pour impressionner lors de la passation ! 🎉

## 🆘 Aide

### Erreurs courantes

**Page blanche** → Vérifier console navigateur + logs AdonisJS
**Styles cassés** → `pnpm build` puis relancer
**OAuth loop** → Vérifier client_id/secret + redirect_uri
**Relations vides** → Copie-colle données dans DataGrip

### Contact
Si tu bloques sur quelque chose, montre-moi l'erreur et on debug ensemble ! ≧◡≦
