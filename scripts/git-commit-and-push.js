const cp = require('child_process');

try {
  console.log('[GIT] Staging files...');
  cp.execSync('git add .', { stdio: 'inherit' });

  console.log('[GIT] Committing changes...');
  cp.execSync('git commit -m "fix(ci): use buildx and build-push-action to resolve MCR 403 errors"', { stdio: 'inherit' });
  
  console.log('[GIT] Pushing to main...');
  cp.execSync('git push origin main', { stdio: 'inherit' });
  
  console.log('[GIT] Successfully committed and pushed to main!');
} catch (err) {
  console.error('[GIT] Error during execution:', err.message);
  process.exit(1);
}
