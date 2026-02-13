document.addEventListener("DOMContentLoaded", () => {
    const timeInput = document.getElementById("timeInput");
    const startButton = document.getElementById("startButton");
    const websiteIndicator = document.getElementById("websiteIndicator");
    const mainContainer = document.getElementById("mainContainer");
    const tipsButton = document.getElementById("tipsButton");
    
    // Default Tips Link (Placeholder)
    tipsButton.href = "https://www.buymeacoffee.com/yourusername"; 

    // Preset Buttons
    document.querySelectorAll(".preset-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            timeInput.value = btn.dataset.time;
        });
    });

    // Detect Current Tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (!tabs || tabs.length === 0) return;
        
        const url = new URL(tabs[0].url);
        const domain = url.hostname;
        
        const domainMapping = {
            "netflix.com": { class: "netflix-theme", name: "Netflix" },
            "primevideo.com": { class: "prime-theme", name: "Prime Video" },
            "disneyplus.com": { class: "disney-theme", name: "Disney+" },
            "youtube.com": { class: "youtube-theme", name: "YouTube" }
        };

        let detected = false;
        for (const [key, value] of Object.entries(domainMapping)) {
            if (domain.includes(key)) {
                mainContainer.classList.add(value.class);
                websiteIndicator.textContent = value.name;
                detected = true;
                break;
            }
        }

        if (!detected) {
            websiteIndicator.textContent = "Other Site";
            websiteIndicator.style.backgroundColor = "#555";
        }

        // Display cumulative time
        updateStats();
    });

    // Start Timer
    startButton.addEventListener("click", () => {
        const minutes = parseInt(timeInput.value);
        
        if (minutes > 0) {
            const seconds = minutes * 60;
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                chrome.tabs.sendMessage(tabs[0].id, { action: "startTimer", timeLimit: seconds }, (response) => {
                    if (chrome.runtime.lastError) {
                         // Fallback if content script isn't ready or compatible
                         alert("Could not start timer on this page. Please refresh the page and try again.");
                    } else if (response && response.success) {
                        window.close();
                    }
                });
            });
        } else {
            alert("Please enter a valid time in minutes.");
        }
    });

    // Listen for updates
    chrome.runtime.onMessage.addListener((message) => {
        if (message.action === "updateRemainingTime") {
            const remainingTimeDisplay = document.getElementById("remainingTime");
            if (remainingTimeDisplay) {
                const mins = Math.floor(message.timeRemaining / 60);
                const secs = message.timeRemaining % 60;
                remainingTimeDisplay.textContent = `${mins}m ${secs}s`;
            }
        }
    });
});

function updateStats() {
    chrome.storage.local.get(["streamingTracker"], (result) => {
        const streamingTracker = result.streamingTracker || { days: {}, totals: {} };
        const currentDate = new Date().toISOString().split('T')[0];
        const dayKey = `day-${currentDate}`;
        const cumulativeSeconds = streamingTracker.days[dayKey]?.totalStreamingTime || 0;
        
        const cumulativeTimeDisplay = document.getElementById("cumulativeTime");
        if (cumulativeTimeDisplay) {
            const mins = Math.floor(cumulativeSeconds / 60);
            cumulativeTimeDisplay.textContent = `${mins}m`;
        }
    });
}