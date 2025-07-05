# YouTube to Spotify Chrome Extension

## Overview

This is a Chrome extension that allows users to add YouTube songs to their Spotify playlists with one click. The extension integrates YouTube's web interface with Spotify's API to provide seamless music discovery and playlist management.

## System Architecture

### Chrome Extension Architecture
- **Manifest V3**: Uses the latest Chrome extension manifest format
- **Service Worker**: Background script handles API calls and OAuth authentication
- **Content Script**: Injected into YouTube pages to add UI elements and detect song information
- **Popup Interface**: Provides quick access to authentication status and playlist selection
- **Options Page**: Comprehensive settings and configuration interface

### Authentication Flow
- **OAuth 2.0**: Spotify Web API authentication using Chrome's identity API
- **Token Management**: Automatic token refresh and secure storage using Chrome's sync storage
- **Scopes**: Requests permissions for playlist modification and user profile access

## Key Components

### Background Service Worker (`background.js`)
- Manages Spotify API authentication and token lifecycle
- Handles OAuth flow using Chrome's identity API
- Provides centralized API communication layer
- Implements token refresh mechanism

### Content Script (`content.js`)
- Injects "Add to Spotify" button into YouTube watch pages
- Monitors YouTube SPA navigation using MutationObserver
- Extracts video metadata (title, channel, duration) for song matching
- Provides visual feedback during song addition process

### Popup Interface (`popup.html/js`)
- Quick authentication status check
- Playlist selection dropdown
- Create new playlist functionality
- Direct access to options page

### Options Page (`options.html/js`)
- Comprehensive settings management
- Spotify connection status and controls
- Playlist management (create, refresh, select default)
- Advanced matching and notification preferences
- API timeout and retry configurations

### Utility Functions (`utils.js`)
- Song title cleaning for better Spotify matching
- Debounce functions for API rate limiting
- Duration formatting utilities
- Common helper functions shared across components

## Data Flow

1. **User Authentication**: User clicks connect → Chrome identity API → Spotify OAuth → Token storage
2. **Song Detection**: YouTube page load → Content script extracts metadata → Sends to background
3. **Spotify Search**: Background script searches Spotify API → Returns best match
4. **Playlist Addition**: User confirms → Background adds track to selected playlist → Visual feedback
5. **Settings Sync**: Configuration changes stored in Chrome sync storage → Available across devices

## External Dependencies

### Chrome APIs
- `chrome.identity`: OAuth authentication flow
- `chrome.storage.sync`: Cross-device settings synchronization
- `chrome.notifications`: User feedback notifications
- `chrome.tabs`: Active tab management

### Spotify Web API
- **Authentication**: OAuth 2.0 with refresh tokens
- **Search**: Track and artist matching
- **Playlists**: Read, create, and modify user playlists
- **Required Scopes**: 
  - `playlist-modify-public`
  - `playlist-modify-private`
  - `playlist-read-private`
  - `user-read-private`

### YouTube Integration
- **DOM Manipulation**: Injects UI elements into YouTube's interface
- **SPA Navigation**: Handles YouTube's single-page application routing
- **Metadata Extraction**: Parses video titles, channels, and durations

## Deployment Strategy

### Development Setup
1. Clone repository
2. Add Spotify Client ID to manifest.json
3. Configure OAuth redirect URI in Spotify Developer Dashboard
4. Load unpacked extension in Chrome Developer Mode

### Production Distribution
- Chrome Web Store publication
- Extension packaging with proper permissions
- Spotify app registration and approval process
- User privacy policy and terms of service

### Security Considerations
- OAuth tokens stored in Chrome's secure sync storage
- No sensitive data transmitted in plain text
- Spotify API rate limiting and error handling
- Content Security Policy compliance

## Changelog

```
Changelog:
- July 05, 2025. Initial setup
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```