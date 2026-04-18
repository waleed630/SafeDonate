export function getFrontendUrl(req) {
  if (process.env.FRONTEND_URL) {
    return process.env.FRONTEND_URL;
  }

  if (req?.headers?.origin) {
    return req.headers.origin;
  }

  return 'http://localhost:5173';
}
