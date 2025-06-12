# Icônes des services

Ce dossier contient les icônes utilisées pour représenter les services dans la cartographie.

## 📁 Formats supportés

- **SVG** (recommandé) - Vectoriel, redimensionnable
- **PNG** - Raster, bonne qualité
- **JPG/JPEG** - Raster, plus petit
- **WebP** - Moderne, bon compromis
- **GIF** - Pour les animations (éviter si possible)

## 🎨 Icônes recommandées

### Technologies Web
- `laravel.svg` - Framework Laravel
- `angular.svg` - Framework Angular  
- `react.svg` - Framework React
- `vue.svg` - Framework Vue.js
- `nodejs.svg` - Node.js
- `php.svg` - PHP

### Bases de données
- `mysql.svg` - MySQL
- `postgresql.svg` - PostgreSQL
- `mongodb.svg` - MongoDB
- `redis.svg` - Redis
- `elasticsearch.svg` - Elasticsearch

### Infrastructure
- `nginx.svg` - Serveur web Nginx
- `apache.svg` - Serveur web Apache
- `docker.svg` - Conteneurs Docker
- `kubernetes.svg` - Orchestration K8s

### Services
- `api.svg` - APIs REST
- `monitoring.svg` - Monitoring/métriques
- `backup.svg` - Services de sauvegarde
- `cdn.svg` - CDN/Assets
- `storage.svg` - Stockage de fichiers
- `cache.svg` - Services de cache

## 📥 Sources d'icônes

### Icônes officielles
- **Simple Icons** : https://simpleicons.org (icônes SVG de marques)
- **DevIcons** : https://devicons.github.io/devicon/ (technologies)
- **Logos officiels** : Sites des projets (Laravel, Angular, etc.)

### Icônes génériques
- **Heroicons** : https://heroicons.com (icônes UI)
- **Lucide** : https://lucide.dev (icônes modernes)
- **Tabler Icons** : https://tabler-icons.io (collection complète)

## 💾 Installation d'icônes

1. **Télécharger** l'icône au format SVG (recommandé)
2. **Renommer** le fichier selon la convention : `technologie.svg`
3. **Placer** le fichier dans ce dossier `public/icons/`
4. **Utiliser** le nom du fichier dans le champ "Icône" du service

### Exemple
```
public/icons/laravel.svg    → Champ icône: "laravel.svg"
public/icons/mysql.svg      → Champ icône: "mysql.svg"
public/icons/custom-api.svg → Champ icône: "custom-api.svg"
```

## 🎯 Tailles recommandées

- **SVG** : Toute taille (vectoriel)
- **PNG/WebP** : 64x64px minimum, 128x128px idéal
- **Fond transparent** pour PNG/WebP

## 🚀 Optimisation

### SVG
```bash
# Optimiser avec SVGO
npm install -g svgo
svgo icon.svg
```

### PNG/WebP
```bash
# Optimiser avec imagemagick
convert icon.png -resize 64x64 -strip icon-optimized.png
```

## 📋 Convention de nommage

- **Minuscules** uniquement
- **Traits d'union** pour séparer les mots
- **Extensions explicites** (.svg, .png, etc.)

### Exemples corrects
✅ `laravel.svg`
✅ `mysql-database.svg`  
✅ `custom-api.svg`
✅ `monitoring-grafana.png`

### Exemples incorrects
❌ `Laravel.svg` (majuscule)
❌ `mysql database.svg` (espaces)
❌ `api_custom.svg` (underscore)
❌ `icon` (sans extension)

## 🎨 Icônes par défaut

Si aucune icône n'est spécifiée, l'emoji ⚙️ sera affiché par défaut.

## 🔧 Dépannage

### L'icône ne s'affiche pas
1. Vérifier que le fichier existe dans `public/icons/`
2. Vérifier l'orthographe exacte du nom
3. Vérifier les permissions du fichier
4. Tester l'URL directe : `http://localhost:3333/icons/nom-icone.svg`

### Icône trop grande/petite
- Les icônes sont affichées en 24x24px dans les cartes
- Les icônes SVG s'adaptent automatiquement
- Pour PNG, prévoir 64x64px minimum

## 💡 Conseils

- **Privilégier SVG** pour la qualité et la taille
- **Utiliser des icônes officielles** quand possible
- **Tester sur fond clair et sombre** (DaisyUI supporte les thèmes)
- **Garder une cohérence visuelle** dans le style des icônes
