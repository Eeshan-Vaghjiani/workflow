# Deployment Quick Reference

Quick commands for managing your Laravel app on Azure VM.

## 🔗 SSH Connection
```bash
ssh your-username@your-vm-ip
```

## 📂 Application Directory
```bash
cd /var/www/study-planner
```

## 🔄 Deploy Updates
```bash
sudo bash /var/www/study-planner/deploy.sh
```

## 📋 View Logs
```bash
# Laravel application logs
sudo tail -f /var/www/study-planner/storage/logs/laravel.log

# Nginx error logs
sudo tail -f /var/log/nginx/error.log

# PHP-FPM logs
sudo tail -f /var/log/php8.2-fpm.log
```

## 🔧 Artisan Commands
```bash
cd /var/www/study-planner

# Clear all caches
sudo php artisan cache:clear
sudo php artisan config:clear
sudo php artisan route:clear
sudo php artisan view:clear

# Rebuild caches
sudo php artisan config:cache
sudo php artisan route:cache
sudo php artisan view:cache

# Run migrations
sudo php artisan migrate --force

# Enter maintenance mode
sudo php artisan down

# Exit maintenance mode
sudo php artisan up
```

## 🔄 Restart Services
```bash
# Restart PHP-FPM
sudo systemctl restart php8.2-fpm

# Restart Nginx
sudo systemctl restart nginx

# Restart queue workers (if using)
sudo supervisorctl restart study-planner-worker:*
```

## 🔍 Check Service Status
```bash
# Check PHP-FPM
sudo systemctl status php8.2-fpm

# Check Nginx
sudo systemctl status nginx

# Check MySQL
sudo systemctl status mysql

# Check queue workers
sudo supervisorctl status
```

## 🗄️ Database Commands
```bash
# Login to MySQL
sudo mysql

# Backup database
sudo mysqldump -u study_planner_user -p study_planner > backup_$(date +%Y%m%d).sql

# Restore database
sudo mysql -u study_planner_user -p study_planner < backup_20251031.sql
```

## 🔐 File Permissions
```bash
cd /var/www/study-planner

# Fix ownership
sudo chown -R www-data:www-data .

# Fix directory permissions
sudo find . -type d -exec chmod 755 {} \;

# Fix file permissions
sudo find . -type f -exec chmod 644 {} \;

# Storage and cache need write permissions
sudo chmod -R 775 storage bootstrap/cache
```

## 🔒 SSL Certificate Renewal
```bash
# Renew SSL certificate
sudo certbot renew

# Test renewal (dry run)
sudo certbot renew --dry-run
```

## 📊 Disk Space
```bash
# Check disk usage
df -h

# Check directory sizes
du -sh /var/www/study-planner/*

# Clean old logs
sudo find /var/www/study-planner/storage/logs -name "*.log" -mtime +30 -delete
```

## 🔥 Emergency Commands

### Site is down
```bash
# Check if services are running
sudo systemctl status nginx php8.2-fpm mysql

# Restart all services
sudo systemctl restart nginx php8.2-fpm mysql

# Check logs
sudo tail -100 /var/www/study-planner/storage/logs/laravel.log
```

### High CPU/Memory usage
```bash
# Check processes
top
htop

# Check PHP-FPM processes
ps aux | grep php-fpm

# Restart PHP-FPM
sudo systemctl restart php8.2-fpm
```

### Database issues
```bash
# Check MySQL status
sudo systemctl status mysql

# Restart MySQL
sudo systemctl restart mysql

# Check connections
sudo mysql -e "SHOW PROCESSLIST;"
```

## 📱 URLs

- **Production**: https://app.dhruvinbhudia.me
- **Server IP**: [Your Azure VM IP]

## 🆘 Support Contacts

- **Logs Location**: `/var/www/study-planner/storage/logs/`
- **Nginx Config**: `/etc/nginx/sites-available/study-planner`
- **PHP Config**: `/etc/php/8.2/fpm/php.ini`
- **Environment**: `/var/www/study-planner/.env`

---

**Tip**: Bookmark this file for quick access to common commands!
