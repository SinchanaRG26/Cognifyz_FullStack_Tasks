// ===== CLIENT-SIDE ROUTING =====
const pages = document.querySelectorAll('.page');
const navLinks = document.querySelectorAll('.nav-link');

// Function to load page content
async function loadPageContent(pageId) {
    const contentDiv = document.getElementById(pageId);
    
    // Show loading state
    contentDiv.innerHTML = `
        <div style="text-align: center; padding: 3rem;">
            <div class="spinner" style="border: 4px solid #f3f3f3; border-top: 4px solid var(--primary); border-radius: 50%; width: 50px; height: 50px; animation: spin 1s linear infinite; margin: 20px auto;"></div>
            <p style="margin-top: 1rem; color: var(--primary);">Loading...</p>
        </div>
        <style>
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        </style>
    `;
    
    try {
        const response = await fetch(`/${pageId}`);
        const html = await response.text();
        contentDiv.innerHTML = html;
        
        // Re-attach home page listeners if needed
        if (pageId === 'home') {
            attachHomeListeners();
        }
        
        // Re-attach profile page listeners if needed
        if (pageId === 'profile') {
            attachProfileListeners();
        }
        
        // Re-attach dashboard listeners if needed
        if (pageId === 'dashboard') {
            attachDashboardListeners();
        }
        
    } catch (error) {
        console.error('Error loading page:', error);
        contentDiv.innerHTML = `
            <div style="text-align: center; padding: 3rem; color: #ef4444;">
                <i class="fas fa-exclamation-circle" style="font-size: 3rem;"></i>
                <h3>Error loading page</h3>
                <p>Please try again</p>
            </div>
        `;
    }
}

// Navigate to page
function navigateTo(pageId) {
    // Update active states
    pages.forEach(page => page.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.dataset.page === pageId) link.classList.add('active');
    });
    
    // Update URL
    history.pushState({ page: pageId }, '', `#${pageId}`);
    
    // Load content for profile and dashboard
    if (pageId === 'profile' || pageId === 'dashboard') {
        loadPageContent(pageId);
    }
    
    // Scroll to top
    window.scrollTo(0, 0);
}

// Attach event listeners to nav links
navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        navigateTo(link.dataset.page);
    });
});

// Handle browser back/forward
window.addEventListener('popstate', (event) => {
    if (event.state?.page) {
        navigateTo(event.state.page);
    }
});

// Initialize based on URL hash
const initialPage = window.location.hash.substring(1) || 'home';
navigateTo(initialPage);

