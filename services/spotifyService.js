import axios from 'axios';

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID?.trim();
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET?.trim();

let cachedAccessToken = null;
let tokenExpirationTime = null;

/**
 * Get Spotify access token using Client Credentials flow
 */
const getAccessToken = async () => {
  // Validate credentials
  if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
    throw new Error('Spotify credentials are not configured. Please set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET in .env file');
  }

  // Return cached token if still valid
  if (cachedAccessToken && tokenExpirationTime && Date.now() < tokenExpirationTime) {
    return cachedAccessToken;
  }

  try {
    const credentials = Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64');

    console.log('Attempting Spotify authentication...');

    const response = await axios.post(
      'https://accounts.spotify.com/api/token',
      'grant_type=client_credentials',
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${credentials}`
        }
      }
    );

    console.log('Spotify authentication successful');
    cachedAccessToken = response.data.access_token;
    // Set expiration time (expires_in is in seconds, we add a 5 minute buffer)
    tokenExpirationTime = Date.now() + (response.data.expires_in - 300) * 1000;

    return cachedAccessToken;
  } catch (error) {
    console.error('Error getting Spotify access token:', error.response?.data || error.message);
    console.error('Status:', error.response?.status);
    console.error('Full error:', error);
    throw new Error('Failed to authenticate with Spotify');
  }
};

/**
 * Search for tracks on Spotify
 * @param {string} query - Search query
 * @param {number} limit - Number of results (default 10, max 50)
 */
const searchTracks = async (query, limit = 10) => {
  if (!query || query.trim().length === 0) {
    throw new Error('Search query is required');
  }

  try {
    const accessToken = await getAccessToken();

    const response = await axios.get('https://api.spotify.com/v1/search', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      },
      params: {
        q: query,
        type: 'track',
        limit: Math.min(limit, 50)
      }
    });

    const tracks = response.data.tracks.items.map((track) => ({
      id: track.id,
      name: track.name,
      artists: track.artists.map((artist) => ({
        id: artist.id,
        name: artist.name
      })),
      album: {
        id: track.album.id,
        name: track.album.name,
        image: track.album.images[0]?.url || null
      },
      duration: track.duration_ms,
      previewUrl: track.preview_url,
      spotifyUrl: track.external_urls.spotify,
      uri: track.uri
    }));

    return tracks;
  } catch (error) {
    console.error('Error searching Spotify tracks:', error.response?.data || error.message);
    console.error('Full error object:', error);
    console.error('Error stack:', error.stack);
    throw new Error('Failed to search tracks on Spotify');
  }
};

/**
 * Get a specific track by ID
 * @param {string} trackId - Spotify track ID
 */
const getTrack = async (trackId) => {
  if (!trackId) {
    throw new Error('Track ID is required');
  }

  try {
    const accessToken = await getAccessToken();

    const response = await axios.get(`https://api.spotify.com/v1/tracks/${trackId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    const track = response.data;

    return {
      id: track.id,
      name: track.name,
      artists: track.artists.map((artist) => ({
        id: artist.id,
        name: artist.name
      })),
      album: {
        id: track.album.id,
        name: track.album.name,
        image: track.album.images[0]?.url || null
      },
      duration: track.duration_ms,
      previewUrl: track.preview_url,
      spotifyUrl: track.external_urls.spotify,
      uri: track.uri
    };
  } catch (error) {
    console.error('Error getting Spotify track:', error.response?.data || error.message);
    throw new Error('Failed to get track from Spotify');
  }
};

export { searchTracks, getTrack };
