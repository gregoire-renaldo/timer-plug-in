// Timer and state variables
let timer = null;
let timeLimit = 0; // time limit in seconds
let timeElapsed = 0; // time elapsed in seconds

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
          showOverlay("Time's up! You have reached your Netflix time limit.");
      }
  }, 1000); // update every second
}

function pauseVideo() {
  const videoElement = document.querySelector("video");
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
    overlay.style.position = "fixed";
    overlay.style.top = "0";
    overlay.style.left = "0";
    overlay.style.width = "100vw";
    overlay.style.height = "100vh";
    overlay.style.backgroundColor = "rgba(0, 0, 0, 0.9)";
    overlay.style.zIndex = "9999";
    overlay.style.display = "flex";
    overlay.style.flexDirection = "column";
    overlay.style.justifyContent = "center";
    overlay.style.alignItems = "center";
    overlay.style.color = "white";
    overlay.style.fontSize = "24px";
    overlay.style.textAlign = "center";
    overlay.style.padding = "20px";

    const messageElement = document.createElement("p");
    messageElement.textContent = message;
    overlay.appendChild(messageElement);

    // Create "Resume Playing" button
    const resumeButton = document.createElement("button");
    resumeButton.textContent = "Resume Playing";
    resumeButton.style.margin = "10px";
    resumeButton.onclick = () => {
        const videoElement = document.querySelector("video");
        if (videoElement) videoElement.play();
        overlay.remove();
    };
    overlay.appendChild(resumeButton);

    // Create "Set New Limit" button
    const setNewLimitButton = document.createElement("button");
    setNewLimitButton.textContent = "Set New Limit";
    setNewLimitButton.style.margin = "10px";
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
    quitButton.style.margin = "10px";
    quitButton.onclick = () => {
        chrome.runtime.sendMessage({ action: "closeTab" });
    };
    overlay.appendChild(quitButton);

    document.body.appendChild(overlay);
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
