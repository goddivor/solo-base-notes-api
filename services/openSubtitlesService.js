import fetch from 'node-fetch';

const OPENSUBTITLES_API_URL = 'https://api.opensubtitles.com/api/v1';

let authToken = null;
let tokenExpiry = null;

/**
 * Login to OpenSubtitles API and get authentication token
 * @returns {Promise<string>} Authentication token
 */
const login = async () => {
  try {
    if (!process.env.OPENSUBTITLES_API_KEY) {
      throw new Error('OPENSUBTITLES_API_KEY is not configured');
    }

    if (!process.env.OPENSUBTITLES_USERAGENT) {
      throw new Error('OPENSUBTITLES_USERAGENT is not configured');
    }

    if (!process.env.OPENSUBTITLES_USERNAME) {
      throw new Error('OPENSUBTITLES_USERNAME is not configured');
    }

    if (!process.env.OPENSUBTITLES_PASSWORD) {
      throw new Error('OPENSUBTITLES_PASSWORD is not configured');
    }

    // Check if token is still valid
    if (authToken && tokenExpiry && Date.now() < tokenExpiry) {
      return authToken;
    }

    const response = await fetch(`${OPENSUBTITLES_API_URL}/login`, {
      method: 'POST',
      headers: {
        'Api-Key': process.env.OPENSUBTITLES_API_KEY,
        'User-Agent': process.env.OPENSUBTITLES_USERAGENT,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: process.env.OPENSUBTITLES_USERNAME,
        password: process.env.OPENSUBTITLES_PASSWORD,
      }),
    });

    if (!response.ok) {
      throw new Error(`Login failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    authToken = data.token;
    // Token valid for 24 hours, we'll refresh after 23 hours to be safe
    tokenExpiry = Date.now() + (23 * 60 * 60 * 1000);

    return authToken;
  } catch (error) {
    console.error('Error logging in to OpenSubtitles:', error);
    throw new Error(`Failed to login: ${error.message}`);
  }
};

/**
 * Search for subtitles by IMDb ID, season, and episode
 * @param {string} imdbId - IMDb ID (e.g., 'tt1234567')
 * @param {number|null} season - Season number (null for movies)
 * @param {number} episode - Episode number
 * @param {string[]} languages - Array of language codes (e.g., ['en', 'fr'])
 * @returns {Promise<Array>} Array of subtitle results
 */
export const searchSubtitles = async (imdbId, season, episode, languages = ['en', 'fr']) => {
  try {
    if (!imdbId) {
      throw new Error('IMDb ID is required');
    }

    const token = await login();

    // Build query parameters
    const params = new URLSearchParams({
      imdb_id: imdbId.replace('tt', ''), // Remove 'tt' prefix
      languages: languages.join(','),
    });

    if (episode) {
      params.append('episode_number', episode.toString());
    }

    if (season) {
      params.append('season_number', season.toString());
    }

    const url = `${OPENSUBTITLES_API_URL}/subtitles?${params.toString()}`;

    const response = await fetch(url, {
      headers: {
        'Api-Key': process.env.OPENSUBTITLES_API_KEY,
        'Authorization': `Bearer ${token}`,
        'User-Agent': process.env.OPENSUBTITLES_USERAGENT,
      },
    });

    if (!response.ok) {
      throw new Error(`Search failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.data || data.data.length === 0) {
      return [];
    }

    // Format results
    return data.data.map((sub) => ({
      fileId: sub.attributes.files[0]?.file_id || null,
      fileName: sub.attributes.files[0]?.file_name || '',
      language: sub.attributes.language,
      downloadCount: sub.attributes.download_count || 0,
      rating: sub.attributes.ratings || 0,
      release: sub.attributes.release || '',
      uploader: sub.attributes.uploader?.name || 'Unknown',
    })).filter(sub => sub.fileId !== null);
  } catch (error) {
    console.error('Error searching subtitles:', error);
    throw new Error(`Failed to search subtitles: ${error.message}`);
  }
};

/**
 * Download subtitle file
 * @param {string} fileId - File ID from search results
 * @returns {Promise<string>} Subtitle file content
 */
