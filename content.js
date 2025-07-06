// Content script for YouTube pages
(function () {
  "use strict";

  let addToSpotifyButton = null;
  let currentVideoId = null;

  // Initialize when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  function init() {
    // Wait for YouTube to load
    const checkYouTubeLoaded = setInterval(() => {
      if (
        document.querySelector("#movie_player") ||
        document.querySelector(".ytd-watch-flexy")
      ) {
        clearInterval(checkYouTubeLoaded);
        setupMutationObserver();
        createAddToSpotifyButton();
      }
    }, 1000);
  }

  function setupMutationObserver() {
    // Watch for navigation changes in YouTube SPA
    const observer = new MutationObserver((mutations) => {
      const currentUrl = window.location.href;
      const videoId = extractVideoId(currentUrl);

      if (videoId !== currentVideoId) {
        currentVideoId = videoId;
        if (isWatchPage()) {
          setTimeout(() => {
            createAddToSpotifyButton();
          }, 2000); // Wait for YouTube to load video info
        } else {
          removeAddToSpotifyButton();
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  function isWatchPage() {
    return window.location.pathname === "/watch";
  }

  function extractVideoId(url) {
    const match = url.match(/[?&]v=([^&]+)/);
    return match ? match[1] : null;
  }

  function createAddToSpotifyButton() {
    if (!isWatchPage()) return;

    removeAddToSpotifyButton();

    // Wait for YouTube's UI to load
    const checkForContainer = setInterval(() => {
      const container = findButtonContainer();
      if (container) {
        clearInterval(checkForContainer);
        insertButton(container);
      }
    }, 500);

    // Stop checking after 10 seconds
    setTimeout(() => clearInterval(checkForContainer), 10000);
  }

  function findButtonContainer() {
    // Try multiple selectors for different YouTube layouts
    const selectors = [
      "#actions-inner", // Main actions container
      "#top-level-buttons-computed", // Alternative container
      ".ytd-menu-renderer", // Menu renderer
      "#actions", // Actions container
      ".ytd-video-primary-info-renderer #top-row", // Primary info area
    ];

    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element) {
        return element;
      }
    }

    return null;
  }

  function insertButton(container) {
    addToSpotifyButton = document.createElement("button");
    addToSpotifyButton.id = "add-to-spotify-btn";
    addToSpotifyButton.className =
      "yt-spec-button-shape-next yt-spec-button-shape-next--tonal yt-spec-button-shape-next--mono yt-spec-button-shape-next--size-m";
    addToSpotifyButton.innerHTML = `
      <div class="yt-spec-button-shape-next__button-text-content">
        <span class="yt-core-attributed-string yt-core-attributed-string--white-space-no-wrap" role="text">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="margin-right: 6px;">
            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.301.421-1.02.599-1.56.3z"/>
          </svg>
          Add to Spotify
        </span>
      </div>
    `;

    addToSpotifyButton.style.cssText = `
      background-color: #1db954;
      color: white;
      border: none;
      border-radius: 14px;
      padding: 0 12px;
      height: 32px;
      margin-left: 12px;
      margin-right: 4px;
      margin-top: 10px;
      cursor: pointer;
      font-size: 13px;
      font-weight: 500;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
    `;

    addToSpotifyButton.addEventListener("mouseenter", () => {
      addToSpotifyButton.style.backgroundColor = "#1ed760";
      addToSpotifyButton.style.transform = "scale(1.05)";
    });

    addToSpotifyButton.addEventListener("mouseleave", () => {
      addToSpotifyButton.style.backgroundColor = "#1db954";
      addToSpotifyButton.style.transform = "scale(1)";
    });

    addToSpotifyButton.addEventListener("click", handleAddToSpotify);

    container.appendChild(addToSpotifyButton);
  }

  function removeAddToSpotifyButton() {
    if (addToSpotifyButton) {
      addToSpotifyButton.remove();
      addToSpotifyButton = null;
    }
  }

  async function handleAddToSpotify() {
    if (!addToSpotifyButton) return;

    // Disable button during processing
    addToSpotifyButton.disabled = true;
    addToSpotifyButton.style.opacity = "0.6";
    addToSpotifyButton.innerHTML = `
      <div class="yt-spec-button-shape-next__button-text-content">
        <span class="yt-core-attributed-string yt-core-attributed-string--white-space-no-wrap" role="text">
          Adding...
        </span>
      </div>
    `;

    const songInfo = await extractSongInfo();

    chrome.runtime.sendMessage(
      {
        action: "addToSpotify",
        songInfo: songInfo,
      },
      (response) => {
        // Re-enable button
        addToSpotifyButton.disabled = false;
        addToSpotifyButton.style.opacity = "1";

        if (response && response.success) {
          // Show success state briefly
          addToSpotifyButton.innerHTML = `
          <div class="yt-spec-button-shape-next__button-text-content">
            <span class="yt-core-attributed-string yt-core-attributed-string--white-space-no-wrap" role="text">
              ✓ Added!
            </span>
          </div>
        `;
          addToSpotifyButton.style.backgroundColor = "#00d855";

          setTimeout(() => {
            addToSpotifyButton.innerHTML = `
            <div class="yt-spec-button-shape-next__button-text-content">
              <span class="yt-core-attributed-string yt-core-attributed-string--white-space-no-wrap" role="text">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="margin-right: 6px;">
                  <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.301.421-1.02.599-1.56.3z"/>
                </svg>
                Add to Spotify
              </span>
            </div>
          `;
            addToSpotifyButton.style.backgroundColor = "#1db954";
          }, 2000);
        } else {
          // Show error state briefly
          addToSpotifyButton.innerHTML = `
          <div class="yt-spec-button-shape-next__button-text-content">
            <span class="yt-core-attributed-string yt-core-attributed-string--white-space-no-wrap" role="text">
              Failed
            </span>
          </div>
        `;
          addToSpotifyButton.style.backgroundColor = "#ff4444";

          setTimeout(() => {
            addToSpotifyButton.innerHTML = `
            <div class="yt-spec-button-shape-next__button-text-content">
              <span class="yt-core-attributed-string yt-core-attributed-string--white-space-no-wrap" role="text">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="margin-right: 6px;">
                  <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.301.421-1.02.599-1.56.3z"/>
                </svg>
                Add to Spotify
              </span>
            </div>
          `;
            addToSpotifyButton.style.backgroundColor = "#1db954";
          }, 2000);
        }
      },
    );
  }

  async function extractSongInfo() {
    const title =
      document
        .querySelector("h1.ytd-video-primary-info-renderer")
        ?.textContent?.trim() ||
      document.querySelector("#watch-headline-title")?.textContent?.trim() ||
      document.title.replace(" - YouTube", "");

    const channelName =
      document.querySelector("#text.ytd-channel-name")?.textContent?.trim() ||
      document.querySelector(".ytd-channel-name a")?.textContent?.trim() ||
      document.querySelector("#owner-name a")?.textContent?.trim() ||
      "";

    // Wrap chrome.runtime.sendMessage in a Promise so we can await it
    const parsed = await new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        { action: "callOllama", title, channelName },
        (response) => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
            return;
          }
          if (response && response.success) {
            resolve(response.data);
          } else {
            reject(response?.error || "Unknown error from Ollama");
          }
        },
      );
    }).catch((err) => {
      console.error("Error calling Ollama:", err);
      // fallback to default
      return { songTitle: title, artist: channelName };
    });

    return {
      title: parsed.songTitle || title,
      artist: parsed.artist || channelName,
      originalTitle: title,
      channel: channelName,
      url: window.location.href,
    };
  }

  async function parseSongTitle(title, channelName) {
    // Build a prompt for the AI
    const prompt = `
    Extract the artist and song title from the following YouTube music video information.

    YouTube Title: "${title}"
    YouTube Channel: "${channelName}"

    Respond ONLY with a JSON object like:
    {
      "artist": "artist name",
      "songTitle": "song title"
    }
    If no clear artist or title, use the channel name as artist.
  `;

    try {
      const response = await fetch("http://localhost:11434/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gemma:2b",
          prompt: prompt,
          stream: false,
        }),
      });

      if (!response.ok) {
        throw new Error(
          `Ollama API error: ${response.status} ${response.statusText}`,
        );
      }

      const data = await response.json();

      // Ollama returns the parsed JSON as a string in `data.response`, so parse it
      const parsed = JSON.parse(data.response);

      return {
        artist: parsed.artist || channelName,
        songTitle: parsed.songTitle || title,
      };
    } catch (error) {
      console.error("Error parsing song title with Ollama:", error);

      // Fallback: return original inputs if AI call fails
      return {
        artist: channelName,
        songTitle: title,
      };
    }
  }
})();
