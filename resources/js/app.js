// Utilitaires globaux pour l'application
console.log('🗺️ Cartographie Services Kalya - Chargé');

// Utilitaires pour les interactions
window.AppUtils = {
  // Copier du texte dans le presse-papier
  copyToClipboard: async function(text) {
    try {
      await navigator.clipboard.writeText(text);
      this.showToast('Copié dans le presse-papier!', 'success');
    } catch (err) {
      // Fallback pour les navigateurs plus anciens
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      this.showToast('Copié dans le presse-papier!', 'success');
    }
  },

  // Afficher une notification toast
  showToast: function(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `alert alert-${type} fixed top-4 right-4 w-auto max-w-sm z-50 shadow-lg`;
    toast.innerHTML = `
      <svg class="w-6 h-6 stroke-current shrink-0" fill="none" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
      </svg>
      <span>${message}</span>
    `;

    document.body.appendChild(toast);

    // Animation d'entrée
    setTimeout(() => {
      toast.style.transform = 'translateX(-100%)';
      toast.style.opacity = '1';
    }, 10);

    // Suppression automatique
    setTimeout(() => {
      toast.style.transform = 'translateX(100%)';
      toast.style.opacity = '0';
      setTimeout(() => {
        if (toast.parentNode) {
          document.body.removeChild(toast);
        }
      }, 300);
    }, 3000);
  },

  // Formater une date en français
  formatDate: function(date, format = 'short') {
    const d = new Date(date);
    const options = format === 'short'
      ? { day: '2-digit', month: '2-digit', year: 'numeric' }
      : { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' };

    return d.toLocaleDateString('fr-FR', options);
  },

  // Calculer le temps depuis une date
  timeAgo: function(date) {
    const now = new Date();
    const past = new Date(date);
    const diff = now - past;

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) return `il y a ${days} jour${days > 1 ? 's' : ''}`;
    if (hours > 0) return `il y a ${hours} heure${hours > 1 ? 's' : ''}`;
    if (minutes > 0) return `il y a ${minutes} minute${minutes > 1 ? 's' : ''}`;
    return 'à l\'instant';
  },

  // Débounce pour les recherches
  debounce: function(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  // Valider une adresse IP
  isValidIP: function(ip) {
    const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
    return ipv4Regex.test(ip) || ipv6Regex.test(ip);
  }
};

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', function() {
  // Auto-fermeture des alertes après 5 secondes
  const alerts = document.querySelectorAll('.alert');
  alerts.forEach(alert => {
    if (!alert.querySelector('.btn-close')) {
      setTimeout(() => {
        alert.style.opacity = '0';
        alert.style.transform = 'translateY(-10px)';
        setTimeout(() => {
          if (alert.parentNode) {
            alert.remove();
          }
        }, 300);
      }, 5000);
    }
  });

  // Amélioration de l'accessibilité pour les menus dropdown
  const dropdowns = document.querySelectorAll('.dropdown');
  dropdowns.forEach(dropdown => {
    const toggle = dropdown.querySelector('[tabindex="0"]');
    const menu = dropdown.querySelector('.dropdown-content');

    if (toggle && menu) {
      toggle.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggle.click();
        }
      });
    }
  });

  // Amélioration des formulaires
  const forms = document.querySelectorAll('form');
  forms.forEach(form => {
    // Validation en temps réel pour les IPs
    const ipInputs = form.querySelectorAll('input[name="ip"]');
    ipInputs.forEach(input => {
      input.addEventListener('blur', function() {
        if (this.value && !AppUtils.isValidIP(this.value)) {
          this.classList.add('input-error');
          this.setCustomValidity('Adresse IP invalide');
        } else {
          this.classList.remove('input-error');
          this.setCustomValidity('');
        }
      });
    });

    // Prévention de la double soumission
    form.addEventListener('submit', function() {
      const submitButton = this.querySelector('button[type="submit"]');
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.innerHTML = '<span class="loading loading-spinner loading-sm"></span> Traitement...';

        // Réactiver après 10 secondes au cas où
        setTimeout(() => {
          submitButton.disabled = false;
          submitButton.innerHTML = submitButton.dataset.originalText || 'Soumettre';
        }, 10000);
      }
    });
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', function(e) {
    // Ctrl+K pour ouvrir la recherche (si disponible)
    if (e.ctrlKey && e.key === 'k') {
      e.preventDefault();
      const searchInput = document.querySelector('#search-servers, #search-services');
      if (searchInput) {
        searchInput.focus();
      }
    }

    // Échap pour fermer les modales et détails
    if (e.key === 'Escape') {
      const serviceDetails = document.getElementById('service-details');
      if (serviceDetails && !serviceDetails.classList.contains('hidden')) {
        serviceDetails.classList.add('hidden');
      }
    }
  });

  console.log('✅ Utilitaires chargés et initialisés');
});

// Export global pour compatibilité
window.copyToClipboard = AppUtils.copyToClipboard;
