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
