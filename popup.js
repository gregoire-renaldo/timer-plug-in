document.getElementById("startButton").addEventListener("click", () => {
  const timeInput = document.getElementById("timeInput").value;
  const timeLimit = parseInt(timeInput);

  if (timeLimit > 0) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          chrome.tabs.sendMessage(tabs[0].id, { action: "startTimer", timeLimit }, (response) => {
            if (response && response.success) {
              window.close(); // Close the popup if the timer starts successfully
            } else {
              alert("Failed to start the timer. Please try again.");
            }
          });
        });
      } else {
        alert("Please enter a valid time in seconds.");
      }
    });

// Listen for the countdown updates from main.js
chrome.runtime.onMessage.addListener((message) => {
  if (message.action === "updateRemainingTime") {
      const remainingTimeDisplay = document.getElementById("remainingTime");
      remainingTimeDisplay.textContent = `Time remaining: ${message.timeRemaining} seconds`;
  }
});


document.addEventListener("DOMContentLoaded", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const url = new URL(tabs[0].url);
    const domain = url.hostname;
    let websiteName = "";

    const popupBody = document.getElementById("popupBody");
    const websiteElement = document.getElementById("websiteName");

    if (domain.includes("netflix.com")) {
      popupBody.style.backgroundColor = "#E50914"; // Netflix red
      websiteElement.textContent = "Netflix";
    } else if (domain.includes("primevideo.com")) {
      popupBody.style.backgroundColor = "#00A8E1"; // Prime Video blue
      websiteElement.textContent = "Prime Video";
    } else if (domain.includes("disneyplus.com")) {
      popupBody.style.backgroundColor = "#113CCF"; // Disney+ blue
      websiteElement.textContent = "Disney+";
    }

    // Display cumulative time
    chrome.storage.local.get(["streamingTracker"], (result) => {
      const streamingTracker = result.streamingTracker || { days: {}, totals: {} };
      const currentDate = new Date().toISOString().split('T')[0]; // Get current date in YYYY-MM-DD format
      const dayKey = `day-${currentDate}`;
      const cumulativeTime = streamingTracker.days[dayKey]?.totalStreamingTime || 0;
      const cumulativeTimeDisplay = document.getElementById("cumulativeTime");
      cumulativeTimeDisplay.textContent = `Cumulative time: ${cumulativeTime} seconds`;
    });
  });

  document.getElementById("startButton").addEventListener("click", () => {
    const timeInput = document.getElementById("timeInput").value;
    const timeLimit = parseInt(timeInput);

    if (timeLimit > 0) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, { action: "startTimer", timeLimit });
      });
    } else {
      alert("Please enter a valid time in seconds.");
    }
  });

  // Listen for the countdown updates from main.js
  chrome.runtime.onMessage.addListener((message) => {
    if (message.action === "updateRemainingTime") {
      const remainingTimeDisplay = document.getElementById("remainingTime");
      remainingTimeDisplay.textContent = `Time remaining: ${message.timeRemaining} seconds`;
    }
  });
});

document.getElementById("closeButton").addEventListener("click", () => {
  window.close(); // Close the popup when the close button is clicked
});