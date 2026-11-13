import links from './data/links.json';
import { nav } from './data/nav';
import profile from './data/profile.json';
import { timeline } from './data/timeline';

export default defineAppConfig({
  ...profile,
  nav,
  aboutNav: nav.filter((item) => item.onAbout),
  timeline,
  links,
});
