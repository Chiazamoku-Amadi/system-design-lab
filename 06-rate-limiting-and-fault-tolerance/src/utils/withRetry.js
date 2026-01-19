export const withRetry = async (
  fn,
  { retries = 3, baseDelay = 300, shouldRetry = () => true } = {}
) => {
  let attempt = 0;

  while (attempt < retries) {
    try {
      return await fn();
    } catch (error) {
      attempt++;

      if (attempt >= retries || !shouldRetry(error)) {
        throw error;
      }

      const delay = baseDelay * Math.pow(2, attempt); // Exponential Backoff
      await new Promise((res) => setTimeout(res, delay));
    }
  }
};
