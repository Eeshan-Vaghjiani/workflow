# Azure VM Deployment Guide for Laravel + React App
## Domain: app.dhruvinbhudia.me

This guide will help you deploy your Laravel + React application to an Azure Virtual Machine.

---

## Prerequisites on Azure VM

Your Azure VM should have:
- Ubuntu 20.04/22.04 or similar Linux distribution
- Minimum 2GB RAM (4GB recommended)
- At least 20GB storage
- Public IP address

---

## Step 1: Prepare Your Azure VM

### 1.1 Connect to your VM via SSH
```bash
ssh your-username@your-vm-ip
```

### 1.2 Update system packages
```bash
sudo apt update && sudo apt upgrade -y
```

### 1.3 Install required software
```bash
# Install Nginx
sudo apt install nginx -y

# Install PHP 8.2 and required extensions
sudo apt install software-properties-common -y
sudo add-apt-repository ppa:ondrej/php -y
sudo apt update
sudo apt install php8.2 php8.2-fpm php8.2-mysql php8.2-mbstring php8.2-xml php8.2-bcmath php8.2-curl php8.2-zip php8.2-gd php8.2-intl -y

# Install MySQL
sudo apt install mysql-server -y

# Install Composer
curl -sS https://getcomposer.org/installer | php
sudo mv composer.phar /usr/local/bin/composer

# Install Git
sudo apt install git -y

# Install Node.js (optional - only if you need to rebuild)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install nodejs -y
```

---

## Step 2: Setup MySQL Database

```bash
# Secure MySQL installation
sudo mysql_secure_installation

# Login to MySQL
sudo mysql

# Create database and user
CREATE DATABASE study_planner;
CREATE USER 'study_planner_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON study_planner.* TO 'study_planner_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

---

## Step 3: Clone Your Repository

```bash
# Navigate to web directory
cd /var/www

# Clone your repository
sudo git clone https://github.com/your-username/your-repo.git study-planner
cd study-planner

# Set proper ownership
sudo chown -R www-data:www-data /var/www/study-planner
sudo chmod -R 755 /var/www/study-planner
sudo chmod -R 775 /var/www/study-planner/storage
sudo chmod -R 775 /var/www/study-planner/bootstrap/cache
```

---

## Step 4: Configure Environment

```bash
# Copy environment file
sudo cp .env.example .env

# Edit environment file
sudo nano .env
```

Update the following values in `.env`:

```env
APP_NAME="Study Planner"
APP_ENV=production
APP_KEY=
APP_DEBUG=false
APP_URL=https://app.dhruvinbhudia.me

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=study_planner
DB_USERNAME=study_planner_user
DB_PASSWORD=your_secure_password

SESSION_DRIVER=database
QUEUE_CONNECTION=database

# Add your other credentials (Pusher, Mail, etc.)
```

---

## Step 5: Setup Laravel Application

```bash
# Generate application key
sudo php artisan key:generate

# Run migrations
sudo php artisan migrate --force

# Create storage link
sudo php artisan storage:link

# Cache configuration
sudo php artisan config:cache
sudo php artisan route:cache
sudo php artisan view:cache

# Set permissions again
sudo chown -R www-data:www-data /var/www/study-planner
sudo chmod -R 755 /var/www/study-planner
sudo chmod -R 775 /var/www/study-planner/storage
sudo chmod -R 775 /var/www/study-planner/bootstrap/cache
```

---

## Step 6: Configure Nginx

Create Nginx configuration:

```bash
sudo nano /etc/nginx/sites-available/study-planner
```

Add this configuration:

```nginx
server {
    listen 80;
    server_name app.dhruvinbhudia.me;
    root /var/www/study-planner/public;

    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";

    index index.php;

    charset utf-8;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location = /favicon.ico { access_log off; log_not_found off; }
    location = /robots.txt  { access_log off; log_not_found off; }

    error_page 404 /index.php;

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
        fastcgi_hide_header X-Powered-By;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }
}
```

Enable the site:

```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/study-planner /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

---

## Step 7: Setup SSL with Let's Encrypt

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtain SSL certificate
sudo certbot --nginx -d app.dhruvinbhudia.me

