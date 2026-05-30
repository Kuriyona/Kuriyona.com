import fs from 'node:fs/promises';
import path from 'node:path';
const filename = import.meta.filename as string;
const dirname = path.dirname(filename);

import config from '../app/config.json';

const tech = config.tech_stack.map((item) => {
  const url = `https://img.shields.io/badge/${encodeURIComponent(item.name)}-black?style=for-the-badge&logo=${item.icon}`;
  return `![${item.name}](${url})`;
});

const languages = config.languages.map((item) => {
  const url = `https://img.shields.io/badge/${item.icon}-${item.text}-black?style=for-the-badge`;
  return `![${item.text}](${url})`;
});

const contact = [
  ...config.contact
    .filter((item) => item.name !== 'e-Mail')
    .map((item) => {
      const url = `https://img.shields.io/badge/${item.name}-black?style=for-the-badge&logo=${item.icon}`;
      return `[![${item.name}](${url})](${item.link})`;
    }),
];

const readme = `
<a href="https://kuriyona.com" target="_blank">
  <img src="./public/intro.svg" alt="I'm Kuriyona" />
</a>

---

Kuriyona read as Japanese \`クリヨナ\`.

You can just call me Kuriyona or 未晞(Weixi).

### Tech Stack
${tech.join(' ')}

### Languages
${languages.join(' ')}

### Contact
${contact.join(' ')}
`;

await fs.writeFile(path.join(dirname, '../README.md'), readme);
console.log('README.md generated');
