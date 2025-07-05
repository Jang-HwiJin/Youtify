// Popup script for YouTube to Spotify extension
document.addEventListener('DOMContentLoaded', function() {
  const authIndicator = document.getElementById('auth-indicator');
  const authText = document.getElementById('auth-text');
  const authButton = document.getElementById('auth-button');
  const playlistSection = document.getElementById('playlist-section');
  const playlistSelect = document.getElementById('playlist-select');
  const refreshPlaylistsBtn = document.getElementById('refresh-playlists');
  const createPlaylistBtn = document.getElementById('create-playlist-btn');
  const statusSection = document.getElementById('status-section');
  const statusMessage = document.getElementById('status-message');
  const optionsButton = document.getElementById('options-button');
  const debugButton = document.getElementById('debug-button');
  
  // Modal elements
  const createPlaylistModal = document.getElementById('create-playlist-modal');
  const closeModalBtn = document.getElementById('close-modal');
  const cancelCreateBtn = document.getElementById('cancel-create');
  const confirmCreateBtn = document.getElementById('confirm-create');
  const playlistNameInput = document.getElementById('playlist-name');
  const playlistDescriptionInput = document.getElementById('playlist-description');

  // Initialize popup
  init();

  async function init() {
    setupEventListeners();
    await checkAuthStatus();
  }

  function setupEventListeners() {
    authButton.addEventListener('click', handleAuth);
    refreshPlaylistsBtn.addEventListener('click', loadPlaylists);
    createPlaylistBtn.addEventListener('click', showCreatePlaylistModal);
    optionsButton.addEventListener('click', openOptionsPage);
    debugButton.addEventListener('click', showDebugInfo);
    
    // Modal event listeners
    closeModalBtn.addEventListener('click', hideCreatePlaylistModal);
    cancelCreateBtn.addEventListener('click', hideCreatePlaylistModal);
    confirmCreateBtn.addEventListener('click', handleCreatePlaylist);
    
    // Close modal when clicking outside
    createPlaylistModal.addEventListener('click', function(e) {
      if (e.target === createPlaylistModal) {
        hideCreatePlaylistModal();
      }
    });
    
    // Playlist selection
    playlistSelect.addEventListener('change', handlePlaylistSelection);
    
    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        hideCreatePlaylistModal();
      }
    });
  }

  async function checkAuthStatus() {
    try {
      authIndicator.className = 'indicator loading';
      authText.textContent = 'Checking authentication...';
      
      const result = await chrome.storage.sync.get(['spotify_access_token', 'token_expires_at']);
      
      if (result.spotify_access_token && result.token_expires_at && Date.now() < result.token_expires_at) {
        // Token is valid
        authIndicator.className = 'indicator connected';
        authText.textContent = 'Connected to Spotify';
        authButton.style.display = 'none';
        playlistSection.style.display = 'block';
        showStatus('Ready to add songs to Spotify!', 'success');
        // Load playlists only after authentication is confirmed
        await loadPlaylists();
      } else {
        // Token is expired or doesn't exist
        authIndicator.className = 'indicator disconnected';
        authText.textContent = 'Not connected to Spotify';
        authButton.style.display = 'block';
        playlistSection.style.display = 'none';
        showStatus('Please connect to Spotify to use this extension', 'info');
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      authIndicator.className = 'indicator disconnected';
      authText.textContent = 'Authentication error';
      authButton.style.display = 'block';
      playlistSection.style.display = 'none';
      showStatus('Error checking authentication status', 'error');
    }
  }

  async function handleAuth() {
    try {
      authButton.disabled = true;
      authButton.textContent = 'Connecting...';
      authIndicator.className = 'indicator loading';
      authText.textContent = 'Connecting to Spotify...';
      
      // Send message to background script to handle auth
      const response = await new Promise((resolve) => {
        chrome.runtime.sendMessage({ action: 'authorize' }, resolve);
      });
      
      if (response && response.success) {
        authIndicator.className = 'indicator connected';
        authText.textContent = 'Connected to Spotify';
        authButton.style.display = 'none';
        playlistSection.style.display = 'block';
        showStatus('Successfully connected to Spotify!', 'success');
        await loadPlaylists();
      } else {
        throw new Error(response?.error || 'Authentication failed');
      }
    } catch (error) {
      console.error('Auth error:', error);
      authIndicator.className = 'indicator disconnected';
      authText.textContent = 'Authentication failed';
      authButton.disabled = false;
      authButton.textContent = 'Connect to Spotify';
      showStatus('Failed to connect to Spotify: ' + error.message, 'error');
    }
  }

  async function loadPlaylists() {
    try {
      refreshPlaylistsBtn.disabled = true;
      const refreshIcon = refreshPlaylistsBtn.querySelector('svg');
      if (refreshIcon) {
        refreshIcon.style.animation = 'spin 1s linear infinite';
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
          showStatus('Failed to load playlists: ' + (response?.error || 'Unknown error'), 'error');
        }
      }
    } catch (error) {
      console.error('Error loading playlists:', error);
      showStatus('Failed to load playlists: ' + error.message, 'error');
    } finally {
      refreshPlaylistsBtn.disabled = false;
      const refreshIcon = refreshPlaylistsBtn.querySelector('svg');
      if (refreshIcon) {
        refreshIcon.style.animation = '';
      }
    }
  }

  function populatePlaylistSelect(playlists) {
    playlistSelect.innerHTML = '<option value="">Select a playlist...</option>';
    
    playlists.forEach(playlist => {
      const option = document.createElement('option');
      option.value = playlist.id;
      option.textContent = `${playlist.name} (${playlist.tracks.total} tracks)`;
      option.dataset.name = playlist.name;
      playlistSelect.appendChild(option);
    });
  }

  async function loadSelectedPlaylist() {
    try {
      const result = await chrome.storage.sync.get(['target_playlist']);
      if (result.target_playlist) {
        playlistSelect.value = result.target_playlist.id;
      }
    } catch (error) {
      console.error('Error loading selected playlist:', error);
    }
  }

  async function handlePlaylistSelection() {
    const selectedOption = playlistSelect.options[playlistSelect.selectedIndex];
    
    if (selectedOption.value) {
      const playlist = {
        id: selectedOption.value,
        name: selectedOption.dataset.name
      };
      
      try {
        await chrome.storage.sync.set({ target_playlist: playlist });
        showStatus(`Target playlist set to "${playlist.name}"`, 'success');
      } catch (error) {
        console.error('Error saving playlist selection:', error);
        showStatus('Failed to save playlist selection', 'error');
      }
    } else {
      try {
        await chrome.storage.sync.remove(['target_playlist']);
        showStatus('No playlist selected', 'info');
      } catch (error) {
        console.error('Error clearing playlist selection:', error);
      }
    }
  }

  function showCreatePlaylistModal() {
    createPlaylistModal.style.display = 'flex';
    playlistNameInput.focus();
    playlistNameInput.select();
  }

  function hideCreatePlaylistModal() {
    createPlaylistModal.style.display = 'none';
    playlistNameInput.value = 'YouTube Favorites';
    playlistDescriptionInput.value = 'Songs discovered from YouTube';
  }

  async function handleCreatePlaylist() {
    const name = playlistNameInput.value.trim();
    const description = playlistDescriptionInput.value.trim();
    
    if (!name) {
      showStatus('Please enter a playlist name', 'error');
      return;
    }
    
    try {
      confirmCreateBtn.disabled = true;
      confirmCreateBtn.textContent = 'Creating...';
      
      const response = await new Promise((resolve) => {
        chrome.runtime.sendMessage({
          action: 'createPlaylist',
          name: name,
          description: description
        }, resolve);
      });
      
      if (response && response.success) {
        hideCreatePlaylistModal();
        showStatus(`Created playlist "${name}"`, 'success');
        await loadPlaylists();
        
        // Auto-select the new playlist
        playlistSelect.value = response.playlist.id;
        await handlePlaylistSelection();
      } else {
        throw new Error(response?.error || 'Failed to create playlist');
      }
    } catch (error) {
      console.error('Error creating playlist:', error);
      showStatus('Failed to create playlist: ' + error.message, 'error');
    } finally {
      confirmCreateBtn.disabled = false;
      confirmCreateBtn.textContent = 'Create Playlist';
    }
  }

  function showStatus(message, type) {
    statusMessage.textContent = message;
    statusMessage.className = `status-message ${type}`;
    statusSection.style.display = 'block';
    
    // Auto-hide after 5 seconds for success messages
    if (type === 'success') {
      setTimeout(() => {
        statusSection.style.display = 'none';
      }, 5000);
    }
  }

  function openOptionsPage() {
    chrome.runtime.openOptionsPage();
  }

  function showDebugInfo() {
    const redirectUri = chrome.identity.getRedirectURL();
    const manifest = chrome.runtime.getManifest();
    const clientId = manifest.oauth2.client_id;
    
    const debugInfo = `
=== YouTube to Spotify Extension Debug Info ===

🔗 Redirect URI (copy this to Spotify app settings):
${redirectUri}

🆔 Current Client ID:
${clientId}

📋 Setup Steps:
1. Go to https://developer.spotify.com/dashboard
2. Select your app → Edit Settings
3. Add this redirect URI: ${redirectUri}
4. Save settings
5. Make sure your Client ID is correct in manifest.json

Current Status: ${clientId === 'YOUR_SPOTIFY_CLIENT_ID' ? 'Need to update Client ID' : 'Client ID set'}
    `;
    
    console.log(debugInfo);
    
    // Try to copy redirect URI to clipboard
    navigator.clipboard.writeText(redirectUri).then(() => {
      showStatus('Redirect URI copied to clipboard! Check console for full debug info.', 'success');
    }).catch(() => {
      showStatus('Debug info logged to console. Check console for setup details.', 'info');
    });
  }
});

// Add spinning animation for refresh button
const style = document.createElement('style');
style.textContent = `
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;
document.head.appendChild(style);
