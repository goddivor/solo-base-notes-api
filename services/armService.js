import fetch from 'node-fetch';

const ARM_API_URL = 'https://arm.haglund.dev';

/**
 * Get IMDb ID from MyAnimeList ID using ARM API
 * @param {number} malId - MyAnimeList anime ID
 * @returns {Promise<string|null>} IMDb ID (e.g., 'tt1234567') or null if not found
 */
export const getImdbIdFromMal = async (malId) => {
  try {
    if (!malId) {
      throw new Error('MAL ID is required');
    }

    const url = `${ARM_API_URL}/api/v2/ids?source=myanimelist&id=${malId}`;

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.log(`No mapping found for MAL ID ${malId} in ARM`);
        return null;
      }
      throw new Error(`ARM API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // ARM API returns null if not found
    if (!data || !data.imdb) {
      console.log(`No IMDb ID available for MAL ID ${malId} in ARM`);
      return null;
    }

    return data.imdb;
  } catch (error) {
    console.error('Error fetching IMDb ID from ARM:', error);
    throw new Error(`Failed to get IMDb ID from ARM: ${error.message}`);
  }
};

/**
 * Get all available IDs for a MAL anime using ARM API
 * @param {number} malId - MyAnimeList anime ID
 * @returns {Promise<Object>} Object containing all platform IDs
 */
export const getAllIdsFromMal = async (malId) => {
  try {
    if (!malId) {
      throw new Error('MAL ID is required');
    }

    const url = `${ARM_API_URL}/api/v2/ids?source=myanimelist&id=${malId}`;

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.log(`No mapping found for MAL ID ${malId} in ARM`);
        return null;
      }
      throw new Error(`ARM API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching IDs from ARM:', error);
    throw new Error(`Failed to get IDs from ARM: ${error.message}`);
  }
};
