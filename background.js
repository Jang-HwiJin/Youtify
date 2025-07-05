// Background service worker for handling Spotify API calls and OAuth
class SpotifyAPI {
  constructor() {
    this.baseURL = 'https://api.spotify.com/v1';
    this.authURL = 'https://accounts.spotify.com/api/token';
    this.clientId = chrome.runtime.getManifest().oauth2.client_id;
  }

  async getAccessToken() {
    try {
      const result = await chrome.storage.sync.get(['spotify_access_token', 'spotify_refresh_token', 'token_expires_at']);
      
      if (result.spotify_access_token && result.token_expires_at && Date.now() < result.token_expires_at) {
        return result.spotify_access_token;
      }
      
      if (result.spotify_refresh_token) {
        return await this.refreshAccessToken(result.spotify_refresh_token);
      }
      
      return await this.authorizeUser();
    } catch (error) {
      console.error('Error getting access token:', error);
      throw error;
    }
  }

  // Generate PKCE code verifier and challenge
  generateCodeVerifier() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return this.base64URLEncode(array);
  }

  async generateCodeChallenge(verifier) {
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return this.base64URLEncode(new Uint8Array(digest));
  }

  base64URLEncode(array) {
    return btoa(String.fromCharCode(...array))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  async authorizeUser() {
    return new Promise(async (resolve, reject) => {
      const redirectURL = chrome.identity.getRedirectURL();
      console.log('Extension redirect URL:', redirectURL);
      
      // Check if client ID is still placeholder
      if (this.clientId === 'YOUR_SPOTIFY_CLIENT_ID') {
        reject(new Error('Please update the SPOTIFY_CLIENT_ID in manifest.json with your actual Spotify app Client ID'));
        return;
      }
      
      // Generate PKCE parameters
      const codeVerifier = this.generateCodeVerifier();
      const codeChallenge = await this.generateCodeChallenge(codeVerifier);
      
      // Store code verifier for later use
      await chrome.storage.local.set({ pkce_code_verifier: codeVerifier });
      
      const authURL = `https://accounts.spotify.com/authorize?` +
        `client_id=${this.clientId}&` +
        `response_type=code&` +
        `redirect_uri=${encodeURIComponent(redirectURL)}&` +
        `scope=${encodeURIComponent('playlist-modify-public playlist-modify-private playlist-read-private user-read-private')}&` +
        `code_challenge=${codeChallenge}&` +
        `code_challenge_method=S256&` +
        `show_dialog=true`;

      console.log('Authorization URL:', authURL);

      chrome.identity.launchWebAuthFlow({
        url: authURL,
        interactive: true
      }, async (responseUrl) => {
        if (chrome.runtime.lastError) {
          console.error('Auth flow error:', chrome.runtime.lastError);
          reject(new Error(`Authorization failed: ${chrome.runtime.lastError.message}. Make sure you've added ${redirectURL} to your Spotify app's redirect URIs.`));
          return;
        }

        if (!responseUrl) {
          reject(new Error('Authorization was cancelled or failed'));
          return;
        }

        console.log('Response URL:', responseUrl);
        
        const url = new URL(responseUrl);
        const code = url.searchParams.get('code');
        const error = url.searchParams.get('error');
        
        if (error) {
          reject(new Error(`Spotify authorization error: ${error}`));
          return;
        }
        
        if (code) {
          try {
            const token = await this.exchangeCodeForToken(code);
            resolve(token);
          } catch (error) {
            reject(error);
          }
        } else {
          reject(new Error('No authorization code received from Spotify'));
        }
      });
    });
  }

  async exchangeCodeForToken(code) {
    const redirectURL = chrome.identity.getRedirectURL();
    
    // Get the stored code verifier
    const result = await chrome.storage.local.get(['pkce_code_verifier']);
    const codeVerifier = result.pkce_code_verifier;
    
    if (!codeVerifier) {
      throw new Error('PKCE code verifier not found');
    }
    
    const response = await fetch(this.authURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectURL,
        client_id: this.clientId,
        code_verifier: codeVerifier
      })
    });

    const data = await response.json();
    
    console.log('Token exchange response:', data);
    
    if (data.access_token) {
      await chrome.storage.sync.set({
        spotify_access_token: data.access_token,
        spotify_refresh_token: data.refresh_token,
        token_expires_at: Date.now() + (data.expires_in * 1000)
      });
      return data.access_token;
    }
    
    if (data.error) {
      throw new Error(`Spotify API error: ${data.error} - ${data.error_description}`);
    }
    
    throw new Error('Failed to get access token');
  }

  async refreshAccessToken(refreshToken) {
    const response = await fetch(this.authURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: this.clientId
      })
    });

    const data = await response.json();
    
    if (data.access_token) {
      await chrome.storage.sync.set({
        spotify_access_token: data.access_token,
        token_expires_at: Date.now() + (data.expires_in * 1000)
      });
      return data.access_token;
    }
    
    throw new Error('Failed to refresh access token');
  }

  async searchTrack(query) {
    const token = await this.getAccessToken();
    const response = await fetch(`${this.baseURL}/search?q=${encodeURIComponent(query)}&type=track&limit=1`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    return data.tracks.items[0] || null;
  }

  async addToPlaylist(playlistId, trackUri) {
    const token = await this.getAccessToken();
    const response = await fetch(`${this.baseURL}/playlists/${playlistId}/tracks`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        uris: [trackUri]
      })
    });

    return response.ok;
  }

  async getUserPlaylists() {
    const token = await this.getAccessToken();
    const response = await fetch(`${this.baseURL}/me/playlists?limit=50`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    return data.items || [];
  }

  async createPlaylist(name, description) {
    const token = await this.getAccessToken();
    const userResponse = await fetch(`${this.baseURL}/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const user = await userResponse.json();
    
    const response = await fetch(`${this.baseURL}/users/${user.id}/playlists`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: name,
        description: description,
        public: false
      })
    });

    return await response.json();
  }
}

const spotifyAPI = new SpotifyAPI();

// Message handler for content script and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'addToSpotify') {
    handleAddToSpotify(request.songInfo)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Keep message channel open for async response
  }
  
  if (request.action === 'getPlaylists') {
    // Check if user is authenticated before trying to get playlists
    chrome.storage.sync.get(['spotify_access_token', 'token_expires_at'])
      .then(result => {
        if (!result.spotify_access_token || !result.token_expires_at || Date.now() >= result.token_expires_at) {
          sendResponse({ success: false, error: 'Not authenticated with Spotify' });
          return;
        }
        
        spotifyAPI.getUserPlaylists()
          .then(playlists => sendResponse({ success: true, playlists }))
          .catch(error => sendResponse({ success: false, error: error.message }));
      })
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
  
  if (request.action === 'createPlaylist') {
    // Check if user is authenticated before trying to create playlist
    chrome.storage.sync.get(['spotify_access_token', 'token_expires_at'])
      .then(result => {
        if (!result.spotify_access_token || !result.token_expires_at || Date.now() >= result.token_expires_at) {
          sendResponse({ success: false, error: 'Not authenticated with Spotify' });
          return;
        }
        
        spotifyAPI.createPlaylist(request.name, request.description)
          .then(playlist => sendResponse({ success: true, playlist }))
          .catch(error => sendResponse({ success: false, error: error.message }));
      })
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
  
  if (request.action === 'authorize') {
    spotifyAPI.authorizeUser()
      .then(token => sendResponse({ success: true, token }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
});

async function handleAddToSpotify(songInfo) {
  try {
    // Get target playlist from storage
    const { target_playlist } = await chrome.storage.sync.get(['target_playlist']);
    
    if (!target_playlist) {
      throw new Error('No target playlist set. Please configure in options.');
    }

    // Search for the track on Spotify
    const searchQuery = `${songInfo.title} ${songInfo.artist}`.trim();
    const track = await spotifyAPI.searchTrack(searchQuery);
    
    if (!track) {
      // Show notification for song not found
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon.svg',
        title: 'Song Not Found',
        message: `${songInfo.title} not found on Spotify`
      });
      
      return { success: false, error: 'Song not found on Spotify' };
    }

    // Add to playlist
    const added = await spotifyAPI.addToPlaylist(target_playlist.id, track.uri);
    
    if (added) {
      // Show success notification
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon.svg',
        title: 'Added to Spotify',
        message: `${track.name} added to ${target_playlist.name}`
      });
      
      return { 
        success: true, 
        track: track, 
        playlist: target_playlist 
      };
    } else {
      throw new Error('Failed to add song to playlist');
    }
    
  } catch (error) {
    console.error('Error adding to Spotify:', error);
    
    // Show error notification
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon.svg',
      title: 'Error',
      message: error.message
    });
    
    return { success: false, error: error.message };
  }
}

// Initialize extension
chrome.runtime.onInstalled.addListener(() => {
  console.log('YouTube to Spotify extension installed');
  
  // Clear any stored PKCE verifiers on install/update
  chrome.storage.local.remove(['pkce_code_verifier']);
});
