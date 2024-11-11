// Timer and state variables
let timer = null;
let timeLimit = 0; // time limit in seconds
let timeElapsed = 0; // time elapsed in seconds
const commonButtonStyle = {
    margin: "10px",
    color: "black",
    backgroundColor: "white",
    cursor: "pointer",
}

// Initialize Netflix timer
function startTimer(limitInSeconds) {
  timeLimit = limitInSeconds;
  timeElapsed = 0;
  clearInterval(timer);

  timer = setInterval(() => {
    timeElapsed++;
    const timeRemaining = timeLimit - timeElapsed;

    // Send remaining time to popup if time is remaining
    chrome.runtime.sendMessage({ action: "updateRemainingTime", timeRemaining });
    if (timeRemaining <= 0) {
        clearInterval(timer);
        pauseVideo();
        showOverlay("Time's up! You have reached your time limit.");
    }

    // Update cumulative time
    updateStreamingTracker(1); // Increment by 1 second
  }, 1000); 
}

function pauseVideo() {
  const videoElement = document.querySelector("video");
  console.log("Pause video", videoElement);
  if (videoElement) {
      videoElement.pause();
      console.log("Video paused.");
  }
}

function playVideo() { 
  console.log("Play video");
  const videoElement = document.querySelector("video");
  if (videoElement) {
      videoElement.play();
      console.log("Video playing.");
  }
}

// Display full-screen overlay with buttons
function showOverlay(message) {
    // Remove any existing overlay
    const existingOverlay = document.getElementById("netflix-timer-overlay");
    if (existingOverlay) existingOverlay.remove();

    const overlay = document.createElement("div");
    overlay.id = "netflix-timer-overlay";
    style = {
        position: "fixed",
        top: "0",
        left: "0",
        width: "100vw",
        height: "100vh",
        backgroundColor: "rgba(0, 0, 0, 0.9)",
        zIndex: "9999",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        color: "white",
        fontSize: "24px",
        textAlign: "center",
        padding: "20px",
    };
    Object.entries(style).forEach(([key, value]) => (overlay.style[key] = value));
    console.log("Overlay created",overlay);

    const statsDiv = document.createElement("div");
      chrome.storage.local.get(["streamingTracker"], (result) => {
          const streamingTracker = result.streamingTracker || { days: {}, totals: {} };
          const currentDate = new Date().toISOString().split('T')[0]; // Get current date in YYYY-MM-DD format
          const dayKey = `day-${currentDate}`;
          const dayStats = streamingTracker.days[dayKey] || { totalStreamingTime: 0, amazonTime: 0, disneyTime: 0, netflixTime: 0 };
          const totalStats = streamingTracker.totals || { totalStreamingTime: 0, totalAmazonTime: 0, totalDisneyTime: 0, totalNetflixTime: 0 };

          const dayStatsElement = document.createElement("p");
          dayStatsElement.textContent = `Today's Stats:
          Total: ${dayStats.totalStreamingTime} seconds
          Netflix: ${dayStats.netflixTime} seconds
          Amazon: ${dayStats.amazonTime} seconds
          Disney: ${dayStats.disneyTime} seconds`;
          statsDiv.appendChild(dayStatsElement);

          const totalStatsElement = document.createElement("p");
          totalStatsElement.textContent = `Total Stats:
          Total: ${totalStats.totalStreamingTime} seconds
          Netflix: ${totalStats.totalNetflixTime} seconds
          Amazon: ${totalStats.totalAmazonTime} seconds
          Disney: ${totalStats.totalDisneyTime} seconds`;
          statsDiv.appendChild(totalStatsElement);
      });
    overlay.appendChild(statsDiv);


    const messageElement = document.createElement("p");
    messageElement.textContent = message;
    overlay.appendChild(messageElement);

    // Create "Resume Playing" button 
    // const resumeButton = document.createElement("button");
    // resumeButton.textContent = "Resume Playing";
    // Object.entries(commonButtonStyle).forEach(([key, value]) => (resumeButton.style[key] = value));
    // resumeButton.onclick = () => {
    //     const videoElement = document.querySelector("video");
    //     if (videoElement) videoElement.play();
    //     overlay.remove();
    // };
    // overlay.appendChild(resumeButton);

    // Create "Set New Limit" button
    const setNewLimitButton = document.createElement("button");
    setNewLimitButton.textContent = "Set New Limit";
    Object.entries(commonButtonStyle).forEach(([key, value]) => (setNewLimitButton.style[key] = value));
    setNewLimitButton.onclick = () => {
        const newLimit = prompt("Enter a new time limit in seconds:");
        if (newLimit && !isNaN(newLimit)) {
            startTimer(parseInt(newLimit));
            overlay.remove();
            playVideo();
        }
    };
    overlay.appendChild(setNewLimitButton);

    // Create "Quit" button
    const quitButton = document.createElement("button");
    quitButton.textContent = "Quit";
    Object.entries(commonButtonStyle).forEach(([key, value]) => (quitButton.style[key] = value));
    quitButton.onclick = () => {
        chrome.runtime.sendMessage({ action: "closeTab" });
    };
    overlay.appendChild(quitButton);

    document.body.appendChild(overlay);
}

function updateStreamingTracker(seconds) {
  chrome.storage.local.get(["streamingTracker"], (result) => {
    let streamingTracker = result.streamingTracker || { days: {}, totals: {} };
    const currentDate = new Date().toISOString().split('T')[0]; // Get current date in YYYY-MM-DD format
    const dayKey = `day-${currentDate}`;

    if (!streamingTracker.days[dayKey]) {
        streamingTracker.days[dayKey] = {
            totalStreamingTime: 0,
            amazonTime: 0,
            disneyTime: 0,
            netflixTime: 0,
        };
    }

    const domain = window.location.hostname;
    if (domain.includes("netflix.com")) {
        streamingTracker.days[dayKey].netflixTime += seconds;
        streamingTracker.totals.totalNetflixTime = (streamingTracker.totals.totalNetflixTime || 0) + seconds;
    } else if (domain.includes("primevideo.com")) {
        streamingTracker.days[dayKey].amazonTime += seconds;
        streamingTracker.totals.totalAmazonTime = (streamingTracker.totals.totalAmazonTime || 0) + seconds;
    } else if (domain.includes("disneyplus.com")) {
        streamingTracker.days[dayKey].disneyTime += seconds;
        streamingTracker.totals.totalDisneyTime = (streamingTracker.totals.totalDisneyTime || 0) + seconds;
    }

    streamingTracker.days[dayKey].totalStreamingTime += seconds;
    streamingTracker.totals.totalStreamingTime = (streamingTracker.totals.totalStreamingTime || 0) + seconds;

    chrome.storage.local.set({ streamingTracker }, () => {
        console.log(`Streaming tracker updated: ${JSON.stringify(streamingTracker)}`);
    });
  });
}

// Listen for messages from popup or background script to set a new timer
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("Listen for messages from popup or background script to set a new timer:", request.action);
    if (request.action === "startTimer") {
        startTimer(request.timeLimit);
        sendResponse({ success: true });
    } else if (request.action === "closeTab") {
      console.log("Closing tab..."); 
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.tabs.remove(tabs[0].id);
        });
    }
});
