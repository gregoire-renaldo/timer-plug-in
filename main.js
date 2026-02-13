// Timer and state variables
let timer = null;
let timeLimit = 0; // time limit in seconds
let timeElapsed = 0; // time elapsed in seconds

// Initialize
function startTimer(limitInSeconds) {
    if (!checkLimit(limitInSeconds)) { 
        return;
    }
    timeLimit = limitInSeconds;
    timeElapsed = 0;
    if (timer) clearInterval(timer);

    timer = setInterval(() => {
        timeElapsed++;
        const timeRemaining = timeLimit - timeElapsed;

        // Send remaining time to popup
        try {
            chrome.runtime.sendMessage({ action: "updateRemainingTime", timeRemaining });
        } catch (e) {
            // Popup might be closed, ignore error
        }

        // Show warning toast 1 minute before
        if (timeRemaining === 60) {
            showToast("1 minute remaining!");
        }

        if (timeRemaining <= 0) {
            clearInterval(timer);
            pauseVideo();
            showOverlay("Time's up! You've reached your limit.");
        }

        // Update cumulative time
        updateStreamingTracker(1); 
    }, 1000); 
}

function pauseVideo() {
    const videoElement = document.querySelector("video");
    if (videoElement) {
        videoElement.pause();
    }
}

function playVideo() { 
    const videoElement = document.querySelector("video");
    if (videoElement) {
        videoElement.play();
    }
}

function showToast(message) {
    const toast = document.createElement("div");
    toast.textContent = message;
    Object.assign(toast.style, {
        position: "fixed",
        top: "20px",
        right: "20px",
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        color: "white",
        padding: "10px 20px",
        borderRadius: "5px",
        zIndex: "10000",
        fontSize: "16px",
        transition: "opacity 0.5s"
    });
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = "0";
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}

// Display full-screen overlay with buttons
function showOverlay(message) {
    const existingOverlay = document.getElementById("netflix-timer-overlay");
    if (existingOverlay) existingOverlay.remove();

    const overlay = document.createElement("div");
    overlay.id = "netflix-timer-overlay";
    Object.assign(overlay.style, {
        position: "fixed",
        top: "0",
        left: "0",
        width: "100vw",
        height: "100vh",
        backgroundColor: "rgba(0, 0, 0, 0.95)",
        zIndex: "2147483647", // Max z-index
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        color: "white",
        fontFamily: "Segoe UI, sans-serif",
        textAlign: "center"
    });

    // Content container
    const content = document.createElement("div");
    content.style.maxWidth = "500px";
    content.style.padding = "20px";
    
    // Heading
    const heading = document.createElement("h1");
    heading.textContent = message;
    heading.style.fontSize = "2.5rem";
    heading.style.marginBottom = "20px";
    content.appendChild(heading);

    // Stats
    const statsDiv = document.createElement("div");
    statsDiv.style.marginBottom = "30px";
    statsDiv.style.fontSize = "1.2rem";
    statsDiv.style.lineHeight = "1.6";
    
    chrome.storage.local.get(["streamingTracker"], (result) => {
        const streamingTracker = result.streamingTracker || { days: {}, totals: {} };
        const currentDate = new Date().toISOString().split('T')[0];
        const dayKey = `day-${currentDate}`;
        const dayStats = streamingTracker.days[dayKey] || { totalStreamingTime: 0 };
        
        const mins = Math.floor(dayStats.totalStreamingTime / 60);
        statsDiv.textContent = `You've watched ${mins} minutes today.`;
    });
    content.appendChild(statsDiv);

    // Buttons Container
    const btnContainer = document.createElement("div");
    btnContainer.style.display = "flex";
    btnContainer.style.gap = "15px";
    btnContainer.style.justifyContent = "center";
    btnContainer.style.marginBottom = "30px";

    // Button Styles
    const btnStyle = {
        padding: "12px 24px",
        fontSize: "1rem",
        border: "none",
        borderRadius: "5px",
        cursor: "pointer",
        fontWeight: "bold"
    };

    // Quit Button
    const quitButton = document.createElement("button");
    quitButton.textContent = "Close Tab";
    Object.assign(quitButton.style, btnStyle, { backgroundColor: "#cf6679", color: "white" });
    quitButton.onclick = () => chrome.runtime.sendMessage({ action: "closeTab" });
    
    // Extensions Limits Button
    const newLimitButton = document.createElement("button");
    newLimitButton.textContent = "Watch 15m More";
    Object.assign(newLimitButton.style, btnStyle, { backgroundColor: "#03dac6", color: "black" });
    newLimitButton.onclick = () => {
        startTimer(15 * 60);
        overlay.remove();
        playVideo();
    };

    btnContainer.appendChild(newLimitButton);
    btnContainer.appendChild(quitButton);
    content.appendChild(btnContainer);

    // Tips Link
    const tipsLink = document.createElement("a");
    tipsLink.textContent = "☕ Buy the developer a coffee";
    tipsLink.href = "https://www.buymeacoffee.com/yourusername";
    tipsLink.target = "_blank";
    tipsLink.style.color = "#bb86fc";
    tipsLink.style.textDecoration = "none";
    tipsLink.style.fontSize = "0.9rem";
    tipsLink.style.marginTop = "20px";
    tipsLink.onmouseover = () => tipsLink.style.textDecoration = "underline";
    tipsLink.onmouseout = () => tipsLink.style.textDecoration = "none";
    
    content.appendChild(tipsLink);
    overlay.appendChild(content);

    document.body.appendChild(overlay);
}

