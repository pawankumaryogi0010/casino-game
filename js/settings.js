// ============================================
// EMERALD KING - SETTINGS VIEW LAYER
// Account, Security & Notification Preferences
// File: js/settings.js
// Version: 1.0.0
// ============================================

// ============================================
// SECTION 1: SETTINGS STATE MANAGEMENT
// ============================================

const SettingsState = {
    // Profile settings
    username: '',
    avatarUrl: '',
    
    // Password fields
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    
    // Notification preferences (loaded from localStorage)
    preferences: {
        emailReports: true,
        sessionSoundFX: true,
        marketingAlerts: false
    },
    
    // UI state
    isLoading: false,
    activeTab: 'profile', // 'profile', 'security', 'notifications'
    message: null,
    messageType: 'info' // 'success', 'error', 'info'
};

// ============================================
// SECTION 2: LOCAL STORAGE HELPERS
// ============================================

function loadPreferences() {
    try {
        const saved = localStorage.getItem('emerald_settings_preferences');
        if (saved) {
            SettingsState.preferences = { ...SettingsState.preferences, ...JSON.parse(saved) };
        }
    } catch (error) {
        console.warn('⚠️ SETTINGS: Could not load preferences:', error);
    }
}

function savePreferences() {
    try {
        localStorage.setItem('emerald_settings_preferences', JSON.stringify(SettingsState.preferences));
    } catch (error) {
        console.error('❌ SETTINGS: Could not save preferences:', error);
    }
}

// ============================================
// SECTION 3: SUPABASE OPERATIONS
// ============================================

async function loadUserProfile() {
    try {
        if (!window.emeraldDB || !window.emeraldDB.isReady || !window.emeraldDB.isReady()) {
            // Demo mode - load from localStorage fallback
            const saved = localStorage.getItem('emerald_settings_profile');
            if (saved) {
                const profile = JSON.parse(saved);
                SettingsState.username = profile.username || '';
                SettingsState.avatarUrl = profile.avatarUrl || '';
            }
            return;
        }
        
        const client = window.emeraldDB.getClient();
        const { data: { user } } = await client.auth.getUser();
        
        if (user) {
            SettingsState.username = user.user_metadata?.username || '';
            SettingsState.avatarUrl = user.user_metadata?.avatar_url || '';
        }
    } catch (error) {
        console.error('❌ SETTINGS: Load profile error:', error);
    }
}

async function updateUsername(username) {
    try {
        SettingsState.isLoading = true;
        renderSettingsView();
        
        if (!window.emeraldDB || !window.emeraldDB.isReady || !window.emeraldDB.isReady()) {
            // Demo mode
            const saved = { username, avatarUrl: SettingsState.avatarUrl };
            localStorage.setItem('emerald_settings_profile', JSON.stringify(saved));
            SettingsState.username = username;
            showMessage('Username updated (demo mode)', 'success');
            return;
        }
        
        const client = window.emeraldDB.getClient();
        
        // Update auth user metadata
        const { error: authError } = await client.auth.updateUser({
            data: { username: username }
        });
        
        if (authError) throw authError;
        
        // Update profiles table
        const { data: { user } } = await client.auth.getUser();
        if (user) {
            const { error: profileError } = await client
                .from('profiles')
                .update({ username: username })
                .eq('id', user.id);
            
            if (profileError) throw profileError;
        }
        
        SettingsState.username = username;
        showMessage('Username updated successfully!', 'success');
        
    } catch (error) {
        console.error('❌ SETTINGS: Update username error:', error);
        showMessage('Failed to update username: ' + error.message, 'error');
    } finally {
        SettingsState.isLoading = false;
        renderSettingsView();
    }
}

