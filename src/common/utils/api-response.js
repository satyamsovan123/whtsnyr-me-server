function sendData(response, data, { status = 200, meta } = {}) {
  return response.status(status).json({
    data,
    ...(meta ? { meta } : {}),
  });
}

export { sendData };
