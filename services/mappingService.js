import * as armService from './armService.js';
import * as idsMoeService from './idsMoeService.js';

/**
 * Get IMDb ID from MAL ID using the specified mapping service
 * @param {number} malId - MyAnimeList anime ID
 * @param {string} service - Mapping service to use ('arm' or 'idsmoe')
 * @returns {Promise<string|null>} IMDb ID or null if not found
 */
export const getImdbIdFromMal = async (malId, service = 'arm') => {
  try {
    if (service === 'idsmoe') {
      return await idsMoeService.getImdbIdFromMal(malId);
    }

    // Default to ARM service
    return await armService.getImdbIdFromMal(malId);
  } catch (error) {
    console.error(`Error with ${service} service, trying fallback...`, error);

    // Try fallback service
    try {
      if (service === 'arm') {
        console.log('Trying ids.moe as fallback...');
        return await idsMoeService.getImdbIdFromMal(malId);
      } else {
        console.log('Trying ARM as fallback...');
        return await armService.getImdbIdFromMal(malId);
      }
    } catch (fallbackError) {
      console.error('Fallback service also failed:', fallbackError);
      throw new Error(`Failed to get IMDb ID with both services: ${error.message}`);
    }
  }
};

/**
 * Get all IDs from MAL ID using the specified mapping service
 * @param {number} malId - MyAnimeList anime ID
 * @param {string} service - Mapping service to use ('arm' or 'idsmoe')
 * @returns {Promise<Object>} Object containing all platform IDs
 */
export const getAllIdsFromMal = async (malId, service = 'arm') => {
  try {
    if (service === 'idsmoe') {
      return await idsMoeService.getAllIdsFromMal(malId);
    }

    // Default to ARM service
    return await armService.getAllIdsFromMal(malId);
  } catch (error) {
    console.error(`Error with ${service} service:`, error);
    throw error;
  }
};
