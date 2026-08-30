export const prerender = true;
export const ssr = false;
// Without this, adapter-static's default 'ignore' mode lets '/references' and
// '/references/' coexist inconsistently in the build output: a route that has
// child routes (e.g. /references/new) gets both a `references.html` file AND a
// `references/` directory (to hold the children), but never a
// `references/index.html` — so nginx 403s on a hard refresh of the bare,
// trailing-slash URL. 'always' makes every prerendered route resolve to its
// own `<route>/index.html`, eliminating the collision.
export const trailingSlash = 'always';