export const downloadSubtitle = async (fileId) => {
  try {
    if (!fileId) {
      throw new Error('File ID is required');
    }

    const token = await login();

    const response = await fetch(`${OPENSUBTITLES_API_URL}/download`, {
      method: 'POST',
      headers: {
        'Api-Key': process.env.OPENSUBTITLES_API_KEY,
        'Authorization': `Bearer ${token}`,
        'User-Agent': process.env.OPENSUBTITLES_USERAGENT,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        file_id: parseInt(fileId),
      }),
    });

    if (!response.ok) {
      throw new Error(`Download failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.link) {
      throw new Error('No download link provided');
    }

    // Download the actual subtitle file
    const fileResponse = await fetch(data.link);

    if (!fileResponse.ok) {
      throw new Error(`File download failed: ${fileResponse.status}`);
    }

    const content = await fileResponse.text();
    return content;
  } catch (error) {
    console.error('Error downloading subtitle:', error);
    throw new Error(`Failed to download subtitle: ${error.message}`);
  }
};

/**
 * Parse SRT subtitle format
 * @param {string} srtContent - SRT file content
 * @returns {Array} Array of subtitle entries with text and timestamps
 */
export const parseSRT = (srtContent) => {
  try {
    const subtitles = [];
    const blocks = srtContent.trim().split(/\n\s*\n/);

    for (const block of blocks) {
      const lines = block.trim().split('\n');
      if (lines.length < 3) continue;

      // Parse timing line (format: 00:00:20,000 --> 00:00:24,400)
      const timingLine = lines[1];
      const timingMatch = timingLine.match(/(\d{2}:\d{2}:\d{2},\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2},\d{3})/);

      if (!timingMatch) continue;

      const startTime = timingMatch[1].replace(',', '.');
      const endTime = timingMatch[2].replace(',', '.');

      // Text is everything after the timing line
      const text = lines.slice(2).join('\n').trim();

      subtitles.push({
        startTime,
        endTime,
        text,
      });
    }

    return subtitles;
  } catch (error) {
    console.error('Error parsing SRT:', error);
    throw new Error(`Failed to parse SRT: ${error.message}`);
  }
};

/**
 * Convert time string to seconds
 * @param {string} timeStr - Time string (e.g., '00:05:23.400' or '00:05:23,400')
 * @returns {number} Time in seconds
 */
const timeToSeconds = (timeStr) => {
  const parts = timeStr.replace(',', '.').split(':');
  const hours = parseInt(parts[0]);
  const minutes = parseInt(parts[1]);
  const seconds = parseFloat(parts[2]);
  return hours * 3600 + minutes * 60 + seconds;
};

/**
 * Extract subtitle text within a time range
 * @param {Array} parsedSubtitles - Array of parsed subtitle entries
 * @param {string} startTime - Start time (e.g., '00:05:23')
 * @param {string} endTime - End time (e.g., '00:05:45')
 * @returns {string} Concatenated subtitle text
 */
export const extractTextByTiming = (parsedSubtitles, startTime, endTime) => {
  try {
    console.log(`\n=== Extracting subtitle text ===`);
    console.log(`Input startTime: ${startTime}`);
    console.log(`Input endTime: ${endTime}`);
    console.log(`Total parsed subtitles: ${parsedSubtitles.length}`);

    // Normalize time format: convert MM:SS to HH:MM:SS if needed
    const normalizeTime = (time) => {
      const parts = time.split(':');
      if (parts.length === 2) {
        // Format is MM:SS, convert to HH:MM:SS
        return `00:${time}`;
      }
      return time;
    };

    const normalizedStart = normalizeTime(startTime);
    const normalizedEnd = normalizeTime(endTime);

    console.log(`Normalized startTime: ${normalizedStart}`);
    console.log(`Normalized endTime: ${normalizedEnd}`);

    // Convert input times to seconds (add milliseconds if not present)
    const startTimeWithMs = normalizedStart.includes('.') || normalizedStart.includes(',')
      ? normalizedStart
      : `${normalizedStart}.000`;
    const endTimeWithMs = normalizedEnd.includes('.') || normalizedEnd.includes(',')
      ? normalizedEnd
      : `${normalizedEnd}.000`;

    const startSeconds = timeToSeconds(startTimeWithMs);
    const endSeconds = timeToSeconds(endTimeWithMs);

    console.log(`Start seconds: ${startSeconds}`);
    console.log(`End seconds: ${endSeconds}`);

    // Log first few subtitles for debugging
    if (parsedSubtitles.length > 0) {
      console.log(`\nFirst 3 subtitles:`);
      parsedSubtitles.slice(0, 3).forEach((sub, idx) => {
        console.log(`${idx + 1}. ${sub.startTime} --> ${sub.endTime}: "${sub.text.substring(0, 50)}..."`);
      });
    }

    // Filter subtitles that overlap with the requested time range
    const matchingSubtitles = parsedSubtitles.filter((sub) => {
      const subStart = timeToSeconds(sub.startTime);
      const subEnd = timeToSeconds(sub.endTime);

      // Check if subtitle overlaps with requested range
      return (subStart >= startSeconds && subStart <= endSeconds) ||
             (subEnd >= startSeconds && subEnd <= endSeconds) ||
             (subStart <= startSeconds && subEnd >= endSeconds);
    });

    console.log(`Matching subtitles found: ${matchingSubtitles.length}`);

    if (matchingSubtitles.length > 0) {
      console.log(`\nMatching subtitles:`);
      matchingSubtitles.forEach((sub, idx) => {
        console.log(`${idx + 1}. ${sub.startTime} --> ${sub.endTime}: "${sub.text}"`);
      });
    }

    if (matchingSubtitles.length === 0) {
      console.log(`No matching subtitles found for range ${normalizedStart} - ${normalizedEnd}`);
      return '';
    }

    // Concatenate text and remove HTML tags and duplicates
    const text = matchingSubtitles
      .map(sub => sub.text)
      .join(' ')
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();

    console.log(`Final extracted text: "${text.substring(0, 100)}..."`);
    console.log(`=== Extraction complete ===\n`);

    return text;
  } catch (error) {
    console.error('Error extracting text by timing:', error);
    throw new Error(`Failed to extract text: ${error.message}`);
  }
};
