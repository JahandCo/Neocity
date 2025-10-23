# Neocity

A web-based interactive narrative game.

## Running the Application

There are several ways to run this application, depending on your environment.

### 1. Using Node.js (Recommended for local development)

This is the simplest method for local development as it runs the included server which handles both static files and WebSocket connections.

**A. Install Dependencies:**
```bash
npm install
```

**B. Start the Server:**
```bash
npm start
```
The application will be available at [http://localhost:8080](http://localhost:8080).

To run on a different port:
```bash
PORT=3000 npm start
```

### 2. Using `http-server` and the Node.js WebSocket Server

If you prefer to use `http-server` for serving static files, you can run it alongside the Node.js server which will only handle WebSocket connections.

**A. Install `http-server`:**
```bash
npm install -g http-server
```

**B. Start the WebSocket Server:**
In one terminal, start the Node.js server. Let's run it on port 8081 to avoid conflicts.
```bash
PORT=8081 npm start
```

**C. Start `http-server`:**
In another terminal, serve the project files.
```bash
http-server -p 8080
```

The application will be available at [http://localhost:8080](http://localhost:8080). The client will connect to the WebSocket server running on port 8081. *Correction: The client will attempt to connect to a WebSocket on the same host and port as the http-server, so this method requires a reverse proxy.*

**Note:** This method requires a reverse proxy (such as Nginx or Apache) to route WebSocket traffic from `http-server` to the Node.js WebSocket server. See the configurations below.

### 3. Using Apache or Nginx

For a production environment, it's best to use a robust web server like Apache or Nginx. These servers will serve the static files and proxy WebSocket requests to the Node.js server.

**A. Start the Node.js WebSocket Server:**
Run the Node.js server on a port that is not exposed to the public, for example, `8081`.
```bash
PORT=8081 npm start
```

**B. Configure Your Web Server:**

**Nginx Configuration:**

Add the following `location` block to your Nginx server configuration. This tells Nginx to serve the static files from your project directory and to upgrade the connection to a WebSocket for requests to the `/` path when required by the client.

```nginx
server {
    listen 80;
    server_name your_domain.com;

    root /path/to/your/Neocity/project;
    index index.html;

    location / {
        try_files $uri $uri/ =404;
    }

    # Proxy WebSocket connections to the Node.js server
    location /socket.io/ { # This path might need to be adjusted based on client connection
        proxy_pass http://localhost:8081;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
    }
}
```
*Note: The client-side code does not use `/socket.io/`. The current implementation attempts to establish a WebSocket connection on the main path. A better Nginx configuration for this setup is:*
```nginx
server {
    listen 80;
    server_name your_domain.com;

    root /path/to/your/Neocity/project;
    index index.html;

    location / {
        # Handle WebSocket upgrade requests
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;

        # If the request is a WebSocket upgrade, proxy to Node.js server
        if ($http_upgrade = "websocket") {
            proxy_pass http://localhost:8081;
            proxy_http_version 1.1;
            break;
        }

        # Otherwise, serve static files or fallback to index.html
        try_files $uri $uri/ /index.html;
    }
}
```

**Apache Configuration:**

Ensure `mod_proxy` and `mod_proxy_wstunnel` are enabled. Add the following to your Apache configuration:

```apache
<VirtualHost *:80>
    ServerName your_domain.com
    DocumentRoot "/path/to/your/Neocity/project"

    <Directory "/path/to/your/Neocity/project">
        AllowOverride All
        Require all granted
    </Directory>

    # Proxy WebSocket connections
    ProxyRequests off
    ProxyPass "/" "http://localhost:8081/"
    ProxyPassReverse "/" "http://localhost:8081/"

    RewriteEngine on
    RewriteCond %{HTTP:Upgrade} websocket [NC]
    RewriteCond %{HTTP:Connection} upgrade [NC]
    RewriteRule ^/?(.*) "ws://localhost:8081/$1" [P,L]
</VirtualHost>
```
After configuring your web server, you can access the application at `http://your_domain.com`.
