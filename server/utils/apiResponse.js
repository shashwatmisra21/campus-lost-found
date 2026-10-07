function ok(res, data = {}, status = 200) {
  return res.status(status).json({ success: true, ...data });
}

function fail(res, message, status = 400, extras = {}) {
  return res.status(status).json({ success: false, message, ...extras });
}

module.exports = { ok, fail };