// ===== HOME PAGE VALIDATION =====
function attachHomeListeners() {
    console.log('Attaching home page listeners');
    
    // Password validation function
    function validatePassword(password) {
        return {
            length: password.length >= 8,
            uppercase: /[A-Z]/.test(password),
            number: /[0-9]/.test(password),
            special: /[!@#$%^&*]/.test(password)
        };
    }
    
    // Username check
    const usernameInput = document.getElementById('username');
    if (usernameInput) {
        let timeout;
        usernameInput.addEventListener('input', function(e) {
            clearTimeout(timeout);
            const username = e.target.value;
            const indicator = document.getElementById('username-indicator');
            
            if (!indicator) return;
            
            if (username.length < 3) {
                indicator.innerHTML = '❌ Min 3 characters';
                indicator.className = 'live-indicator unavailable';
                return;
            }
            
            timeout = setTimeout(() => {
                fetch('/api/check-username', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username })
                })
                .then(res => res.json())
                .then(data => {
                    indicator.innerHTML = data.message;
                    indicator.className = `live-indicator ${data.available ? 'available' : 'unavailable'}`;
                })
                .catch(err => console.error('Error checking username:', err));
            }, 500);
        });
    }
    
    // Email validation
    const emailInput = document.getElementById('email');
    if (emailInput) {
        emailInput.addEventListener('input', function(e) {
            const email = e.target.value;
            const indicator = document.getElementById('email-indicator');
            if (!indicator) return;
            
            const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
            
            if (!email) indicator.innerHTML = '';
            else if (isValid) {
                indicator.innerHTML = '✅ Valid email';
                indicator.className = 'live-indicator available';
                e.target.className = 'success';
            } else {
                indicator.innerHTML = '❌ Invalid email';
                indicator.className = 'live-indicator unavailable';
                e.target.className = 'error';
            }
        });
    }
    
    // Password validation
    const passwordInput = document.getElementById('password');
    if (passwordInput) {
        passwordInput.addEventListener('input', function(e) {
            const password = e.target.value;
            const checks = validatePassword(password);
            const strength = Object.values(checks).filter(Boolean).length;
            
            // Update checklist
            const checkLength = document.getElementById('check-length');
            const checkUppercase = document.getElementById('check-uppercase');
            const checkNumber = document.getElementById('check-number');
            const checkSpecial = document.getElementById('check-special');
            
            if (checkLength) checkLength.className = `checklist-item ${checks.length ? 'valid' : ''}`;
            if (checkUppercase) checkUppercase.className = `checklist-item ${checks.uppercase ? 'valid' : ''}`;
            if (checkNumber) checkNumber.className = `checklist-item ${checks.number ? 'valid' : ''}`;
            if (checkSpecial) checkSpecial.className = `checklist-item ${checks.special ? 'valid' : ''}`;
            
            // Update meter
            const meter = document.getElementById('strength-meter');
            if (meter) {
                meter.className = `strength-meter-fill strength-${strength}`;
            }
            
            const strengthText = document.getElementById('strength-text');
            if (strengthText) {
                const texts = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
                strengthText.textContent = texts[strength];
            }
            
            // Check confirm password
            const confirmInput = document.getElementById('confirm-password');
            if (confirmInput?.value) checkConfirmPassword();
        });
    }
    
    // Confirm password
    function checkConfirmPassword() {
        const password = document.getElementById('password')?.value || '';
        const confirm = document.getElementById('confirm-password')?.value || '';
        const indicator = document.getElementById('confirm-indicator');
        
        if (!indicator) return;
        
        if (!confirm) indicator.innerHTML = '';
        else if (password === confirm) {
            indicator.innerHTML = '✅ Passwords match';
            indicator.className = 'live-indicator available';
        } else {
            indicator.innerHTML = '❌ Passwords do not match';
            indicator.className = 'live-indicator unavailable';
        }
    }
    
    const confirmInput = document.getElementById('confirm-password');
    if (confirmInput) {
        confirmInput.addEventListener('input', checkConfirmPassword);
    }
    
    // Age validation
    const ageInput = document.getElementById('age');
    if (ageInput) {
        ageInput.addEventListener('input', function(e) {
            const age = parseInt(e.target.value);
            const indicator = document.getElementById('age-indicator');
            if (!indicator) return;
            
            if (!age) indicator.innerHTML = '';
            else if (age >= 18 && age <= 100) {
                indicator.innerHTML = '✅ Valid age';
                indicator.className = 'live-indicator available';
                e.target.className = 'success';
            } else {
                indicator.innerHTML = '❌ Age 18-100 required';
                indicator.className = 'live-indicator unavailable';
                e.target.className = 'error';
            }
        });
    }
    
    // Phone validation
    const phoneInput = document.getElementById('phone');
    if (phoneInput) {
        phoneInput.addEventListener('input', function(e) {
            let phone = e.target.value.replace(/\D/g, '');
            e.target.value = phone;
            const indicator = document.getElementById('phone-indicator');
            if (!indicator) return;
            
            if (!phone) indicator.innerHTML = '';
            else if (phone.length === 10) {
                indicator.innerHTML = '✅ Valid phone';
                indicator.className = 'live-indicator available';
                e.target.className = 'success';
            } else {
                indicator.innerHTML = `❌ ${10 - phone.length} digits left`;
                indicator.className = 'live-indicator unavailable';
                e.target.className = 'error';
            }
        });
    }
    
    // Terms checkbox
    const terms = document.getElementById('terms');
    const submitBtn = document.getElementById('submit-btn');
    if (terms && submitBtn) {
        terms.addEventListener('change', function(e) {
            submitBtn.disabled = !e.target.checked;
        });
    }
    
    // ===== FORM SUBMISSION WITH AUTO-REFRESH =====
    const form = document.getElementById('registration-form');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData.entries());
            
            fetch('/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            })
            .then(res => res.json())
            .then(data => {
                const toast = document.getElementById('toast');
                if (!toast) return;
                
                if (data.success) {
                    toast.textContent = '✅ Registration successful!';
                    toast.className = 'toast success show';
                    e.target.reset();
                    
                    // Update user count on home page
                    const userCount = document.getElementById('user-count');
                    if (userCount) {
                        userCount.textContent = `👥 Registered Users: ${data.userCount}`;
                    }
                    
                    if (submitBtn) submitBtn.disabled = true;
                    
                    // Reset form validation indicators
                    document.querySelectorAll('.live-indicator').forEach(el => el.innerHTML = '');
                    document.querySelectorAll('input').forEach(input => {
                        input.classList.remove('success', 'error');
                    });
                    
                    // Reset password strength
                    const meter = document.getElementById('strength-meter');
                    if (meter) meter.className = 'strength-meter-fill strength-0';
                    
                    const strengthText = document.getElementById('strength-text');
                    if (strengthText) strengthText.textContent = 'Very Weak';
                    
                    // Reset checklist
                    document.querySelectorAll('.checklist-item').forEach(item => {
                        item.classList.remove('valid');
                    });
                    
                    // AUTO-REFRESH DASHBOARD if visible
                    const dashboardPage = document.getElementById('dashboard');
                    if (dashboardPage && dashboardPage.classList.contains('active')) {
                        loadPageContent('dashboard');
                    }
                    
                    // AUTO-REFRESH PROFILE if visible
                    const profilePage = document.getElementById('profile');
                    if (profilePage && profilePage.classList.contains('active')) {
                        loadPageContent('profile');
                    }
                    
                } else {
                    toast.textContent = '❌ ' + data.errors.join(', ');
                    toast.className = 'toast error show';
                }
                
                // Hide toast after 3 seconds
                setTimeout(() => toast.classList.remove('show'), 3000);
            })
            .catch(err => {
                console.error('Error:', err);
                const toast = document.getElementById('toast');
                if (toast) {
                    toast.textContent = '❌ Registration failed. Please try again.';
                    toast.className = 'toast error show';
                    setTimeout(() => toast.classList.remove('show'), 3000);
                }
            });
        });
    }
}

