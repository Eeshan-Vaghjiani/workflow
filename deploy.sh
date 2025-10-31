#!/bin/bash

# Laravel + React Deployment Script for Azure VM
# Usage: sudo bash deploy.sh

echo "🚀 Starting deployment..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
APP_DIR="/var/www/study-planner"
PHP_VERSION="8.2"

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Please run as root (use sudo)${NC}"
    exit 1
fi

# Navigate to app directory
cd $APP_DIR || exit

echo -e "${YELLOW}📥 Pulling latest changes from Git...${NC}"
git pull origin main

echo -e "${YELLOW}🔧 Setting maintenance mode...${NC}"
php artisan down

echo -e "${YELLOW}📦 Installing/Updating dependencies...${NC}"
# Uncomment if vendor is not committed
# composer install --optimize-autoloader --no-dev

echo -e "${YELLOW}🗄️  Running database migrations...${NC}"
php artisan migrate --force

echo -e "${YELLOW}🧹 Clearing caches...${NC}"
php artisan config:clear
php artisan cache:clear
php artisan view:clear
php artisan route:clear

echo -e "${YELLOW}⚡ Optimizing application...${NC}"
php artisan config:cache
php artisan route:cache
php artisan view:cache

echo -e "${YELLOW}🔐 Setting proper permissions...${NC}"
chown -R www-data:www-data $APP_DIR
chmod -R 755 $APP_DIR
chmod -R 775 $APP_DIR/storage
chmod -R 775 $APP_DIR/bootstrap/cache

echo -e "${YELLOW}🔄 Restarting services...${NC}"
systemctl restart php${PHP_VERSION}-fpm
systemctl restart nginx

# Restart queue workers if supervisor is installed
if command -v supervisorctl &> /dev/null; then
    echo -e "${YELLOW}👷 Restarting queue workers...${NC}"
    supervisorctl restart study-planner-worker:*
fi

echo -e "${YELLOW}✅ Bringing application back online...${NC}"
php artisan up

echo -e "${GREEN}✨ Deployment completed successfully!${NC}"
echo -e "${GREEN}🌐 Your app is live at: https://app.dhruvinbhudia.me${NC}"

# Show last 20 lines of log
echo -e "\n${YELLOW}📋 Recent logs:${NC}"
tail -20 $APP_DIR/storage/logs/laravel.log
