document.addEventListener('DOMContentLoaded', () => {
    const pinMode = document.getElementById('pinMode');
    const pinSettings = document.getElementById('pinSettings');
    const pinInput = document.getElementById('pinInput');
    
    const cooldownMode = document.getElementById('cooldownMode');
    const cooldownSettings = document.getElementById('cooldownSettings');
    const cooldownTime = document.getElementById('cooldownTime');
    
    const saveBtn = document.getElementById('saveBtn');
    const status = document.getElementById('status');

    // Toggle sub-settings visibility
    pinMode.addEventListener('change', () => {
        pinSettings.style.display = pinMode.checked ? 'block' : 'none';
    });

    cooldownMode.addEventListener('change', () => {
        cooldownSettings.style.display = cooldownMode.checked ? 'block' : 'none';
    });

    // Load existing settings
    chrome.storage.local.get(['timerSettings'], (result) => {
        const settings = result.timerSettings || {};
        
        if (settings.pinMode) {
            pinMode.checked = true;
            pinSettings.style.display = 'block';
            pinInput.value = settings.pin || '';
        }
        
        if (settings.cooldownMode) {
            cooldownMode.checked = true;
            cooldownSettings.style.display = 'block';
            cooldownTime.value = settings.cooldownMinutes || 5;
        }
    });

    // Save settings
    saveBtn.addEventListener('click', () => {
        if (pinMode.checked && (!pinInput.value || pinInput.value.length < 4)) {
            status.textContent = "Please enter a 4-digit PIN.";
            status.style.color = 'var(--error-color)';
            return;
        }

        if (cooldownMode.checked && (!cooldownTime.value || cooldownTime.value < 1)) {
            status.textContent = "Please enter a valid cooldown time.";
            status.style.color = 'var(--error-color)';
            return;
        }

        const settings = {
            pinMode: pinMode.checked,
            pin: pinMode.checked ? pinInput.value : null,
            cooldownMode: cooldownMode.checked,
            cooldownMinutes: cooldownMode.checked ? parseInt(cooldownTime.value) : 0
        };

        chrome.storage.local.set({ timerSettings: settings }, () => {
            status.textContent = "Settings saved successfully!";
            status.style.color = 'var(--secondary-color)';
            setTimeout(() => { status.textContent = ''; }, 3000);
        });
    });
});