// ===== PROFILE PAGE LISTENERS =====
function attachProfileListeners() {
    console.log('Attaching profile page listeners');
    
    // Make profile functions globally available
    window.showEditForm = function() {
        const profileView = document.getElementById('profileView');
        const editForm = document.getElementById('editForm');
        const settingsPanel = document.getElementById('settingsPanel');
        const actionButtons = document.getElementById('actionButtons');
        
        if (profileView) profileView.classList.add('hidden');
        if (editForm) editForm.classList.remove('hidden');
        if (settingsPanel) settingsPanel.classList.add('hidden');
        if (actionButtons) actionButtons.classList.add('hidden');
    };
    
    window.cancelEdit = function() {
        const profileView = document.getElementById('profileView');
        const editForm = document.getElementById('editForm');
        const settingsPanel = document.getElementById('settingsPanel');
        const actionButtons = document.getElementById('actionButtons');
        
        if (profileView) profileView.classList.remove('hidden');
        if (editForm) editForm.classList.add('hidden');
        if (settingsPanel) settingsPanel.classList.add('hidden');
        if (actionButtons) actionButtons.classList.remove('hidden');
    };
    
    window.saveProfile = function() {
        const newUsername = document.getElementById('editUsername')?.value;
        const newEmail = document.getElementById('editEmail')?.value;
        const newAge = document.getElementById('editAge')?.value;
        const newPhone = document.getElementById('editPhone')?.value;
        
        // Update display
        const displayName = document.getElementById('displayName');
        const displayEmail = document.getElementById('displayEmail');
        const displayAge = document.getElementById('displayAge');
        const displayPhone = document.getElementById('displayPhone');
        
        if (displayName) displayName.textContent = newUsername;
        if (displayEmail) displayEmail.textContent = newEmail;
        if (displayAge) displayAge.textContent = newAge + ' years';
        if (displayPhone) displayPhone.textContent = newPhone;
        
        window.cancelEdit();
        window.showToast('✅ Profile updated successfully!', 'success');
    };
    
    window.showSettings = function() {
        const profileView = document.getElementById('profileView');
        const editForm = document.getElementById('editForm');
        const settingsPanel = document.getElementById('settingsPanel');
        const actionButtons = document.getElementById('actionButtons');
        
        if (profileView) profileView.classList.add('hidden');
        if (editForm) editForm.classList.add('hidden');
        if (settingsPanel) settingsPanel.classList.remove('hidden');
        if (actionButtons) actionButtons.classList.add('hidden');
    };
    
    window.closeSettings = function() {
        const profileView = document.getElementById('profileView');
        const editForm = document.getElementById('editForm');
        const settingsPanel = document.getElementById('settingsPanel');
        const actionButtons = document.getElementById('actionButtons');
        
        if (profileView) profileView.classList.remove('hidden');
        if (editForm) editForm.classList.add('hidden');
        if (settingsPanel) settingsPanel.classList.add('hidden');
        if (actionButtons) actionButtons.classList.remove('hidden');
    };
    
    window.toggleSetting = function(setting) {
        const element = document.getElementById(setting + 'Toggle');
        if (element) {
            element.classList.toggle('active');
            const status = element.classList.contains('active') ? 'enabled' : 'disabled';
            window.showToast(`⚙️ ${setting} notifications ${status}`, 'info');
        }
    };
    
    window.toggleDarkMode = function() {
        const toggle = document.getElementById('darkModeToggle');
        if (toggle) {
            toggle.classList.toggle('active');
            
            if (toggle.classList.contains('active')) {
                document.body.style.background = '#1e293b';
                document.body.style.color = 'white';
                // Change card background for dark mode
                document.querySelectorAll('.profile-card, .settings-panel, .edit-form').forEach(el => {
                    if (el) el.style.background = '#334155';
                });
                window.showToast('🌙 Dark mode enabled', 'success');
            } else {
                document.body.style.background = '#f8fafc';
                document.body.style.color = '#1e293b';
                // Reset card backgrounds
                document.querySelectorAll('.profile-card, .settings-panel, .edit-form').forEach(el => {
                    if (el) el.style.background = 'white';
                });
                window.showToast('☀️ Light mode enabled', 'success');
            }
        }
    };
    
    window.changeLanguage = function(lang) {
        const languages = {
            'en': 'English',
            'hi': 'Hindi',
            'kn': 'Kannada',
            'te': 'Telugu'
        };
        window.showToast(`🌐 Language changed to ${languages[lang]}`, 'success');
    };
    
    window.showToast = function(message, type = 'info') {
        const toast = document.getElementById('toast');
        if (!toast) return;
        
        const toastMessage = document.getElementById('toastMessage');
        const icon = toast.querySelector('i');
        
        if (toastMessage) toastMessage.textContent = message;
        
        if (type === 'success') {
            if (icon) icon.className = 'fas fa-check-circle';
            toast.className = 'toast success show';
        } else if (type === 'error') {
            if (icon) icon.className = 'fas fa-exclamation-circle';
            toast.className = 'toast error show';
        } else {
            if (icon) icon.className = 'fas fa-info-circle';
            toast.className = 'toast show';
        }
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    };
    
    // Attach avatar click listener
    const avatar = document.querySelector('.avatar');
    if (avatar) {
        avatar.addEventListener('click', function() {
            window.showToast('📸 Profile picture upload feature coming soon!', 'info');
        });
    }
}

