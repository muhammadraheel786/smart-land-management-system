# Deploy Backend to Render

Write-Host "============================================="
Write-Host " 🚀 Switch backend server to Render.com 🚀   "
Write-Host "============================================="
Write-Host ""
Write-Host "Since Render requires a GitHub repository connection for their Free Tier,"
Write-Host "we need to push your local code to your GitHub repo first."
Write-Host ""
Write-Host "1) Pushing latest code to GitHub..."
git add .
git commit -m "Configure rendering for Render.com"
git push origin main

Write-Host "2) Opening Render Deployment Page..."
Write-Host "To finish deploying the server, your browser will now open to Render's Deploy page."
Write-Host "Render will automatically configure the server using the blueprint file (render.yaml)."
Write-Host "It will ask you to enter the environment variables for your database."
Write-Host ""
Write-Host "Please have these values ready from your backend/.env file:"
Write-Host "- MONGO_URI"
Write-Host "- ADMIN_EMAIL"
Write-Host "- ADMIN_PASSWORD"
Write-Host ""

Start-Sleep -Seconds 3

# We will grab the github repo URL and pop open the browser to the deploy hook
$repo = git remote get-url origin
if ($repo -match "https://github.com/(.*)\.git") {
    $repo = "https://github.com/" + $matches[1]
}

if ($repo) {
    Start-Process "https://render.com/deploy?repo=$repo"
} else {
    Write-Host "Could not detect GitHub repository. Go to: https://dashboard.render.com"
}

Write-Host ""
Write-Host "Once Render gives you a URL (e.g., https://land-management-api.onrender.com),"
Write-Host "the frontend has already been configured to automatically connect to it!"
Write-Host "(See src/config/api.ts)"
