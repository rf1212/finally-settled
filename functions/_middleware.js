// Cloudflare Pages middleware: redirect homes.finallysettled.com root to /homes/
export async function onRequest(context) {
  const url = new URL(context.request.url);
  if (url.pathname === '/qualify.html') {
    return Response.redirect(new URL('/apply', url.origin).toString(), 301);
  }
  if (url.hostname === 'homes.finallysettled.com' && url.pathname === '/') {
    return Response.redirect(url.origin + '/homes/', 301);
  }
  return context.next();
}
