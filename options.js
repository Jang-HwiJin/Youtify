// Options page script
document.addEventListener('DOMContentLoaded', function() {
  // DOM elements
  const authIndicator = document.getElementById('auth-indicator');
  const authText = document.getElementById('auth-text');
  const authDetails = document.getElementById('auth-details');
  const connectBtn = document.getElementById('connect-btn');
  const disconnectBtn = document.getElementById('disconnect-btn');
  const targetPlaylistSelect = document.getElementById('target-playlist');
  const refreshPlaylistsBtn = document.getElementById('refresh-playlists');
  const createPlaylistBtn = document.getElementById('create-playlist');
  const saveSettingsBtn = document.getElementById('save-settings');
  const saveStatus = document.getElementById('save-status');
  
  // Settings elements
  const enableSmartMatching = document.getElementById('enable-smart-matching');
  const autoAddLiked = document.getElementById('auto-add-liked');
  const enableNotifications = document.getElementById('enable-notifications');
  const enableSuccessNotifications = document.getElementById('enable-success-notifications');
  const enableErrorNotifications = document.getElementById('enable-error-notifications');
  const apiTimeout = document.getElementById('api-timeout');
  const maxRetries = document.getElementById('max-retries');
  
  // Modal elements
  const createPlaylistModal = document.getElementById('create-playlist-modal');
  const closeModalBtn = document.getElementById('close-modal');
  const cancelCreateBtn = document.getElementById('cancel-create');
  const confirmCreateBtn = document.getElementById('confirm-create');
  const playlistNameInput = document.getElementById('playlist-name');
  const playlistDescriptionInput = document.getElementById('playlist-description');
  const playlistPublicCheckbox = document.getElementById('playlist-public');
  
  // Other elements
  const viewLogsBtn = document.getElementById('view-logs');
  const resetSettingsBtn = document.getElementById('reset-settings');

  // Initialize
  init();

  async function init() {
    await loadSettings();
    setupEventListeners();
    await checkAuthStatus();
  }

  function setupEventListeners() {
    // Auth buttons
    connectBtn.addEventListener('click', handleConnect);
    disconnectBtn.addEventListener('click', handleDisconnect);
    
    // Playlist actions
    refreshPlaylistsBtn.addEventListener('click', loadPlaylists);
    createPlaylistBtn.addEventListener('click', showCreateModal);
    targetPlaylistSelect.addEventListener('change', handlePlaylistChange);
    
    // Settings
    saveSettingsBtn.addEventListener('click', saveSettings);
    
    // Modal
    closeModalBtn.addEventListener('click', hideCreateModal);
    cancelCreateBtn.addEventListener('click', hideCreateModal);
    confirmCreateBtn.addEventListener('click', handleCreatePlaylist);
    
    // Other actions
    viewLogsBtn.addEventListener('click', viewLogs);
    resetSettingsBtn.addEventListener('click', resetSettings);
    
    // Close modal on outside click
    createPlaylistModal.addEventListener('click', function(e) {
      if (e.target === createPlaylistModal) {
        hideCreateModal();
      }
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        hideCreateModal();
      }
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        saveSettings();
      }
    });
  }

  async function loadSettings() {
    try {
      const settings = await chrome.storage.sync.get([
        'enable_smart_matching',
        'auto_add_liked',
        'enable_notifications',
        'enable_success_notifications',
        'enable_error_notifications',
        'api_timeout',
        'max_retries'
      ]);
      
      // Load settings with defaults
      enableSmartMatching.checked = settings.enable_smart_matching !== false;
      autoAddLiked.checked = settings.auto_add_liked !== false;
      enableNotifications.checked = settings.enable_notifications !== false;
      enableSuccessNotifications.checked = settings.enable_success_notifications !== false;
      enableErrorNotifications.checked = settings.enable_error_notifications !== false;
      apiTimeout.value = settings.api_timeout || 10;
      maxRetries.value = settings.max_retries || 2;
      
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }

  async function saveSettings() {
    try {
      saveSettingsBtn.disabled = true;
      saveSettingsBtn.textContent = 'Saving...';
      
      const settings = {
        enable_smart_matching: enableSmartMatching.checked,
        auto_add_liked: autoAddLiked.checked,
        enable_notifications: enableNotifications.checked,
        enable_success_notifications: enableSuccessNotifications.checked,
        enable_error_notifications: enableErrorNotifications.checked,
        api_timeout: parseInt(apiTimeout.value),
        max_retries: parseInt(maxRetries.value)
      };
      
      await chrome.storage.sync.set(settings);
      
      saveStatus.textContent = 'Settings saved successfully';
      saveStatus.className = 'save-status success';
      
      setTimeout(() => {
        saveStatus.textContent = '';
        saveStatus.className = 'save-status';
      }, 3000);
      
    } catch (error) {
      console.error('Error saving settings:', error);
      saveStatus.textContent = 'Error saving settings';
      saveStatus.className = 'save-status error';
    } finally {
      saveSettingsBtn.disabled = false;
      saveSettingsBtn.textContent = 'Save Settings';
    }
  }

  async function checkAuthStatus() {
    try {
      authIndicator.className = 'indicator loading';
      authText.textContent = 'Checking connection...';
      authDetails.textContent = '';
      
      const result = await chrome.storage.sync.get(['spotify_access_token', 'token_expires_at']);
      
      if (result.spotify_access_token && result.token_expires_at && Date.now() < result.token_expires_at) {
        authIndicator.className = 'indicator connected';
        authText.textContent = 'Connected to Spotify';
        authDetails.textContent = `Token expires: ${new Date(result.token_expires_at).toLocaleString()}`;
        connectBtn.style.display = 'none';
        disconnectBtn.style.display = 'inline-flex';
        // Load playlists only after authentication is confirmed
        await loadPlaylists();
      } else {
        authIndicator.className = 'indicator disconnected';
        authText.textContent = 'Not connected to Spotify';
        authDetails.textContent = 'Please connect your Spotify account to use this extension';
        connectBtn.style.display = 'inline-flex';
        disconnectBtn.style.display = 'none';
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      authIndicator.className = 'indicator disconnected';
      authText.textContent = 'Error checking connection';
      authDetails.textContent = error.message;
      connectBtn.style.display = 'inline-flex';
      disconnectBtn.style.display = 'none';
    }
  }

  async function handleConnect() {
    try {
      connectBtn.disabled = true;
      connectBtn.textContent = 'Connecting...';
      
      // This would trigger the OAuth flow
      // For now, we'll just show a message
      alert('Please use the extension popup to connect to Spotify');
      
    } catch (error) {
      console.error('Error connecting:', error);
      alert('Error connecting to Spotify: ' + error.message);
    } finally {
      connectBtn.disabled = false;
      connectBtn.textContent = 'Connect to Spotify';
    }
  }

  async function handleDisconnect() {
    if (confirm('Are you sure you want to disconnect from Spotify?')) {
      try {
        await chrome.storage.sync.remove(['spotify_access_token', 'spotify_refresh_token', 'token_expires_at']);
        await checkAuthStatus();
        targetPlaylistSelect.innerHTML = '<option value="">Select a playlist...</option>';
      } catch (error) {
        console.error('Error disconnecting:', error);
        alert('Error disconnecting from Spotify: ' + error.message);
      }
    }
  }

  async function loadPlaylists() {
    try {
      const refreshIcon = refreshPlaylistsBtn.querySelector('svg');
      refreshPlaylistsBtn.disabled = true;
      if (refreshIcon) {
        refreshIcon.classList.add('spinning');
      }
      
      const response = await new Promise((resolve) => {
        chrome.runtime.sendMessage({ action: 'getPlaylists' }, resolve);
      });
      
      if (response && response.success) {
        populatePlaylistSelect(response.playlists);
        await loadSelectedPlaylist();
      } else {
        // Don't show error for authentication issues - it's expected when not logged in
        if (response?.error !== 'Not authenticated with Spotify') {
          console.error('Error loading playlists:', response?.error);
          targetPlaylistSelect.innerHTML = '<option value="">Error loading playlists</option>';
        } else {
          targetPlaylistSelect.innerHTML = '<option value="">Connect to Spotify first</option>';
        }
      }
    } catch (error) {
      console.error('Error loading playlists:', error);
      targetPlaylistSelect.innerHTML = '<option value="">Error loading playlists</option>';
    } finally {
      refreshPlaylistsBtn.disabled = false;
      const refreshIcon = refreshPlaylistsBtn.querySelector('svg');
      if (refreshIcon) {
        refreshIcon.classList.remove('spinning');
      }
    }
  }

  function populatePlaylistSelect(playlists) {
    targetPlaylistSelect.innerHTML = '<option value="">Select a playlist...</option>';
    
    playlists.forEach(playlist => {
      const option = document.createElement('option');
      option.value = playlist.id;
      option.textContent = `${playlist.name} (${playlist.tracks.total} tracks)`;
      option.dataset.name = playlist.name;
      targetPlaylistSelect.appendChild(option);
    });
  }

  async function loadSelectedPlaylist() {
    try {
      const result = await chrome.storage.sync.get(['target_playlist']);
      if (result.target_playlist) {
        targetPlaylistSelect.value = result.target_playlist.id;
      }
    } catch (error) {
      console.error('Error loading selected playlist:', error);
    }
  }

  async function handlePlaylistChange() {
    const selectedOption = targetPlaylistSelect.options[targetPlaylistSelect.selectedIndex];
    
    if (selectedOption.value) {
      const playlist = {
        id: selectedOption.value,
        name: selectedOption.dataset.name
      };
      
      try {
        await chrome.storage.sync.set({ target_playlist: playlist });
        console.log('Target playlist updated:', playlist);
      } catch (error) {
        console.error('Error saving playlist selection:', error);
      }
    } else {
      try {
        await chrome.storage.sync.remove(['target_playlist']);
      } catch (error) {
        console.error('Error clearing playlist selection:', error);
      }
    }
  }

  function showCreateModal() {
    createPlaylistModal.style.display = 'flex';
    playlistNameInput.focus();
    playlistNameInput.select();
  }

  function hideCreateModal() {
    createPlaylistModal.style.display = 'none';
    playlistNameInput.value = 'YouTube Favorites';
    playlistDescriptionInput.value = 'Songs discovered from YouTube';
    playlistPublicCheckbox.checked = false;
  }

  async function handleCreatePlaylist() {
    const name = playlistNameInput.value.trim();
    const description = playlistDescriptionInput.value.trim();
    const isPublic = playlistPublicCheckbox.checked;
    
    if (!name) {
      alert('Please enter a playlist name');
      return;
    }
    
    try {
      confirmCreateBtn.disabled = true;
      confirmCreateBtn.textContent = 'Creating...';
      
      const response = await new Promise((resolve) => {
        chrome.runtime.sendMessage({
          action: 'createPlaylist',
          name: name,
          description: description,
          public: isPublic
        }, resolve);
      });
      
      if (response && response.success) {
        hideCreateModal();
        await loadPlaylists();
        
        // Auto-select the new playlist
        targetPlaylistSelect.value = response.playlist.id;
        await handlePlaylistChange();
        
        alert(`Created playlist "${name}"`);
      } else {
        throw new Error(response?.error || 'Failed to create playlist');
      }
    } catch (error) {
      console.error('Error creating playlist:', error);
      alert('Failed to create playlist: ' + error.message);
    } finally {
      confirmCreateBtn.disabled = false;
      confirmCreateBtn.textContent = 'Create Playlist';
    }
  }

  function viewLogs() {
    // Open a new tab with logs
    const logsWindow = window.open('', '_blank', 'width=800,height=600');
    logsWindow.document.write(`
      <html>
        <head>
          <title>YouTube to Spotify - Logs</title>
          <style>
            body { font-family: monospace; padding: 20px; background: #1a1a1a; color: #fff; }
            pre { background: #2a2a2a; padding: 10px; border-radius: 4px; overflow-x: auto; }
            .info { color: #4CAF50; }
            .warn { color: #ff9800; }
            .error { color: #f44336; }
          </style>
        </head>
        <body>
          <h1>YouTube to Spotify Extension Logs</h1>
          <p>This feature is not yet implemented. Check the browser console for debugging information.</p>
          <pre id="logs">
Extension logs will appear here in a future version.

For now, you can:
1. Open Chrome DevTools (F12)
2. Go to the Console tab
3. Look for messages from the extension
          </pre>
        </body>
      </html>
    `);
  }

  async function resetSettings() {
    if (confirm('Are you sure you want to reset all settings to default values?')) {
      try {
        await chrome.storage.sync.clear();
        await loadSettings();
        await checkAuthStatus();
        targetPlaylistSelect.innerHTML = '<option value="">Select a playlist...</option>';
        alert('Settings have been reset to default values');
      } catch (error) {
        console.error('Error resetting settings:', error);
        alert('Error resetting settings: ' + error.message);
      }
    }
  }
});
