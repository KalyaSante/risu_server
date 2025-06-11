#!/usr/bin/env node

/**
 * Script de configuration automatique pour le développement
 * Usage: node scripts/dev-setup.js
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function checkFile(filePath) {
  return fs.existsSync(filePath)
}

function copyFile(source, destination) {
  try {
    fs.copyFileSync(source, destination)
    return true
  } catch (error) {
    return false
  }
}

function runCommand(command, description) {
  try {
    log(`📝 ${description}...`, 'blue')
    execSync(command, { stdio: 'pipe' })
    log(`✅ ${description} réussi`, 'green')
    return true
  } catch (error) {
    log(`❌ ${description} échoué: ${error.message}`, 'red')
    return false
  }
}

function main() {
  log('🚀 Configuration automatique de l\'environnement de développement', 'cyan')
  log('================================================', 'cyan')

  // Vérifier si .env existe
  if (!checkFile('.env')) {
    log('⚠️  Fichier .env manquant', 'yellow')
    
    if (checkFile('.env.example')) {
      if (copyFile('.env.example', '.env')) {
        log('✅ .env créé depuis .env.example', 'green')
      } else {
        log('❌ Impossible de créer .env', 'red')
        return
      }
    } else {
      log('❌ .env.example non trouvé', 'red')
      return
    }
  } else {
    log('✅ Fichier .env existant', 'green')
  }

  // Installer les dépendances
  if (!runCommand('pnpm install', 'Installation des dépendances')) {
    return
  }

  // Générer la clé d'application si nécessaire
  try {
    const envContent = fs.readFileSync('.env', 'utf8')
    if (!envContent.includes('APP_KEY=') || envContent.includes('APP_KEY=')) {
      runCommand('node ace generate:key', 'Génération de la clé d\'application')
    }
  } catch (error) {
    log('⚠️  Impossible de vérifier APP_KEY', 'yellow')
  }

  // Créer la base de données
  const dbPath = 'tmp/db.sqlite3'
  if (!checkFile(dbPath)) {
    log('📝 Création de la base de données SQLite...', 'blue')
    if (!fs.existsSync('tmp')) {
      fs.mkdirSync('tmp', { recursive: true })
    }
    fs.writeFileSync(dbPath, '')
    log('✅ Base de données créée', 'green')
  }

  // Exécuter les migrations
  runCommand('node ace migration:run', 'Exécution des migrations')

  // Vérifier les icônes
  const iconsDir = 'public/icons'
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true })
    log('✅ Dossier des icônes créé', 'green')
  }

  const iconFiles = fs.readdirSync(iconsDir).filter(f => f.endsWith('.svg'))
  if (iconFiles.length === 0) {
    log('⚠️  Aucune icône trouvée dans public/icons/', 'yellow')
    log('💡 Consultez public/icons/README.md pour des suggestions', 'blue')
  } else {
    log(`✅ ${iconFiles.length} icône(s) disponible(s)`, 'green')
  }

  // Build des assets
  runCommand('pnpm build', 'Build des assets Vite')

  // Vérifications finales
  log('\n🔍 Vérifications finales:', 'cyan')
  
  const checks = [
    { file: '.env', description: 'Configuration environnement' },
    { file: 'tmp/db.sqlite3', description: 'Base de données' },
    { file: 'public/icons', description: 'Dossier icônes' },
    { file: 'node_modules', description: 'Dépendances installées' }
  ]

  checks.forEach(check => {
    if (checkFile(check.file)) {
      log(`✅ ${check.description}`, 'green')
    } else {
      log(`❌ ${check.description}`, 'red')
    }
  })

  // Instructions finales
  log('\n🎉 Configuration terminée !', 'green')
  log('================================================', 'cyan')
  log('Pour démarrer le serveur de développement :', 'blue')
  log('  pnpm dev', 'cyan')
  log('')
  log('Pour accéder à l\'application :', 'blue')
  log('  http://localhost:3333', 'cyan')
  log('')
  log('💡 Conseils :', 'yellow')
  log('  - Configurez vos variables OAuth dans .env', 'reset')
  log('  - Ajoutez des icônes dans public/icons/', 'reset')
  log('  - Consultez GETTING_STARTED.md pour plus d\'infos', 'reset')
}

// Exécuter le script
main()
