# Pre-Deployment Checklist

Before deploying to Azure VM, ensure all these items are completed:

## ✅ Local Build Completed

- [x] **Build files generated**: `public/build/` directory exists with compiled assets
- [x] **Vendor directory**: `vendor/` directory with all PHP dependencies
- [x] **.gitignore updated**: Build and vendor directories are no longer ignored
- [x] **Model naming fixed**: `AiPrompt.php` file renamed to match PSR-4 standards

## 📋 Files to Commit

Make sure these are committed to your repository:

```bash
git add .gitignore
git add public/build/
git add vendor/
git add app/Models/AiPrompt.php
git add AZURE_DEPLOYMENT_GUIDE.md
git add PRE_DEPLOYMENT_CHECKLIST.md
git add deploy.sh
git commit -m "Prepare for Azure deployment with pre-built assets"
git push origin main
```

## 🔧 Environment Configuration

Before deployment, prepare these values:

### Database Credentials
- [ ] Database name: `study_planner`
- [ ] Database username: `study_planner_user`
- [ ] Database password: (create a strong password)

### Application Settings
- [ ] APP_URL: `https://app.dhruvinbhudia.me`
- [ ] APP_ENV: `production`
- [ ] APP_DEBUG: `false`

### Optional Services (if used)
- [ ] Mail credentials (MAIL_HOST, MAIL_USERNAME, MAIL_PASSWORD)
- [ ] Pusher credentials (if using real-time features)
- [ ] AWS S3 credentials (if using cloud storage)
- [ ] Google Calendar API (if using calendar sync)
- [ ] WorkOS credentials (if using SSO)

## 🌐 DNS Configuration

- [ ] Azure VM has a public IP address
- [ ] DNS A record created:
  - Name: `app`
  - Type: `A`
  - Value: `[Your Azure VM IP]`
  - TTL: `3600`

## 🔐 Security Checklist

- [ ] Strong database password created
- [ ] SSH key authentication configured (recommended)
- [ ] Firewall rules configured (ports 22, 80, 443)
- [ ] Root SSH login disabled
- [ ] Regular backup strategy planned

## 📦 Azure VM Requirements

Ensure your VM has:
- [ ] Ubuntu 20.04/22.04 or similar
- [ ] Minimum 2GB RAM (4GB recommended)
- [ ] At least 20GB storage
- [ ] Public IP address assigned

## 🚀 Ready to Deploy?

If all items above are checked, you're ready to deploy!

### Quick Start Commands

1. **Commit and push your changes:**
```bash
git add .
git commit -m "Prepare for Azure deployment"
git push origin main
```

2. **SSH into your Azure VM:**
```bash
ssh your-username@your-vm-ip
```

3. **Follow the deployment guide:**
Open `AZURE_DEPLOYMENT_GUIDE.md` and follow steps 1-11

4. **Use the deployment script for updates:**
```bash
sudo bash /var/www/study-planner/deploy.sh
```

## 📊 Post-Deployment Verification

After deployment, verify:
- [ ] Website loads at `https://app.dhruvinbhudia.me`
- [ ] SSL certificate is active (green padlock)
- [ ] Login/registration works
- [ ] Database connections work
- [ ] Assets load correctly (CSS, JS, images)
- [ ] No errors in Laravel logs

## 🆘 Need Help?

If you encounter issues:
1. Check `AZURE_DEPLOYMENT_GUIDE.md` troubleshooting section
2. Review Laravel logs: `sudo tail -f /var/www/study-planner/storage/logs/laravel.log`
3. Check Nginx logs: `sudo tail -f /var/log/nginx/error.log`

---

**Note**: This checklist assumes you're deploying with pre-built assets (no build step on server).
