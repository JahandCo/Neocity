# Neocity - Apache Production Deployment Guide

## ⚠️ CRITICAL REQUIREMENTS

### WebSocket Server Required
This application **REQUIRES** a WebSocket server to function properly for multiplayer features. Apache is a static web server and **does not support WebSocket connections** on its own.

## Deployment Options

### Option 1: Apache + Node.js WebSocket Server (Recommended)

1. **Upload all files to your Apache web directory:**
   ```bash
   /var/www/html/neocity/
   ├── index.html (landing page)
   ├── public/
   │   └── index.html (game)
   ├── assets/
   ├── scripts/
   ├── scenes/
   └── server.js
   ```

2. **Install Node.js on your server:**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

3. **Install dependencies:**
   ```bash
   cd /var/www/html/neocity
   npm install
   ```

4. **Run the WebSocket server (using PM2 for production):**
   ```bash
   sudo npm install -g pm2
   pm2 start server.js --name neocity-ws
   pm2 save
   pm2 startup
   ```

5. **Configure Apache as reverse proxy for WebSocket:**
   
   Enable required modules:
   ```bash
   sudo a2enmod proxy
   sudo a2enmod proxy_http
   sudo a2enmod proxy_wstunnel
   sudo systemctl restart apache2
   ```

   Add to your Apache VirtualHost configuration:
   ```apache
   <VirtualHost *:80>
       ServerName your-domain.com
       DocumentRoot /var/www/html/neocity

       # Proxy WebSocket connections to Node.js
       ProxyPass /ws ws://localhost:8080/
       ProxyPassReverse /ws ws://localhost:8080/

       # Serve static files directly
       <Directory /var/www/html/neocity>
           Options -Indexes +FollowSymLinks
           AllowOverride All
           Require all granted
       </Directory>

       ErrorLog ${APACHE_LOG_DIR}/neocity_error.log
       CustomLog ${APACHE_LOG_DIR}/neocity_access.log combined
   </VirtualHost>
   ```

6. **Update WebSocket URL in scripts/app.js:**
   
   Change line ~432 from:
   ```javascript
   const wsUrl = `${wsProtocol}//${window.location.host}`;
   ```
   
   To:
   ```javascript
   const wsUrl = `${wsProtocol}//${window.location.host}/ws`;
   ```

### Option 2: Static Files Only (Single Player Mode)

If you want to deploy without WebSocket (single-player only):

1. **Upload files to Apache:**
   ```bash
   /var/www/html/neocity/
   ├── index.html
   ├── public/
   ├── assets/
   ├── scripts/
   └── scenes/
   ```

2. **Modify scripts/app.js to disable multiplayer:**
   
   Comment out or remove the WebSocket connection code (lines ~428-450) and replace with:
   ```javascript
   async function connectToServer() {
       await preloadAssets();
       
       // Initialize story systems
       dialogueSystem = new DialogueSystem(canvas, ctx, synthyaStory);
       miniGameSystem = new MiniGameSystem(canvas, ctx);
       interactionSystem = new InteractionSystem(canvas, ctx);
       
       // ... (keep the rest of the initialization)
       
       // Skip WebSocket connection
       console.log('[Client] Running in single-player mode');
       gameLoop();
       return Promise.resolve();
   }
   ```

## File Structure Verification

Current structure is production-ready with correct relative paths:
- Landing page: `/index.html` → Accessible at `https://your-domain.com/`
- Game: `/public/index.html` → Accessible at `https://your-domain.com/public/`
- All asset paths in game use `../assets/`, `../scripts/` to reference root directories

## Testing Checklist

- [ ] Landing page loads at root URL
- [ ] "Launch App" button opens game correctly
- [ ] Game assets (images, CSS, audio) load properly
- [ ] WebSocket connection establishes (if using Option 1)
- [ ] Character selection works
- [ ] Game renders correctly
- [ ] Story dialogue system functions
- [ ] Mini-games load

## Security Recommendations

1. **Add .htaccess for security:**
   ```apache
   # Disable directory listing
   Options -Indexes

   # Protect sensitive files
   <FilesMatch "(package\.json|server\.js|\.git)">
       Order allow,deny
       Deny from all
   </FilesMatch>
   ```

2. **Enable HTTPS:**
   ```bash
   sudo apt install certbot python3-certbot-apache
   sudo certbot --apache -d your-domain.com
   ```

3. **Configure CORS if needed** (in server.js for WebSocket server)

## Troubleshooting

### Assets not loading
- Check browser console for 404 errors
- Verify all paths use `../` prefix in `/public/index.html`
- Ensure Apache has read permissions: `chmod -R 755 /var/www/html/neocity`

### WebSocket connection fails
- Verify Node.js server is running: `pm2 status`
- Check Apache proxy configuration
- Review Apache error logs: `tail -f /var/log/apache2/neocity_error.log`
- Ensure firewall allows port 8080

### Game doesn't start
- Open browser DevTools Console
- Check for JavaScript errors
- Verify all script files loaded successfully

## Contact

For issues or questions, contact: support@jahandco.tech
