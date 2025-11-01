# Testing Checklist

## Step 1: Rebuild Assets ✅

```bash
npm run build
```

Wait for the build to complete. You should see output like:
```
✓ built in XXXms
```

## Step 2: Verify CSS File Exists

```bash
ls -lh public/build/assets/app-*.css
```

You should see a file like `app-Ciyl7m4w.css` with size around 33KB.

## Step 3: Clear All Caches

```bash
php artisan optimize:clear
```

## Step 4: Test the Home Page (No Auth Required)

1. Open browser in **incognito/private mode** (to avoid cache)
2. Visit: `https://app.dhruvinbhudia.me`
3. **Expected:** Page should display with proper styling:
   - White background
   - Proper fonts and colors
   - Navigation menu at top
   - Hero section with content
   - Features section
   - Pricing section

## Step 5: Test Login Flow

### 5a. Start Login
1. Click "Login" button
2. **Expected:** Redirected to WorkOS login page

### 5b. Complete Authentication
1. Enter credentials on WorkOS
2. Complete authentication
3. **Expected:** Redirected back to your app

### 5c. Check Auth Status
If you get 403 error, visit this debug URL:
```
https://app.dhruvinbhudia.me/debug-user
```

**Expected Response (if authenticated):**
```json
{
  "authenticated": true,
  "user": {
    "id": 1,
    "name": "Your Name",
    "email": "your@email.com",
    "is_admin": 0,
    "workos_id": "user_xxx"
  },
  "session": {
    "two_factor_authenticated": true,
    "session_id": "xxx"
  },
  "groups_count": 0,
  "can_access_dashboard": true
}
```

**If you see 403 or "Not authenticated":**
- The session isn't being established after WorkOS callback
- Continue to Step 6

## Step 6: Troubleshoot 403 Error

### Check 1: Browser Cookies
1. Open DevTools (F12)
2. Go to Application → Cookies
3. Check if cookies exist for `app.dhruvinbhudia.me`
4. Look for: `laravel_session`, `XSRF-TOKEN`

**If cookies are missing:**
```bash
# Check session configuration
php artisan tinker
>>> config('session.domain')
>>> config('session.secure')
>>> exit
```

### Check 2: Session Driver
```bash
# Check what session driver is being used
grep SESSION_DRIVER .env
```

Should be: `SESSION_DRIVER=database`

### Check 3: Check Database Sessions
```bash
php artisan tinker
>>> DB::table('sessions')->count()
>>> DB::table('sessions')->latest()->first()
>>> exit
```

### Check 4: WorkOS Callback
Add this to check if WorkOS is creating the user:

```bash
php artisan tinker
>>> App\Models\User::where('email', 'your@email.com')->first()
>>> exit
```

## Step 7: Fix 403 Error

### Solution 1: Clear Browser Data
1. Clear all cookies for `app.dhruvinbhudia.me`
2. Clear browser cache
3. Close browser completely
4. Reopen and try logging in again

### Solution 2: Clear Server Sessions
```bash
php artisan session:flush
php artisan cache:clear
php artisan config:clear
```

### Solution 3: Check Session Configuration

Edit `.env` and ensure:
```env
SESSION_DRIVER=database
SESSION_LIFETIME=120
SESSION_ENCRYPT=false
SESSION_PATH=/
SESSION_DOMAIN=.dhruvinbhudia.me
SESSION_SECURE_COOKIE=true
SESSION_SAME_SITE=lax
```

Then:
```bash
php artisan config:clear
```

### Solution 4: Check WorkOS Middleware

The issue might be in the middleware chain. Check if user is being created:

```bash
tail -f storage/logs/laravel.log
```

Then try logging in and watch for errors.

## Step 8: Verify Everything Works

After fixing the 403 error:

1. ✅ Home page displays with proper styling
2. ✅ Can click Login button
3. ✅ Redirected to WorkOS
4. ✅ After authentication, redirected back
5. ✅ Can access `/debug-user` and see user data
6. ✅ Can access `/dashboard` without 403 error
7. ✅ Dashboard displays with proper styling

## Common Issues & Solutions

### Issue: CSS Still Not Loading

**Symptoms:** Page shows unstyled text, no colors, no layout

**Solution:**
1. Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
2. Check if CSS file exists: `ls public/build/assets/app-*.css`
3. Check browser DevTools → Network tab → Look for CSS file
4. If 404, rebuild: `npm run build`

### Issue: 403 Forbidden After Login

**Symptoms:** After WorkOS authentication, get 403 error

**Possible Causes:**
1. Session not being established
2. CSRF token mismatch
3. Middleware blocking request
4. Cookie not being set

**Solutions:**
1. Check `/debug-user` to see auth status
2. Clear browser cookies
3. Clear server sessions: `php artisan session:flush`
4. Check session configuration in `.env`
5. Check Laravel logs: `tail -f storage/logs/laravel.log`

### Issue: Dark Mode Still Showing

**Symptoms:** Page has black background instead of white

**Solution:**
1. We disabled dark mode detection
2. Rebuild assets: `npm run build`
3. Hard refresh browser
4. Check if `dark` class is on `<html>` element (DevTools → Elements)
5. If still there, the JavaScript isn't running correctly

## Success Criteria

✅ **CSS Working:**
- White background
- Proper fonts (Instrument Sans)
- Colored buttons and elements
- Proper layout and spacing
- Navigation menu styled correctly

✅ **Authentication Working:**
- Can click Login
- Redirected to WorkOS
- After auth, redirected back to app
- Can access dashboard
- No 403 errors
- User data visible in `/debug-user`

## Next Steps After Success

1. Remove debug route (`/debug-user`) from production
2. Re-enable dark mode if desired
3. Test all features:
   - Creating groups
   - Adding assignments
   - Creating tasks
   - Chat functionality
   - Calendar integration

## Need More Help?

If issues persist:

1. **Check Laravel logs:**
   ```bash
   tail -n 200 storage/logs/laravel.log
   ```

2. **Check web server logs:**
   ```bash
   # For Nginx
   tail -f /var/log/nginx/error.log
   
   # For Apache
   tail -f /var/log/apache2/error.log
   ```

3. **Enable debug mode temporarily:**
   ```env
   APP_DEBUG=true
   ```
   Then try accessing the page to see detailed error messages.

4. **Check permissions:**
   ```bash
   ls -la storage/
   ls -la bootstrap/cache/
   ```
   
   Should be writable by web server user.