# Follow the prompts and select option to redirect HTTP to HTTPS
```

Certbot will automatically update your Nginx configuration to use HTTPS.

---

## Step 8: Configure DNS

In your domain registrar (where you bought dhruvinbhudia.me):

1. Add an A record:
   - **Name/Host**: `app`
   - **Type**: `A`
   - **Value**: Your Azure VM public IP address
   - **TTL**: 3600 (or default)

Wait 5-15 minutes for DNS propagation.

---

## Step 9: Setup Queue Worker (Optional but Recommended)

If your app uses queues:

```bash
# Create supervisor configuration
sudo nano /etc/supervisor/conf.d/study-planner-worker.conf
```

Add:

```ini
[program:study-planner-worker]
process_name=%(program_name)s_%(process_num)02d
command=php /var/www/study-planner/artisan queue:work --sleep=3 --tries=3 --max-time=3600
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
user=www-data
numprocs=2
redirect_stderr=true
stdout_logfile=/var/www/study-planner/storage/logs/worker.log
stopwaitsecs=3600
```

Start the worker:

```bash
sudo apt install supervisor -y
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start study-planner-worker:*
```

---

## Step 10: Setup Cron Jobs

```bash
# Edit crontab
sudo crontab -e
```

Add this line:

```cron
* * * * * cd /var/www/study-planner && php artisan schedule:run >> /dev/null 2>&1
```

---

## Step 11: Verify Deployment

1. Visit `https://app.dhruvinbhudia.me` in your browser
2. Check that the site loads correctly
3. Test login/registration
4. Check logs if there are issues:

```bash
# Laravel logs
sudo tail -f /var/www/study-planner/storage/logs/laravel.log

# Nginx error logs
sudo tail -f /var/log/nginx/error.log

# PHP-FPM logs
sudo tail -f /var/log/php8.2-fpm.log
```

---

## Updating Your Application

When you push changes to your repository:

```bash
cd /var/www/study-planner

# Pull latest changes
sudo git pull origin main

# If you made changes to dependencies (not needed if vendor is committed)
# sudo composer install --optimize-autoloader --no-dev

# Run migrations if any
sudo php artisan migrate --force

# Clear and cache
sudo php artisan config:clear
sudo php artisan cache:clear
sudo php artisan config:cache
sudo php artisan route:cache
sudo php artisan view:cache

# Restart services
sudo systemctl restart php8.2-fpm
sudo systemctl restart nginx

# If using queue workers
sudo supervisorctl restart study-planner-worker:*
```

---

## Troubleshooting

### Issue: 500 Internal Server Error
```bash
# Check Laravel logs
sudo tail -100 /var/www/study-planner/storage/logs/laravel.log

# Check permissions
sudo chown -R www-data:www-data /var/www/study-planner
sudo chmod -R 755 /var/www/study-planner
sudo chmod -R 775 /var/www/study-planner/storage
sudo chmod -R 775 /var/www/study-planner/bootstrap/cache
```

### Issue: Assets not loading
```bash
# Check if build directory exists
ls -la /var/www/study-planner/public/build

# If missing, the build files weren't committed properly
```

### Issue: Database connection error
```bash
# Test MySQL connection
mysql -u study_planner_user -p study_planner

# Check .env file
sudo cat /var/www/study-planner/.env | grep DB_
```

### Issue: PHP errors
```bash
# Check PHP-FPM status
sudo systemctl status php8.2-fpm

# Restart PHP-FPM
sudo systemctl restart php8.2-fpm
```

---

## Security Recommendations

1. **Firewall**: Configure UFW
```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

2. **Disable root SSH login**
```bash
sudo nano /etc/ssh/sshd_config
# Set: PermitRootLogin no
sudo systemctl restart sshd
```

3. **Keep system updated**
```bash
sudo apt update && sudo apt upgrade -y
```

4. **Monitor logs regularly**
```bash
sudo tail -f /var/www/study-planner/storage/logs/laravel.log
```

---

## Performance Optimization

1. **Enable OPcache**
```bash
sudo nano /etc/php/8.2/fpm/php.ini
```

Add/update:
```ini
opcache.enable=1
opcache.memory_consumption=256
opcache.max_accelerated_files=20000
opcache.validate_timestamps=0
```

2. **Optimize Nginx**
```bash
sudo nano /etc/nginx/nginx.conf
```

Add in http block:
```nginx
gzip on;
gzip_vary on;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
```

3. **Restart services**
```bash
sudo systemctl restart php8.2-fpm
sudo systemctl restart nginx
```

---

## Support

If you encounter issues:
1. Check Laravel logs: `/var/www/study-planner/storage/logs/laravel.log`
2. Check Nginx logs: `/var/log/nginx/error.log`
3. Check PHP-FPM logs: `/var/log/php8.2-fpm.log`
4. Verify file permissions
5. Ensure all environment variables are set correctly

---

**Deployment Date**: October 31, 2025
**Domain**: app.dhruvinbhudia.me
**Server**: Azure Virtual Machine