async function updateAvatar(avatarUrl) {
    try {
        SettingsState.isLoading = true;
        renderSettingsView();
        
        if (!window.emeraldDB || !window.emeraldDB.isReady || !window.emeraldDB.isReady()) {
            const saved = { username: SettingsState.username, avatarUrl };
            localStorage.setItem('emerald_settings_profile', JSON.stringify(saved));
            SettingsState.avatarUrl = avatarUrl;
            showMessage('Avatar updated (demo mode)', 'success');
            return;
        }
        
        const client = window.emeraldDB.getClient();
        
        const { error } = await client.auth.updateUser({
            data: { avatar_url: avatarUrl }
        });
        
        if (error) throw error;
        
        SettingsState.avatarUrl = avatarUrl;
        showMessage('Avatar updated successfully!', 'success');
        
    } catch (error) {
        console.error('❌ SETTINGS: Update avatar error:', error);
        showMessage('Failed to update avatar: ' + error.message, 'error');
    } finally {
        SettingsState.isLoading = false;
        renderSettingsView();
    }
}

async function updatePassword(currentPassword, newPassword) {
    try {
        SettingsState.isLoading = true;
        renderSettingsView();
        
        if (!window.emeraldDB || !window.emeraldDB.isReady || !window.emeraldDB.isReady()) {
            showMessage('Password updated (demo mode)', 'success');
            return;
        }
        
        const client = window.emeraldDB.getClient();
        
        // Supabase requires re-authentication for password change
        // First verify current password by signing in
        const { data: { user }, error: signInError } = await client.auth.signInWithPassword({
            email: (await client.auth.getUser()).data.user.email,
            password: currentPassword
        });
        
        if (signInError) {
            showMessage('Current password is incorrect', 'error');
            return;
        }
        
        // Update password
        const { error: updateError } = await client.auth.updateUser({
            password: newPassword
        });
        
        if (updateError) throw updateError;
        
        showMessage('Password updated successfully!', 'success');
        SettingsState.currentPassword = '';
        SettingsState.newPassword = '';
        SettingsState.confirmPassword = '';
        
    } catch (error) {
        console.error('❌ SETTINGS: Update password error:', error);
        showMessage('Failed to update password: ' + error.message, 'error');
    } finally {
        SettingsState.isLoading = false;
        renderSettingsView();
    }
}

// ============================================
// SECTION 4: VALIDATION
// ============================================

function validateProfileForm() {
    const errors = [];
    
    if (!SettingsState.username || SettingsState.username.trim().length < 3) {
        errors.push('Username must be at least 3 characters');
    }
    
    if (SettingsState.username && SettingsState.username.length > 30) {
        errors.push('Username must be less than 30 characters');
    }
    
    return errors;
}

function validatePasswordForm() {
    const errors = [];
    
    if (!SettingsState.currentPassword) {
        errors.push('Current password is required');
    }
    
    if (!SettingsState.newPassword || SettingsState.newPassword.length < 6) {
        errors.push('New password must be at least 6 characters');
    }
    
    if (SettingsState.newPassword !== SettingsState.confirmPassword) {
        errors.push('New passwords do not match');
    }
    
    if (SettingsState.currentPassword === SettingsState.newPassword) {
        errors.push('New password must be different from current password');
    }
    
    return errors;
}

// ============================================
// SECTION 5: UI RENDERING
// ============================================

function showMessage(message, type = 'info') {
    SettingsState.message = message;
    SettingsState.messageType = type;
    
    // Auto-clear after 5 seconds
    setTimeout(() => {
        SettingsState.message = null;
        renderSettingsView();
    }, 5000);
}

