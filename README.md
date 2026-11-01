# Hello World: Frontend (React + nginx)

The frontend part of a small three-tier "Hello World" demo application. It is a
React app built into static files and served by nginx, and it shows a
"Hello World" message from the frontend.

## Repository structure

```
MCO-Assignment-FrontEnd/
├── README.md
└── hello-world/          
    ├── public/
    ├── src/
    │   └── App.js        
    ├── package.json
    ├── build/            
    ├── Dockerfile
    ├── default.conf
    └── .dockerignore
```

## Local frontend test on Windows (without containers)

These are the steps I followed to build the React frontend and serve it with nginx on my Windows machine, before containerizing it.

### Prerequisites
- Node.js and npm installed
- Command Prompt

### Steps I followed

1. **Created the React app**
   ```cmd
   npx create-react-app hello-world
   ```

2. **Moved into the project folder**
   ```cmd
   cd hello-world
   ```

3. **Updated `src/App.js` to display a Hello World message**
   ```jsx
   function App() {
      return (
         <div className="App">
            <header className="App-header">
            <h1>Hello World</h1>
   ```

4. **Created a build**
   ```cmd
   npm run build
   ```
   This creates a `build` folder with static files (HTML, JS, CSS).

5. **Downloaded nginx for Windows**
   Downloaded https://nginx.org/download/nginx-1.31.8.zip and extracted it to `C:\nginx-1.31.8`.

6. **Copied the React build into nginx**
   Copied everything inside the React `build` folder into `C:\nginx-1.31.8\html`.

7. **Updated the nginx configuration** in `C:\nginx-1.31.8\conf\nginx.conf`
   ```nginx
   server {
       listen       80;
       server_name  localhost;

       location /api/ {
           proxy_pass http://127.0.0.1:3000;   # forward API calls to the Fastify backend
       }

       location / {
           root   html;
           index  index.html;
           try_files $uri $uri/ /index.html;   # React single-page app fallback
       }
   }
   ```
   Requests to `/api/` are forwarded to the backend running locally on port 3000;
   everything else is served from the React build.

8. **Started nginx** from Command Prompt
   ```cmd
   cd C:\nginx-1.31.8
   start nginx
   ```

9. **Opened the app** at http://localhost and saw the Hello World message.
   With the backend also running locally (`node index.js` in the `fastify-api`
   folder), the backend and database messages loaded through the `/api/` proxy.

## Container test on Windows (Podman)

These are the steps I followed to run the frontend as a container with Podman,
with nginx forwarding `/api/` requests to the backend container.

### Prerequisites
- Podman installed, with a Podman machine running (`podman machine start`)
- PowerShell
- The backend container (`mco-backend-container`) running with `--network=host`
  (see the backend README)

### Steps I followed

1. **Created the `Dockerfile`** inside the `hello-world` folder
   ```dockerfile
   FROM node:24-alpine AS build
   WORKDIR /app
   COPY package*.json ./
   RUN npm install
   COPY . .
   RUN npm run build

   FROM nginxinc/nginx-unprivileged:alpine
   COPY --from=build /app/build /usr/share/nginx/html
   COPY default.conf /etc/nginx/conf.d/default.conf
   EXPOSE 8080
   CMD ["nginx", "-g", "daemon off;"]
   ```
   This is a two-stage build: the first stage builds the React app with Node, and
   the second stage copies only the `build` output into nginx. The final image is
   about 60 MB. `nginx-unprivileged` runs nginx as a non-root user on port 8080.

2. **Created `default.conf`** inside the `hello-world` folder
   ```nginx
   server {
       listen 8080;
       server_name localhost;

       root  /usr/share/nginx/html;
       index index.html;

       location /api/ {
           proxy_pass http://127.0.0.1:3000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       }

       location / {
           try_files $uri $uri/ /index.html;
       }
   }
   ```
   This replaces only the site config (`conf.d/default.conf`), not the main
   `nginx.conf`, so the image's non-root settings stay in place. Requests to
   `/api/` are forwarded to the Fastify backend on port 3000.

3. **Created the `.dockerignore`** inside the `hello-world` folder
   ```
   node_modules
   build
   .git
   Dockerfile
   .gitignore
   ```
   This keeps the local `node_modules` and `build` folders out of the image; the
   build runs fresh inside the container.

4. **Built the image**
   ```powershell
   podman build --network=host -t mco-frontend:latest .
   ```
   `--network=host` works around a Podman-on-WSL networking error (`nftables error`) during `npm install`.

5. **Checked the nginx configuration**
   ```powershell
   podman run --rm localhost/mco-frontend:latest nginx -t
   ```
   This prints `syntax is ok` and `test is successful`.

6. **Ran the container**
   ```powershell
   podman run -d --name mco-frontend-container --network=host localhost/mco-frontend:latest
   ```
   With `--network=host`, nginx and the backend share the same network, so
   `127.0.0.1:3000` in `default.conf` reaches the backend container.

7. **Checked that it started**
   ```powershell
   podman ps
   podman logs mco-frontend-container
   ```
   Both `mco-frontend-container` and `mco-backend-container` show as `Up`.

8. **Tested the API through nginx** from inside the Podman machine
   ```powershell
   podman machine ssh curl -s http://localhost:8080/api/hello
   podman machine ssh curl -s http://localhost:8080/api/db/hello
   ```
   Both return JSON from the backend, which confirms the nginx proxy works.

9. **Opened the app** at http://localhost:8080 and saw all three messages:
   - Hello World from the frontend (React)
   - Hello World from the backend API (Fastify)
   - Hello World from the database (SQLite)

   I also edited the message in the "Editable message" box and saved it. It is
   stored in SQLite and stays after a page refresh.

   ![alt text](image.png)