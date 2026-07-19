const { execSync } = require('child_process');
const { existsSync } = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const candidates = ['.output/public', 'dist'];
const dir = candidates.find((d) => existsSync(path.join(root, d, 'index.html')));

if (!dir) {
  console.error('No built site found. Run `nuxt generate` first.');
  process.exit(1);
}

execSync(`pagefind --site "${dir}"`, { stdio: 'inherit', cwd: root });
