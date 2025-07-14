#!/usr/bin/env node

/**
 * 🧪 Script de test pour l'intégration MCP Kalya
 * 
 * Utilisation:
 * node scripts/test_mcp.js [API_KEY] [BASE_URL]
 * 
 * Exemples:
 * node scripts/test_mcp.js your-api-key http://localhost:3333
 * node scripts/test_mcp.js your-api-key https://kalya.example.com
 */

const apiKey = process.argv[2] || 'test-key'
const baseUrl = process.argv[3] || 'http://localhost:3333'

/**
 * 🔧 Utilitaire pour faire des requêtes HTTP
 */
async function makeRequest(url, options = {}) {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
        ...options.headers
      },
      ...options
    })

    const data = await response.json()
    
    return {
      status: response.status,
      ok: response.ok,
      data
    }
  } catch (error) {
    return {
      status: 0,
      ok: false,
      error: error.message
    }
  }
}

/**
 * 🧪 Tests MCP
 */
async function runTests() {
  console.log('🤖 Test de l\'intégration MCP Kalya')
  console.log(`📡 Base URL: ${baseUrl}`)
  console.log(`🔑 API Key: ${apiKey.substring(0, 8)}...`)
  console.log('')

  let passedTests = 0
  let totalTests = 0

  /**
   * ✅ Test helper
   */
  function test(name, condition, details = '') {
    totalTests++
    const status = condition ? '✅' : '❌'
    console.log(`${status} ${name}`)
    
    if (details && !condition) {
      console.log(`   → ${details}`)
    }
    
    if (condition) passedTests++
    console.log('')
  }

  // Test 1: Health Check
  console.log('🏥 Test 1: Health Check')
  const health = await makeRequest(`${baseUrl}/mcp/health`)
  test(
    'Health endpoint accessible',
    health.ok,
    health.error || `Status: ${health.status}`
  )
  
  if (health.ok) {
    test(
      'Health response contient status',
      health.data?.status === 'healthy',
      `Status reçu: ${health.data?.status}`
    )
  }

  // Test 2: Tools Discovery
  console.log('🛠️ Test 2: Tools Discovery')
  const tools = await makeRequest(`${baseUrl}/mcp/tools`)
  test(
    'Tools endpoint accessible',
    tools.ok,
    tools.error || `Status: ${tools.status}`
  )
  
  if (tools.ok) {
    test(
      'Tools response contient une liste',
      Array.isArray(tools.data?.tools),
      `Type reçu: ${typeof tools.data?.tools}`
    )
    
    test(
      'Au moins 5 outils disponibles',
      tools.data?.tools?.length >= 5,
      `Nombre d'outils: ${tools.data?.tools?.length || 0}`
    )
  }

  // Test 3: MCP Protocol - Initialize
  console.log('🔧 Test 3: MCP Protocol - Initialize')
  const init = await makeRequest(`${baseUrl}/mcp`, {
    method: 'POST',
    body: JSON.stringify({
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: {
          name: 'test-client',
          version: '1.0.0'
        }
      }
    })
  })
  
  test(
    'Initialize MCP réussie',
    init.ok,
    init.error || `Status: ${init.status}`
  )
  
  if (init.ok) {
    test(
      'Response contient protocolVersion',
      init.data?.protocolVersion === '2024-11-05',
      `Version reçue: ${init.data?.protocolVersion}`
    )
  }

  // Test 4: MCP Protocol - Tools List
  console.log('📋 Test 4: MCP Protocol - Tools List')
  const mcpTools = await makeRequest(`${baseUrl}/mcp`, {
    method: 'POST',
    body: JSON.stringify({
      method: 'tools/list'
    })
  })
  
  test(
    'Tools/list MCP réussie',
    mcpTools.ok,
    mcpTools.error || `Status: ${mcpTools.status}`
  )
  
  if (mcpTools.ok) {
    test(
      'Response contient des outils',
      Array.isArray(mcpTools.data?.tools),
      `Type: ${typeof mcpTools.data?.tools}`
    )
  }

  // Test 5: MCP Protocol - Tool Execution (si API key valide)
  console.log('⚙️ Test 5: MCP Protocol - Tool Execution')
  const toolExec = await makeRequest(`${baseUrl}/mcp`, {
    method: 'POST',
    body: JSON.stringify({
      method: 'tools/call',
      params: {
        name: 'get_system_stats',
        arguments: {}
      }
    })
  })
  
  test(
    'Tool execution réussie',
    toolExec.ok,
    toolExec.error || `Status: ${toolExec.status} - ${JSON.stringify(toolExec.data?.error || {})}`
  )
  
  if (toolExec.ok && toolExec.data?.content) {
    test(
      'Tool response contient du contenu',
      toolExec.data.content.length > 0,
      `Content length: ${toolExec.data.content.length}`
    )
  }

  // Test 6: Error Handling
  console.log('🚨 Test 6: Error Handling')
  const badMethod = await makeRequest(`${baseUrl}/mcp`, {
    method: 'POST',
    body: JSON.stringify({
      method: 'nonexistent/method'
    })
  })
  
  test(
    'Méthode inexistante retourne erreur',
    !badMethod.ok || badMethod.data?.error,
    `Status: ${badMethod.status}`
  )

  // Résumé
  console.log('📊 Résumé des tests')
  console.log(`✅ Tests réussis: ${passedTests}/${totalTests}`)
  console.log(`📈 Taux de réussite: ${Math.round((passedTests / totalTests) * 100)}%`)
  
  if (passedTests === totalTests) {
    console.log('')
    console.log('🎉 Tous les tests sont passés ! Ton intégration MCP est prête.')
    console.log('')
    console.log('📝 Prochaines étapes:')
    console.log('1. Configure Claude avec l\'URL:', `${baseUrl}/mcp`)
    console.log('2. Utilise une vraie API key depuis /settings/security')
    console.log('3. Test avec Claude: "Connecte-toi à mon serveur Kalya"')
  } else {
    console.log('')
    console.log('⚠️ Certains tests ont échoué. Vérifie:')
    console.log('1. Que Kalya est démarré et accessible')
    console.log('2. Que l\'API key est valide')
    console.log('3. Les logs d\'erreur dans tmp/logs/app.log')
  }
  
  console.log('')
}

// Vérification des dépendances
if (typeof fetch === 'undefined') {
  console.error('❌ Node.js 18+ requis (pour fetch API)')
  process.exit(1)
}

if (!process.argv[2]) {
  console.log('⚠️ Usage: node scripts/test_mcp.js [API_KEY] [BASE_URL]')
  console.log('📝 API_KEY: Récupère une clé depuis /settings/security dans Kalya')
  console.log('🌐 BASE_URL: URL de ton serveur Kalya (défaut: http://localhost:3333)')
  console.log('')
  console.log('💡 Exemple: node scripts/test_mcp.js abc123def456 http://localhost:3333')
  console.log('')
}

// Lancer les tests
runTests().catch(console.error)