function renderSettingsView() {
    const container = document.getElementById('settings-view');
    if (!container) return;
    
    const colors = {
        bg: '#0d1117',
        cardBg: '#161b22',
        border: '#30363d',
        text: '#c9d1d9',
        textDim: '#8b949e',
        accent: '#00e676',
        accentDim: '#00e67622',
        gold: '#FFD700',
        red: '#ff4444',
        blue: '#58a6ff',
        inputBg: '#0d1117',
        inputBorder: '#30363d',
        inputFocus: '#00e676'
    };
    
    const messageHTML = SettingsState.message ? `
        <div style="
            padding:12px 16px;
            margin-bottom:16px;
            border-radius:8px;
            font-size:13px;
            font-weight:500;
            background:${SettingsState.messageType === 'success' ? '#00e67615' : SettingsState.messageType === 'error' ? '#ff444415' : '#58a6ff15'};
            border:1px solid ${SettingsState.messageType === 'success' ? '#00e67633' : SettingsState.messageType === 'error' ? '#ff444433' : '#58a6ff33'};
            color:${SettingsState.messageType === 'success' ? '#00e676' : SettingsState.messageType === 'error' ? '#ff4444' : '#58a6ff'};
        ">${SettingsState.message}</div>
    ` : '';
    
    container.innerHTML = `
        <div style="padding:4px 0;">
            
            ${messageHTML}
            
            <!-- Tab Switcher -->
            <div style="display:flex;gap:8px;margin-bottom:20px;background:${colors.cardBg};border-radius:12px;padding:4px;">
                <button onclick="SettingsComponent.switchTab('profile')" style="
                    flex:1;padding:10px;border:none;border-radius:10px;font-size:12px;font-weight:600;cursor:pointer;
                    background:${SettingsState.activeTab === 'profile' ? colors.accentDim : 'transparent'};
                    color:${SettingsState.activeTab === 'profile' ? colors.accent : colors.textDim};
                    transition:all 0.2s;
                ">👤 Profile</button>
                <button onclick="SettingsComponent.switchTab('security')" style="
                    flex:1;padding:10px;border:none;border-radius:10px;font-size:12px;font-weight:600;cursor:pointer;
                    background:${SettingsState.activeTab === 'security' ? colors.accentDim : 'transparent'};
                    color:${SettingsState.activeTab === 'security' ? colors.accent : colors.textDim};
                    transition:all 0.2s;
                ">🔒 Security</button>
                <button onclick="SettingsComponent.switchTab('notifications')" style="
                    flex:1;padding:10px;border:none;border-radius:10px;font-size:12px;font-weight:600;cursor:pointer;
                    background:${SettingsState.activeTab === 'notifications' ? colors.accentDim : 'transparent'};
                    color:${SettingsState.activeTab === 'notifications' ? colors.accent : colors.textDim};
                    transition:all 0.2s;
                ">🔔 Alerts</button>
            </div>
            
            <!-- Tab Content -->
            ${SettingsState.activeTab === 'profile' ? renderProfileTab(colors) : ''}
            ${SettingsState.activeTab === 'security' ? renderSecurityTab(colors) : ''}
            ${SettingsState.activeTab === 'notifications' ? renderNotificationsTab(colors) : ''}
            
        </div>
    `;
    
    // Bind events after render
    bindSettingsEvents();
}

function renderProfileTab(colors) {
    return `
        <div style="background:${colors.cardBg};border:1px solid ${colors.border};border-radius:12px;padding:20px;">
            <h3 style="color:${colors.text};font-size:15px;font-weight:600;margin:0 0 4px 0;">Account Profile</h3>
            <p style="color:${colors.textDim};font-size:11px;margin:0 0 20px 0;">Update your public display information</p>
            
            <!-- Avatar Preview -->
            <div style="display:flex;align-items:center;gap:16px;margin-bottom:20px;">
                <div style="
                    width:56px;height:56px;border-radius:50%;overflow:hidden;
                    background:linear-gradient(135deg,#00e676,#00b0ff);
                    display:flex;align-items:center;justify-content:center;
                    font-size:24px;border:2px solid ${colors.border};
                ">
                    ${SettingsState.avatarUrl ? 
                        `<img src="${SettingsState.avatarUrl}" style="width:100%;height:100%;object-fit:cover;" onerror="this.style.display='none';this.parentNode.textContent='👤';">` : 
                        '👤'}
                </div>
                <div style="flex:1;">
                    <label style="color:${colors.textDim};font-size:10px;font-weight:600;display:block;margin-bottom:4px;">AVATAR URL</label>
                    <input type="text" id="settings-avatar-input" value="${SettingsState.avatarUrl}" placeholder="https://example.com/avatar.png" style="
                        width:100%;padding:10px 12px;background:${colors.inputBg};border:1px solid ${colors.inputBorder};
                        border-radius:8px;color:${colors.text};font-size:12px;outline:none;box-sizing:border-box;
                        transition:border-color 0.2s;
                    " onfocus="this.style.borderColor='${colors.inputFocus}'" onblur="this.style.borderColor='${colors.inputBorder}'">
                </div>
            </div>
            
            <!-- Username -->
            <div style="margin-bottom:20px;">
                <label style="color:${colors.textDim};font-size:10px;font-weight:600;display:block;margin-bottom:4px;">USERNAME</label>
                <input type="text" id="settings-username-input" value="${SettingsState.username}" placeholder="Enter username" style="
                    width:100%;padding:10px 12px;background:${colors.inputBg};border:1px solid ${colors.inputBorder};
                    border-radius:8px;color:${colors.text};font-size:13px;outline:none;box-sizing:border-box;
                    transition:border-color 0.2s;
                " onfocus="this.style.borderColor='${colors.inputFocus}'" onblur="this.style.borderColor='${colors.inputBorder}'">
            </div>
            
            <!-- Save Button -->
            <button id="settings-save-profile" style="
                width:100%;padding:12px;background:${colors.accent};color:#0d1117;border:none;
                border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;
                transition:all 0.2s;opacity:${SettingsState.isLoading ? '0.6' : '1'};
            " ${SettingsState.isLoading ? 'disabled' : ''}>
                ${SettingsState.isLoading ? '⏳ Saving...' : '💾 Save Profile'}
            </button>
        </div>
    `;
}

