$env:HOME = $env:USERPROFILE
Write-Host "Setting HOME to $env:HOME"
npm run test:e2e:visual
