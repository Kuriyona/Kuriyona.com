import fs from 'node:fs/promises';
import path from 'node:path';
const filename = import.meta.filename as string;
const dirname = path.dirname(filename);

import config from '../app/config.json';

const getURL = (name: string, icon?: string, style = 'for-the-badge') => {
  return `https://img.shields.io/badge/${encodeURIComponent(name)}-black?style=${style}&logo=${icon || ''}`;
};

const tech = config.tech_stack.map((item) => {
  return `![${item.name}](${getURL(item.name, item.icon)})`;
});

const languages = config.languages.map((item) => {
  const url = getURL(`${item.icon}-${item.text}`, item.icon);
  return `![${item.text}](${url})`;
});

const contact = [
  ...config.contact
    .filter((item) => item.name !== 'e-Mail')
    .map((item) => {
      const url = getURL(item.name, item.icon);
      return `[![${item.name}](${url})](${item.link})`;
    }),
];

const devices = [
  ...config.device.map((item) => {
    const url = getURL(item.label, item.icon);
    const children = item.children
      ?.map((child) => {
        const url = getURL(child.label, child.icon, 'flat');
        return `![${child.label}](${url})`;
      })
      .join(' ');
    if (item.children) {
      return `![${item.label}](${url})\n${children}`;
    }
    return `![${item.label}](${url})`;
  }),
];

const readme = `
<a href="https://kuriyona.com" target="_blank">
  <img src="https://r2.kuriyona.com/static/intro/intro.png" alt="I'm Kuriyona" />
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

### Devices
${devices.join('\n\n')}
`;

await fs.writeFile(path.join(dirname, '../README.md'), readme);
console.log('README.md generated');