function renderSecurityTab(colors) {
    return `
        <div style="background:${colors.cardBg};border:1px solid ${colors.border};border-radius:12px;padding:20px;">
            <h3 style="color:${colors.text};font-size:15px;font-weight:600;margin:0 0 4px 0;">Security & Password</h3>
            <p style="color:${colors.textDim};font-size:11px;margin:0 0 20px 0;">Change your account password</p>
            
            <!-- Current Password -->
            <div style="margin-bottom:16px;">
                <label style="color:${colors.textDim};font-size:10px;font-weight:600;display:block;margin-bottom:4px;">CURRENT PASSWORD</label>
                <input type="password" id="settings-current-password" placeholder="Enter current password" style="
                    width:100%;padding:10px 12px;background:${colors.inputBg};border:1px solid ${colors.inputBorder};
                    border-radius:8px;color:${colors.text};font-size:13px;outline:none;box-sizing:border-box;
                " onfocus="this.style.borderColor='${colors.inputFocus}'" onblur="this.style.borderColor='${colors.inputBorder}'">
            </div>
            
            <!-- New Password -->
            <div style="margin-bottom:16px;">
                <label style="color:${colors.textDim};font-size:10px;font-weight:600;display:block;margin-bottom:4px;">NEW PASSWORD</label>
                <input type="password" id="settings-new-password" placeholder="Min 6 characters" style="
                    width:100%;padding:10px 12px;background:${colors.inputBg};border:1px solid ${colors.inputBorder};
                    border-radius:8px;color:${colors.text};font-size:13px;outline:none;box-sizing:border-box;
                " onfocus="this.style.borderColor='${colors.inputFocus}'" onblur="this.style.borderColor='${colors.inputBorder}'">
            </div>
            
            <!-- Confirm Password -->
            <div style="margin-bottom:20px;">
                <label style="color:${colors.textDim};font-size:10px;font-weight:600;display:block;margin-bottom:4px;">CONFIRM NEW PASSWORD</label>
                <input type="password" id="settings-confirm-password" placeholder="Re-enter new password" style="
                    width:100%;padding:10px 12px;background:${colors.inputBg};border:1px solid ${colors.inputBorder};
                    border-radius:8px;color:${colors.text};font-size:13px;outline:none;box-sizing:border-box;
                " onfocus="this.style.borderColor='${colors.inputFocus}'" onblur="this.style.borderColor='${colors.inputBorder}'">
            </div>
            
            <!-- Update Button -->
            <button id="settings-update-password" style="
                width:100%;padding:12px;background:#ff4444;color:white;border:none;
                border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;
                transition:all 0.2s;opacity:${SettingsState.isLoading ? '0.6' : '1'};
            " ${SettingsState.isLoading ? 'disabled' : ''}>
                ${SettingsState.isLoading ? '⏳ Updating...' : '🔒 Update Password'}
            </button>
        </div>
    `;
}

