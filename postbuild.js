import fs from 'fs';
import path from 'path';

// Clean copy utility
function copyDirRecursive(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

try {
  // 1. Copy dist/index.html to root /index.html
  console.log('[Postbuild] Copying dist/index.html to root index.html...');
  if (fs.existsSync('dist/index.html')) {
    fs.copyFileSync('dist/index.html', 'index.html');
    console.log('[Postbuild] Successfully copied index.html to root!');
  } else {
    console.error('[Postbuild] dist/index.html not found!');
  }

  // 2. Copy dist/assets/ to root /assets/
  console.log('[Postbuild] Copying dist/assets/ to root assets/ to support GitHub Pages...');
  if (fs.existsSync('dist/assets')) {
    copyDirRecursive('dist/assets', 'assets');
    console.log('[Postbuild] Successfully copied assets to root!');
  } else {
    console.log('[Postbuild] dist/assets/ directory not found or empty.');
  }

  console.log('[Postbuild] Completed successfully!');
} catch (err) {
  console.error('[Postbuild] Error running postbuild process:', err);
  process.exit(1);
}
