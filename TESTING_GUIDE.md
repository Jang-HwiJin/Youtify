# YouTube to Spotify Chrome Extension - Testing Guide

## How to Test the Extension

### Step 1: Load the Extension in Chrome

1. **Open Chrome** and go to `chrome://extensions/`
2. **Enable Developer Mode** by clicking the toggle in the top right corner
3. **Click "Load unpacked"** 
4. **Select the project folder** (the folder containing `manifest.json`)
5. The extension should now appear in your extensions list

### Step 2: Verify Extension Installation

1. **Check the extension icon** appears in the Chrome toolbar
2. **Click the extension icon** to open the popup
3. **Verify the popup opens** with the YouTube to Spotify interface

### Step 3: Test the Popup Interface

1. **Click the extension icon** in the toolbar
2. **Check that you see:**
   - "YouTube to Spotify" header with green Spotify logo
   - Authentication status (should show "Not connected to Spotify")
   - "Connect to Spotify" button
   - "How to use" instructions
   - "Settings" button in the footer

### Step 4: Test the Options Page

1. **Right-click the extension icon** and select "Options"
   - OR click the "Settings" button in the popup
2. **Verify the options page opens** with:
   - Spotify Connection section
   - Playlist Settings section
   - Matching Settings section
   - Notifications section
   - Advanced Settings section
   - About section

### Step 5: Test on YouTube

1. **Go to YouTube** (youtube.com)
2. **Open any music video** (search for a song like "Bohemian Rhapsody")
3. **Look for the "Add to Spotify" button** near the like/dislike buttons
4. **The button should appear** with a green Spotify logo

### Step 6: Test Authentication (Setup Required)

**Important:** To test authentication, you need to:

1. **Get a Spotify Client ID:**
   - Go to https://developer.spotify.com/dashboard
   - Create a new app
   - Copy the Client ID
   
2. **Update the manifest.json:**
   - Replace `"YOUR_SPOTIFY_CLIENT_ID"` with your actual Client ID
   - Add redirect URI: `https://[extension-id].chromiumapp.users.googleusercontent.com/`

3. **Test authentication:**
   - Click "Connect to Spotify" in the popup
   - Should redirect to Spotify login
   - After login, should show "Connected to Spotify"

### Step 7: Test Button Functionality

1. **Without authentication:** Click "Add to Spotify" button
   - Should show error message about needing authentication
   
2. **With authentication:** Click "Add to Spotify" button
   - Should show "Adding..." state
   - Should show success or error notification
   - Should briefly show "✓ Added!" or "Failed" state

### Common Issues and Solutions

#### Extension doesn't load:
- Check that all files are in the same folder
- Verify `manifest.json` has correct syntax
- Check Chrome developer console for errors

#### Button doesn't appear on YouTube:
- Refresh the YouTube page
- Check if you're on a video page (not the homepage)
- Wait a few seconds for the button to appear

#### Authentication fails:
- Verify your Spotify Client ID is correct
- Check that redirect URI is set up correctly
- Make sure you have a Spotify account

### Testing Without Spotify Setup

You can test the basic functionality without setting up Spotify:

1. **Load the extension** and verify it appears
2. **Test the popup interface** and options page
3. **Test the button appearance** on YouTube
4. **Test error handling** by clicking the button without authentication

### Browser Console Debugging

To see what's happening behind the scenes:

1. **Open Developer Tools** (F12)
2. **Go to the Console tab**
3. **Look for extension messages** when testing
4. **Check the Extensions tab** in DevTools for service worker logs

### File Structure Verification

Make sure your project has these files:
```
├── manifest.json
├── background.js
├── content.js
├── popup.html
├── popup.js
├── popup.css
├── options.html
├── options.js
├── options.css
├── utils.js
├── icons/
│   └── icon.svg
└── TESTING_GUIDE.md
```

### Next Steps After Testing

1. **Set up Spotify Developer Account** for full functionality
2. **Test with real songs** on YouTube
3. **Test playlist creation and management**
4. **Test notifications** when songs are added or fail
5. **Test on different YouTube video types** (music videos, covers, etc.)