// Simple script to get the extension's redirect URI
// Run this in the browser console on any page when the extension is loaded

console.log('=== YouTube to Spotify Extension Setup ===');

if (typeof chrome !== 'undefined' && chrome.identity) {
  const redirectUri = chrome.identity.getRedirectURL();
  console.log('🔗 Your Extension Redirect URI:');
  console.log(redirectUri);
  console.log('');
  console.log('📋 Setup Steps:');
  console.log('1. Copy the URI above');
  console.log('2. Go to https://developer.spotify.com/dashboard');
  console.log('3. Select your app → Edit Settings');
  console.log('4. Add the URI to "Redirect URIs"');
  console.log('5. Save settings');
  console.log('6. Update your manifest.json with your Client ID');
  
  // Try to copy to clipboard if possible
  if (navigator.clipboard) {
    navigator.clipboard.writeText(redirectUri).then(() => {
      console.log('✅ Redirect URI copied to clipboard!');
    }).catch(() => {
      console.log('ℹ️ Copy the redirect URI manually from above');
    });
  }
} else {
  console.log('❌ This script must be run in a Chrome extension context');
}