function renderNotificationsTab(colors) {
    return `
        <div style="background:${colors.cardBg};border:1px solid ${colors.border};border-radius:12px;padding:20px;">
            <h3 style="color:${colors.text};font-size:15px;font-weight:600;margin:0 0 4px 0;">Notification Preferences</h3>
            <p style="color:${colors.textDim};font-size:11px;margin:0 0 20px 0;">Manage your alert settings</p>
            
            <!-- Email Reports -->
            <div style="display:flex;align-items:center;justify-content:space-between;padding:14px 0;border-bottom:1px solid ${colors.border};">
                <div>
                    <span style="color:${colors.text};font-size:13px;font-weight:500;">📧 Email Reports</span>
                    <span style="color:${colors.textDim};font-size:10px;display:block;">Weekly performance summaries</span>
                </div>
                <label style="position:relative;display:inline-block;width:44px;height:24px;cursor:pointer;">
                    <input type="checkbox" id="settings-toggle-email" ${SettingsState.preferences.emailReports ? 'checked' : ''} style="opacity:0;width:0;height:0;">
                    <span style="
                        position:absolute;top:0;left:0;right:0;bottom:0;
                        background:${SettingsState.preferences.emailReports ? colors.accent : colors.border};
                        border-radius:24px;transition:0.3s;
                    "></span>
                    <span style="
                        position:absolute;top:2px;left:${SettingsState.preferences.emailReports ? '22px' : '2px'};
                        width:20px;height:20px;background:white;border-radius:50%;transition:0.3s;
                    "></span>
                </label>
            </div>
            
            <!-- Session Sound FX -->
            <div style="display:flex;align-items:center;justify-content:space-between;padding:14px 0;border-bottom:1px solid ${colors.border};">
                <div>
                    <span style="color:${colors.text};font-size:13px;font-weight:500;">🔊 Session Sound FX</span>
                    <span style="color:${colors.textDim};font-size:10px;display:block;">Audio feedback during gameplay</span>
                </div>
                <label style="position:relative;display:inline-block;width:44px;height:24px;cursor:pointer;">
                    <input type="checkbox" id="settings-toggle-sound" ${SettingsState.preferences.sessionSoundFX ? 'checked' : ''} style="opacity:0;width:0;height:0;">
                    <span style="
                        position:absolute;top:0;left:0;right:0;bottom:0;
                        background:${SettingsState.preferences.sessionSoundFX ? colors.accent : colors.border};
                        border-radius:24px;transition:0.3s;
                    "></span>
                    <span style="
                        position:absolute;top:2px;left:${SettingsState.preferences.sessionSoundFX ? '22px' : '2px'};
                        width:20px;height:20px;background:white;border-radius:50%;transition:0.3s;
                    "></span>
                </label>
            </div>
            
            <!-- Marketing Alerts -->
            <div style="display:flex;align-items:center;justify-content:space-between;padding:14px 0;">
                <div>
                    <span style="color:${colors.text};font-size:13px;font-weight:500;">📢 Marketing Alerts</span>
                    <span style="color:${colors.textDim};font-size:10px;display:block;">Promotional offers and updates</span>
                </div>
                <label style="position:relative;display:inline-block;width:44px;height:24px;cursor:pointer;">
                    <input type="checkbox" id="settings-toggle-marketing" ${SettingsState.preferences.marketingAlerts ? 'checked' : ''} style="opacity:0;width:0;height:0;">
                    <span style="
                        position:absolute;top:0;left:0;right:0;bottom:0;
                        background:${SettingsState.preferences.marketingAlerts ? colors.accent : colors.border};
                        border-radius:24px;transition:0.3s;
                    "></span>
                    <span style="
                        position:absolute;top:2px;left:${SettingsState.preferences.marketingAlerts ? '22px' : '2px'};
                        width:20px;height:20px;background:white;border-radius:50%;transition:0.3s;
                    "></span>
                </label>
            </div>
        </div>
    `;
}

// ============================================
// SECTION 6: EVENT BINDING
// ============================================

