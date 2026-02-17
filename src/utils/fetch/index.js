const fetchAsync = import('node-fetch');
const { waitFor } = require('../timeout');

// In seconds
const MAX_RETRY_TIMEOUT = 15;
// Step in seconds
const RETRY_STEP = 5;
// Maximum number of retries
const MAX_RETRIES = 5;

module.exports = { fetchWithRetry, fetch };

/**
 * Fetch with retry
 * @param url URL | RequestInfo
 * @param init Optional<RequestInit>
 * @returns {Promise<Response>}
 */
async function fetch(url, init) {
  const loadedFetch = (await fetchAsync).default;
  return loadedFetch(url, init);
}

function fetchWithRetry(...args) {
  return retry(0, ...args);
}

async function retry(retryCount = 0, ...args) {
  try {
    const result = await fetch(...args);

    if (!result.ok && result.status >= 500 && retryCount < MAX_RETRIES) {
      const timeout = Math.min(retryCount * RETRY_STEP, MAX_RETRY_TIMEOUT);
      console.error(`Request failed with status ${result.status}: ${result.statusText}`);
      console.error(`Retrying in ${timeout} seconds`);
      await waitFor(timeout * 1000);
      return retry(retryCount + 1, ...args);
    }

    return result;
  } catch (e) {
    if (retryCount >= MAX_RETRIES) {
      throw e;
    }

    const timeout = Math.min(retryCount * RETRY_STEP, MAX_RETRY_TIMEOUT);
    console.error(`Request failed : ${e.message}`);
    console.error(`Retrying in ${timeout} seconds`);
    await waitFor(timeout * 1000);
    const result = await retry(retryCount + 1, ...args);
    return result;
  }
}
