// Wrapper that handles both async and sync handlers.
// No requirement to mark the handler with `async` — Promise.resolve will
// handle returned promises from either async functions or plain values.
const asyncHandler = (requestHandler) => {
  return (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err));
  };
};

export default asyncHandler;