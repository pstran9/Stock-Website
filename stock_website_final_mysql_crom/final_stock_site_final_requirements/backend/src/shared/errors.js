export function notFound(req, res) {
  res.status(404).json({ error: "Not found" });
}

export function errorHandler(err, req, res, next) {
  // Avoid leaking internals
  console.error("[error]", err);
  const status = err.statusCode || 500;
  const message = status >= 500 ? "Server error" : (err.message || "Error");
  res.status(status).json({ error: message });
}
