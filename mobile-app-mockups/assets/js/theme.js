// Theme Toggle Functionality
class ThemeManager {
    constructor() {
        this.initTheme();
        this.bindEvents();
    }

    initTheme() {
        // Get saved theme or default to light
        const savedTheme = localStorage.getItem('theme') || 'light';
        this.setTheme(savedTheme);
    }

    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        
        // Update toggle appearance
        const toggle = document.querySelector('.theme-toggle');
        if (toggle) {
            if (theme === 'dark') {
                toggle.classList.add('dark');
            } else {
                toggle.classList.remove('dark');
            }
        }

        // Update theme label
        const label = document.querySelector('.theme-label');
        if (label) {
            label.textContent = theme === 'dark' ? 'Dark Mode' : 'Light Mode';
        }
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
    }

    bindEvents() {
        // Theme toggle click handler
        document.addEventListener('click', (e) => {
            if (e.target.closest('.theme-toggle')) {
                this.toggleTheme();
            }
        });
    }
}

// Initialize theme manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ThemeManager();
});

// Navigation functionality
function navigateTo(page) {
    if (page === 'ai-tasks') {
        // Show AI chat interface instead of alert
        showAIChat();
        return;
    }
    
    // Skip pomodoro and study-planner navigation
    if (page === 'pomodoro' || page === 'study-planner') {
        return;
    }
    
    // Navigate to other pages
    if (page === 'dashboard') {
        window.location.href = '../pages/dashboard.html';
    } else {
        window.location.href = `../pages/${page}.html`;
    }
}

// AI Chat functionality
function showAIChat() {
    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'ai-chat-overlay';
    overlay.innerHTML = `
        <div class="ai-chat-container">
            <div class="ai-chat-header">
                <div class="ai-chat-title">
                    <i class="fas fa-brain"></i>
                    AI Assistant
                </div>
                <button class="ai-chat-close" onclick="closeAIChat()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="ai-chat-messages">
                <div class="ai-message">
                    <div class="ai-avatar">🤖</div>
                    <div class="ai-text">Hello! I'm your AI study assistant. How can I help you today?</div>
                </div>
            </div>
            <div class="ai-chat-input">
                <input type="text" placeholder="Ask me anything about your studies..." />
                <button class="ai-send-btn"><i class="fas fa-paper-plane"></i></button>
            </div>
        </div>
    `;
    
    document.body.appendChild(overlay);
    
    // Focus input
    setTimeout(() => {
        overlay.querySelector('input').focus();
    }, 100);
}

function closeAIChat() {
    const overlay = document.querySelector('.ai-chat-overlay');
    if (overlay) {
        overlay.remove();
    }
}

// Utility functions for existing functionality
function showNotifications() {
    alert('Notifications feature coming soon!');
}

function showProfile() {
    alert('Profile page coming soon!');
}

function createTask() {
    alert('Create task functionality coming soon!');
}

function shareStudyPlan() {
    alert('Share functionality coming soon!');
}