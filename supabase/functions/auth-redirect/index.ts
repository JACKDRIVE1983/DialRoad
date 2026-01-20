import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

serve(async (req) => {
  const url = new URL(req.url);
  const params = url.searchParams;
  
  // Get all the auth parameters from the request URL
  const token = params.get('token') || '';
  const type = params.get('type') || '';

  // Detect if the request is from a mobile device
  const userAgent = req.headers.get('user-agent') || '';
  const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(userAgent);

  // Build the deep link + web fallback URLs
  const appScheme = 'dialroad://';
  const webBase = 'https://id-preview--06f106cb-9fa2-4cec-abad-afaaa638c89c.lovable.app';

  // We forward token + type to both app and web so the client can verify the recovery token
  const appTarget = `${appScheme}auth?reset=true&token=${encodeURIComponent(token)}&type=${encodeURIComponent(type)}`;
  const webTarget = `${webBase}/auth?reset=true&token=${encodeURIComponent(token)}&type=${encodeURIComponent(type)}`;
  
  // Create the redirect page HTML
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DialRoad - Redirect</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      background: linear-gradient(135deg, #e0f2fe 0%, #ffffff 50%, #ecfeff 100%);
      text-align: center;
      padding: 20px;
    }
    .container {
      background: white;
      padding: 40px;
      border-radius: 20px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.1);
      max-width: 400px;
    }
    h1 {
      color: #0891b2;
      margin-bottom: 10px;
    }
    p {
      color: #64748b;
      margin-bottom: 20px;
    }
    .btn {
      display: inline-block;
      background: linear-gradient(135deg, #0891b2, #06b6d4);
      color: white;
      padding: 15px 30px;
      border-radius: 12px;
      text-decoration: none;
      font-weight: 600;
      margin: 10px;
      transition: transform 0.2s;
    }
    .btn:hover {
      transform: scale(1.05);
    }
    .btn-secondary {
      background: #f1f5f9;
      color: #475569;
    }
    .loader {
      width: 40px;
      height: 40px;
      border: 4px solid #e2e8f0;
      border-top-color: #0891b2;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 20px auto;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>DialRoad</h1>
    <p id="message">Apertura dell'app in corso...</p>
    <div class="loader" id="loader"></div>
    <div id="buttons" style="display: none;">
      <a href="${appTarget}" class="btn">Apri nell'App</a>
      <br>
      <a href="${webTarget}" class="btn btn-secondary">Continua nel Browser</a>
    </div>
  </div>
  
  <script>
    const isMobile = ${isMobile};
    const appScheme = ${JSON.stringify(appTarget)};
    const webUrl = ${JSON.stringify(webTarget)};
    
    if (isMobile) {
      // Try to open the app
      const start = Date.now();
      
      // Create invisible iframe to try opening the app
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = appScheme;
      document.body.appendChild(iframe);
      
      // Also try window.location for some devices
      setTimeout(() => {
        window.location.href = appScheme;
      }, 100);
      
      // If we're still here after 2 seconds, show buttons
      setTimeout(() => {
        if (Date.now() - start < 3000) {
          document.getElementById('loader').style.display = 'none';
          document.getElementById('message').textContent = 'Se l\\'app non si è aperta, scegli un\\'opzione:';
          document.getElementById('buttons').style.display = 'block';
        }
      }, 2000);
      
      // Fallback to web after 3 seconds if app didn't open
      setTimeout(() => {
        document.getElementById('loader').style.display = 'none';
        document.getElementById('message').textContent = 'Se l\\'app non si è aperta, scegli un\\'opzione:';
        document.getElementById('buttons').style.display = 'block';
      }, 3000);
    } else {
      // Desktop - redirect to web immediately
      window.location.href = webUrl;
    }
  </script>
</body>
</html>
  `;

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  });
});