function bindSettingsEvents() {
    // Profile save button
    const saveProfileBtn = document.getElementById('settings-save-profile');
    if (saveProfileBtn) {
        saveProfileBtn.addEventListener('click', async () => {
            const usernameInput = document.getElementById('settings-username-input');
            const avatarInput = document.getElementById('settings-avatar-input');
            
            const username = usernameInput?.value?.trim() || '';
            const avatarUrl = avatarInput?.value?.trim() || '';
            
            // Validate
            const errors = validateProfileForm();
            if (errors.length > 0) {
                showMessage(errors[0], 'error');
                return;
            }
            
            // Update username
            if (username !== SettingsState.username) {
                await updateUsername(username);
            }
            
            // Update avatar
            if (avatarUrl !== SettingsState.avatarUrl) {
                await updateAvatar(avatarUrl);
            }
            
            if (username === SettingsState.username && avatarUrl === SettingsState.avatarUrl) {
                showMessage('No changes detected', 'info');
            }
        });
    }
    
    // Password update button
    const updatePasswordBtn = document.getElementById('settings-update-password');
    if (updatePasswordBtn) {
        updatePasswordBtn.addEventListener('click', async () => {
            const currentInput = document.getElementById('settings-current-password');
            const newInput = document.getElementById('settings-new-password');
            const confirmInput = document.getElementById('settings-confirm-password');
            
            SettingsState.currentPassword = currentInput?.value || '';
            SettingsState.newPassword = newInput?.value || '';
            SettingsState.confirmPassword = confirmInput?.value || '';
            
            // Validate
            const errors = validatePasswordForm();
            if (errors.length > 0) {
                showMessage(errors[0], 'error');
                return;
            }
            
            await updatePassword(SettingsState.currentPassword, SettingsState.newPassword);
            
            // Clear fields after success
            if (currentInput) currentInput.value = '';
            if (newInput) newInput.value = '';
            if (confirmInput) confirmInput.value = '';
        });
    }
    
    // Notification toggles
    const emailToggle = document.getElementById('settings-toggle-email');
    const soundToggle = document.getElementById('settings-toggle-sound');
    const marketingToggle = document.getElementById('settings-toggle-marketing');
    
    if (emailToggle) {
        emailToggle.addEventListener('change', function() {
            SettingsState.preferences.emailReports = this.checked;
            savePreferences();
            showMessage('Email reports ' + (this.checked ? 'enabled' : 'disabled'), 'success');
        });
    }
    
    if (soundToggle) {
        soundToggle.addEventListener('change', function() {
            SettingsState.preferences.sessionSoundFX = this.checked;
            savePreferences();
            showMessage('Sound effects ' + (this.checked ? 'enabled' : 'disabled'), 'success');
        });
    }
    
    if (marketingToggle) {
        marketingToggle.addEventListener('change', function() {
            SettingsState.preferences.marketingAlerts = this.checked;
            savePreferences();
            showMessage('Marketing alerts ' + (this.checked ? 'enabled' : 'disabled'), 'success');
        });
    }
}

// ============================================
// SECTION 7: PUBLIC API
// ============================================

const SettingsComponent = {
    async init() {
        loadPreferences();
        await loadUserProfile();
        renderSettingsView();
    },
    
    switchTab(tab) {
        SettingsState.activeTab = tab;
        SettingsState.message = null;
        renderSettingsView();
    },
    
    refresh() {
        renderSettingsView();
    }
};

// ============================================
// SECTION 8: HASH ROUTER INTEGRATION
// ============================================

function setupSettingsHashListener() {
    window.addEventListener('hashchange', () => {
        if (window.location.hash === '#settings-view') {
            setTimeout(() => SettingsComponent.init(), 200);
        }
    });
    
    if (window.location.hash === '#settings-view') {
        setTimeout(() => SettingsComponent.init(), 300);
    }
}

// ============================================
// SECTION 9: GLOBAL EXPORT
// ============================================

window.SettingsComponent = SettingsComponent;

// ============================================
// SECTION 10: AUTO-INITIALIZE
// ============================================

(function init() {
    setupSettingsHashListener();
    console.log('⚙️ Settings Module v1.0.0 Loaded');
    console.log('📋 Available: window.SettingsComponent');
})();
