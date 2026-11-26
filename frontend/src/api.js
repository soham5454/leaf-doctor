import { mockResponse, mockUncertainResponse } from './mockData.js';

const DEFAULT_ERROR_MESSAGE = 'Something went wrong. Please try again.';
const NETWORK_ERROR_MESSAGE =
  "Can't reach the server. Please check your connection and try again.";

/**
 * Predicts plant disease from an uploaded leaf image file.
 * Uses mock data when VITE_USE_MOCK is "true"; otherwise posts to the backend API.
 * @param {File} file
 * @returns {Promise<object>}
 */
export async function predictDisease(file) {
  if (import.meta.env.VITE_USE_MOCK === 'true') {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    return import.meta.env.VITE_MOCK_STATUS === 'uncertain'
      ? mockUncertainResponse
      : mockResponse;
  }

  const formData = new FormData();
  formData.append('image', file);

  let response;
  try {
    response = await fetch(`${import.meta.env.VITE_API_URL}/predict`, {
      method: 'POST',
      body: formData,
    });
  } catch {
    throw new Error(NETWORK_ERROR_MESSAGE);
  }

  if (!response.ok) {
    let errorMessage = DEFAULT_ERROR_MESSAGE;
    try {
      const data = await response.json();
      if (data?.error) {
        errorMessage = data.error;
      }
    } catch {
      // Fall back to default error message when response body is not valid JSON
    }
    throw new Error(errorMessage);
  }

  return response.json();
}
