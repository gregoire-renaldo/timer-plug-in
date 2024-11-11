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