#!/usr/bin/env node
import http from 'node:http';

const host = process.env.HOST || '127.0.0.1';
const port = Number(process.env.PORT || 3100);

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${host}:${port}`);

  if (url.pathname === '/health') {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ ok: true, service: 'stub' }));
    return;
  }

  if (url.pathname === '/functions/v1/create-checkout-session') {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ url: 'https://checkout.stripe.com/pay/test_' + Math.random().toString(36).slice(2) }));
    return;
  }

  if (url.pathname === '/functions/v1/check-subscription') {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ active: true, expires_at: '2026-12-31' }));
    return;
  }

  if (url.pathname === '/functions/v1/get-book-file') {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ url: 'https://signed-url-test.example.com/book-' + Math.random().toString(36).slice(2) + '.pdf', title: 'Test Book', expiresIn: 300 }));
    return;
  }

  if (url.pathname === '/functions/v1/get-book-content') {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ content: 'Chapter content here', chapter_number: 1, title: 'Chapter 1' }));
    return;
  }

  if (url.pathname === '/functions/v1/stripe-webhook') {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ ok: true, received: true }));
    return;
  }

  if (url.pathname.startsWith('/api/social/')) {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ ok: true, route: url.pathname }));
    return;
  }

  res.writeHead(404, { 'content-type': 'application/json' });
  res.end(JSON.stringify({ error: 'not-found' }));
});

server.listen(port, host, () => {
  console.log(`stub-server-ready on http://${host}:${port}`);
});
