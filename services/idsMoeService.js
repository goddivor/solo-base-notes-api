import fetch from 'node-fetch';

const IDS_MOE_API_URL = 'https://api.ids.moe';

/**
 * Get IMDb ID from MyAnimeList ID using ids.moe API
 * @param {number} malId - MyAnimeList anime ID
 * @returns {Promise<string|null>} IMDb ID (e.g., 'tt1234567') or null if not found
 */
export const getImdbIdFromMal = async (malId) => {
  try {
    if (!malId) {
      throw new Error('MAL ID is required');
    }

    if (!process.env.IDS_MOE_API_KEY) {
      throw new Error('IDS_MOE_API_KEY is not configured');
    }

    const url = `${IDS_MOE_API_URL}/ids/${malId}?platform=mal`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${process.env.IDS_MOE_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.log(`No mapping found for MAL ID ${malId}`);
        return null;
      }
      throw new Error(`ids.moe API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.imdb) {
      console.log(`No IMDb ID available for MAL ID ${malId}`);
      return null;
    }

    return data.imdb;
  } catch (error) {
    console.error('Error fetching IMDb ID from ids.moe:', error);
    throw new Error(`Failed to get IMDb ID: ${error.message}`);
  }
};

/**
 * Get all available IDs for a MAL anime
 * @param {number} malId - MyAnimeList anime ID
 * @returns {Promise<Object>} Object containing all platform IDs
 */
export const getAllIdsFromMal = async (malId) => {
  try {
    if (!malId) {
      throw new Error('MAL ID is required');
    }

    if (!process.env.IDS_MOE_API_KEY) {
      throw new Error('IDS_MOE_API_KEY is not configured');
    }

    const url = `${IDS_MOE_API_URL}/ids/${malId}?platform=mal`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${process.env.IDS_MOE_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.log(`No mapping found for MAL ID ${malId}`);
        return null;
      }
      throw new Error(`ids.moe API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching IDs from ids.moe:', error);
    throw new Error(`Failed to get IDs: ${error.message}`);
  }
};
