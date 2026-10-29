// Mirrors migration/original/_quarto.yml
//   website.title          -> title
//   website.navbar.left    -> nav (index.qmd => Home, cv.qmd => CV)
//   website.search: false  -> no search UI is built
export const site = {
  title: 'Maharrem Ayar',
  nav: [
    { key: 'home', href: '/', text: 'Home' },
    { key: 'cv', href: '/cv', text: 'CV' },
  ],
};
