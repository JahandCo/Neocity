# Production Deployment Checklist for Apache

## Pre-Deployment
- [x] Move game to `/public/` directory
- [x] Update all asset paths in `/public/index.html` to use `../` prefix
- [x] Create landing page at root (`/index.html`)
- [x] Update landing page button to link to `public/index.html`
- [x] Create `.htaccess` for security and performance
- [x] Create `DEPLOYMENT.md` with full instructions

## Critical Decisions Needed

### WebSocket Server Requirement
The game uses WebSocket for multiplayer functionality. You must choose:

**Option A: Full Functionality (Multiplayer)**
- [ ] Deploy Node.js WebSocket server alongside Apache
- [ ] Configure Apache as reverse proxy
- [ ] Update `scripts/app.js` WebSocket URL to `/ws` endpoint
- [ ] Install PM2 for process management
- [ ] Configure firewall to allow WebSocket port

**Option B: Static Only (Single Player)**
- [ ] Modify `scripts/app.js` to remove WebSocket code
- [ ] Game will be single-player only
- [ ] No server-side dependencies needed

## Files to Upload to Apache

### Required Files:
```
/
├── index.html               ← Landing page
├── .htaccess               ← Security & performance
├── public/
│   └── index.html          ← Game (paths fixed)
├── assets/
│   ├── style.css
│   ├── css/
│   │   ├── menu.css
│   │   └── character-select.css
│   ├── images/
│   │   ├── techlogo-1.png
│   │   ├── neocitylogo-1.png
│   │   ├── neocitylogo-2.png
│   │   ├── backgrounds/
│   │   ├── characters/
│   │   └── scenes/
│   └── audio/
│       ├── menu.mp3
│       └── game.mp3
├── scripts/
│   ├── app.js
│   ├── menu.js
│   ├── character-select.js
│   ├── storyData.js
│   ├── dialogueSystem.js
│   ├── miniGames.js
│   └── interactionSystem.js
└── scenes/
```

### Optional (if using WebSocket):
```
├── server.js
├── package.json
└── package-lock.json
```

### DO NOT Upload:
```
node_modules/        ← Install on server instead
.git/                ← Source control
dev-landing.html     ← Old file (now renamed to index.html)
*.md files          ← Documentation (optional)
```

## Apache Server Setup

### 1. Upload Files
```bash
scp -r /workspaces/Neocity/* user@your-server:/var/www/html/neocity/
```

Or use FTP/SFTP client (FileZilla, WinSCP, etc.)

### 2. Set Permissions
```bash
ssh user@your-server
cd /var/www/html/neocity
chmod -R 755 .
chown -R www-data:www-data .
```

### 3. Test Landing Page
Visit: `https://your-domain.com/`
- [ ] Landing page loads
- [ ] Particles animation works
- [ ] "Launch App" button visible

### 4. Test Game Access
Click "Launch App" or visit: `https://your-domain.com/public/`
- [ ] Game page loads
- [ ] Menu displays with logo
- [ ] Particles visible
- [ ] CSS styles applied correctly

### 5. Test Game Assets
Open browser DevTools (F12) → Console
- [ ] No 404 errors for images
- [ ] No 404 errors for CSS files
- [ ] No 404 errors for JavaScript files
- [ ] Audio files load (check Network tab)

### 6. Test Game Functionality (Basic)
- [ ] Menu buttons respond
- [ ] Can navigate to character select
- [ ] Character cards display with images
- [ ] Character info shows on hover
- [ ] Can select character

### 7. WebSocket Testing (if Option A)
- [ ] No WebSocket connection errors in console
- [ ] Can see "Connected" message
- [ ] Multiplayer sync works

## Post-Deployment

### Performance
- [ ] Enable gzip compression (in Apache config or .htaccess)
- [ ] Set proper cache headers (already in .htaccess)
- [ ] Consider CDN for assets (optional)

### Security
- [ ] Install SSL certificate (Let's Encrypt)
- [ ] Force HTTPS redirect (uncomment in .htaccess)
- [ ] Verify sensitive files are blocked (.htaccess)
- [ ] Review Apache error logs

### Monitoring
- [ ] Set up error logging
- [ ] Monitor Apache access logs
- [ ] Monitor WebSocket server logs (if using)
- [ ] Set up uptime monitoring

## Common Issues & Fixes

### Issue: Assets not loading (404 errors)
**Fix:** 
- Check paths in `/public/index.html` all use `../`
- Verify file permissions (755 for directories, 644 for files)
- Check Apache DocumentRoot setting

### Issue: Blank page / no styles
**Fix:**
- Check browser console for errors
- Verify CSS files are accessible
- Check Apache error logs: `tail -f /var/log/apache2/error.log`

### Issue: WebSocket connection failed
**Fix:**
- If using Option A: Ensure Node.js server is running
- Check Apache proxy configuration
- Verify firewall allows WebSocket port
- If using Option B: Disable WebSocket code

### Issue: "Launch App" button doesn't work
**Fix:**
- Verify link in `index.html` points to `public/index.html`
- Check if `/public/` directory exists
- Try accessing directly: `https://your-domain.com/public/`

## Rollback Plan

If deployment fails:
1. Backup current files: `tar -czf neocity-backup.tar.gz /var/www/html/neocity/`
2. Remove files: `rm -rf /var/www/html/neocity/*`
3. Restore backup or redeploy from development

## Support

- Documentation: See `/DEPLOYMENT.md`
- Server logs: `/var/log/apache2/`
- Contact: support@jahandco.tech

---

**Last Updated:** $(date)
**Deployment Status:** Ready for production testing
