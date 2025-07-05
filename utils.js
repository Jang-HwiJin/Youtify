// Shared utility functions

const Utils = {
  // Debounce function to prevent excessive API calls
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

  // Format time duration
  formatDuration: function(ms) {
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(0);
    return minutes + ":" + (seconds < 10 ? '0' : '') + seconds;
  },

  // Clean song title for better matching
  cleanSongTitle: function(title) {
    return title
      .replace(/\s*\(official\s*(video|music\s*video|audio|lyric\s*video)\)/gi, '')
      .replace(/\s*\[official\s*(video|music\s*video|audio|lyric\s*video)\]/gi, '')
      .replace(/\s*-\s*(official\s*)?(video|music\s*video|audio|lyric\s*video)/gi, '')
      .replace(/\s*\|\s*(official\s*)?(video|music\s*video|audio|lyric\s*video)/gi, '')
      .replace(/\s*\(lyrics?\)/gi, '')
      .replace(/\s*\[lyrics?\]/gi, '')
      .replace(/\s*-\s*lyrics?/gi, '')
      .replace(/\s*\|\s*lyrics?/gi, '')
      .replace(/\s*\(live\s*(performance|version|at).*?\)/gi, '')
      .replace(/\s*\[live\s*(performance|version|at).*?\]/gi, '')
      .replace(/\s*\(acoustic\s*(version)?\)/gi, '')
      .replace(/\s*\[acoustic\s*(version)?\]/gi, '')
      .replace(/\s*\(cover\s*(version)?\)/gi, '')
      .replace(/\s*\[cover\s*(version)?\]/gi, '')
      .replace(/\s*\(remix\)/gi, '')
      .replace(/\s*\[remix\]/gi, '')
      .replace(/\s*\(karaoke\)/gi, '')
      .replace(/\s*\[karaoke\]/gi, '')
      .replace(/\s*\(instrumental\)/gi, '')
      .replace(/\s*\[instrumental\]/gi, '')
      .replace(/\s*\(extended\s*(version|mix)?\)/gi, '')
      .replace(/\s*\[extended\s*(version|mix)?\]/gi, '')
      .replace(/\s*\(radio\s*(edit|version)?\)/gi, '')
      .replace(/\s*\[radio\s*(edit|version)?\]/gi, '')
      .replace(/\s*\(clean\s*(version)?\)/gi, '')
      .replace(/\s*\[clean\s*(version)?\]/gi, '')
      .replace(/\s*\(explicit\s*(version)?\)/gi, '')
      .replace(/\s*\[explicit\s*(version)?\]/gi, '')
      .replace(/\s*\(remastered\)/gi, '')
      .replace(/\s*\[remastered\]/gi, '')
      .replace(/\s*\(\d{4}\)/gi, '')
      .replace(/\s*\[\d{4}\]/gi, '')
      .replace(/\s*\(HD\)/gi, '')
      .replace(/\s*\[HD\]/gi, '')
      .replace(/\s*\(4K\)/gi, '')
      .replace(/\s*\[4K\]/gi, '')
      .replace(/\s*\(60fps\)/gi, '')
      .replace(/\s*\[60fps\]/gi, '')
      .trim();
  },

  // Show toast notification
  showToast: function(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `yt-spotify-toast yt-spotify-toast-${type}`;
    toast.textContent = message;
    
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
      color: white;
      padding: 12px 24px;
      border-radius: 4px;
      font-size: 14px;
      font-weight: 500;
      z-index: 10000;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
      animation: slideIn 0.3s ease-out;
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'slideOut 0.3s ease-in';
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, 3000);
  },

  // Storage helpers
  storage: {
    get: function(keys) {
      return new Promise((resolve) => {
        chrome.storage.sync.get(keys, resolve);
      });
    },
    
    set: function(items) {
      return new Promise((resolve) => {
        chrome.storage.sync.set(items, resolve);
      });
    }
  },

  // Validate Spotify client ID format
  validateSpotifyClientId: function(clientId) {
    return /^[a-zA-Z0-9]{32}$/.test(clientId);
  },

  // Generate random state for OAuth
  generateRandomState: function() {
    const array = new Uint32Array(4);
    crypto.getRandomValues(array);
    return Array.from(array, dec => ('0' + dec.toString(16)).substr(-2)).join('');
  }
};

// Add CSS for toast animations
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    @keyframes slideOut {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(100%);
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(style);
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Utils;
}