function updateStreamingTracker(seconds) {
  chrome.storage.local.get(["streamingTracker"], (result) => {
    let streamingTracker = result.streamingTracker || { days: {}, totals: {} };
    const currentDate = new Date().toISOString().split('T')[0];
    const dayKey = `day-${currentDate}`;

    if (!streamingTracker.days[dayKey]) {
        streamingTracker.days[dayKey] = {
            totalStreamingTime: 0,
            amazonTime: 0,
            disneyTime: 0,
            netflixTime: 0,
            youtubeTime: 0
        };
    }

    const domain = window.location.hostname;
    if (domain.includes("netflix.com")) {
        streamingTracker.days[dayKey].netflixTime = (streamingTracker.days[dayKey].netflixTime || 0) + seconds;
        streamingTracker.totals.totalNetflixTime = (streamingTracker.totals.totalNetflixTime || 0) + seconds;
    } else if (domain.includes("primevideo.com")) {
        streamingTracker.days[dayKey].amazonTime = (streamingTracker.days[dayKey].amazonTime || 0) + seconds;
        streamingTracker.totals.totalAmazonTime = (streamingTracker.totals.totalAmazonTime || 0) + seconds;
    } else if (domain.includes("disneyplus.com")) {
        streamingTracker.days[dayKey].disneyTime = (streamingTracker.days[dayKey].disneyTime || 0) + seconds;
        streamingTracker.totals.totalDisneyTime = (streamingTracker.totals.totalDisneyTime || 0) + seconds;
    } else if (domain.includes("youtube.com")) {
        streamingTracker.days[dayKey].youtubeTime = (streamingTracker.days[dayKey].youtubeTime || 0) + seconds;
        streamingTracker.totals.totalYoutubeTime = (streamingTracker.totals.totalYoutubeTime || 0) + seconds;
    }

    streamingTracker.days[dayKey].totalStreamingTime += seconds;
    streamingTracker.totals.totalStreamingTime = (streamingTracker.totals.totalStreamingTime || 0) + seconds;

    chrome.storage.local.set({ streamingTracker });
  });
}

// Listen for messages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "startTimer") {
        startTimer(request.timeLimit);
        sendResponse({ success: true });
    } else if (request.action === "closeTab") {
        // This is handled in background.js, but good to have fallback/confirmation
    }
});

function checkLimit(limitInSeconds) {
    if (isNaN(limitInSeconds) || limitInSeconds <= 0 || limitInSeconds > 86400) {
        alert("Please enter a valid time limit in seconds (1-86400).");
        return false;
    }
    return true;
}