# Hello World: Frontend (React + nginx)

The frontend part of a small three-tier "Hello World" demo application. It is a
React app built into static files and served by nginx, and it shows a
"Hello World" message from the frontend.

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

       location / {
           root   html;
           index  index.html;
           try_files $uri $uri/ /index.html;   # React single-page app fallback
       }
   }
   ```

8. **Started nginx** from Command Prompt
   ```cmd
   cd C:\nginx-1.31.8
   start nginx
   ```

9. **Opened the app** at http://localhost and saw the Hello World message.