// ===== DASHBOARD LISTENERS =====
function attachDashboardListeners() {
    console.log('Attaching dashboard listeners');
    
    // Make filter function available
    window.filterUsers = function() {
        const searchTerm = document.getElementById('searchUser')?.value.toLowerCase() || '';
        const userCards = document.querySelectorAll('.user-card');
        
        userCards.forEach(card => {
            const name = card.querySelector('.user-name')?.textContent.toLowerCase() || '';
            const email = card.querySelector('.user-email')?.textContent.toLowerCase() || '';
            
            if (name.includes(searchTerm) || email.includes(searchTerm)) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    };
}

// ===== GLOBAL FUNCTIONS =====

// Show notification (can be called from any page)
window.showNotification = function(message, type = 'info') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    
    toast.textContent = message;
    toast.className = `toast ${type === 'success' ? 'success' : 'error'} show`;
    
    setTimeout(() => toast.classList.remove('show'), 3000);
};

// Attach home listeners initially
attachHomeListeners();

// ===== ADD SMOOTH SCROLLING =====
document.addEventListener('DOMContentLoaded', function() {
    // Add smooth scroll for any anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href && href !== '#') {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth' });
                }
            }
        });
    });
    
    console.log('✅ Script.js loaded successfully');
});

// Handle any errors globally
window.addEventListener('error', function(e) {
    console.error('Global error:', e.error);
});
