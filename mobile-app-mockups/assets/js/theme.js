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
        // Navigate to AI assistant page
        window.location.href = '../pages/ai-assistant.html';
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
    // Navigate to AI assistant page instead of overlay
    window.location.href = '../pages/ai-assistant.html';
}

function closeAIChat() {
    const overlay = document.querySelector('.ai-chat-overlay');
    if (overlay) {
        overlay.remove();
    }
}

// Utility functions for existing functionality
function showNotifications() {
    window.location.href = '../pages/notifications.html';
}

function showProfile() {
    window.location.href = '../pages/profile.html';
}

function createTask() {
    window.location.href = '../pages/add-task.html';
}

function shareStudyPlan() {
    alert('Share functionality coming soon!');
}