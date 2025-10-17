import axios from 'axios';

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

/**
 * Extract channel ID from YouTube URL
 * Supports formats:
 * - https://www.youtube.com/@username
 * - https://www.youtube.com/channel/UC...
 * - https://www.youtube.com/c/username
 */
const extractChannelInfo = (url) => {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;

    // Handle @username format
    if (pathname.startsWith('/@')) {
      const username = pathname.substring(2);
      return { type: 'handle', value: username };
    }

    // Handle /channel/ format
    if (pathname.startsWith('/channel/')) {
      const channelId = pathname.split('/channel/')[1].split('/')[0];
      return { type: 'id', value: channelId };
    }

    // Handle /c/ or /user/ format
    if (pathname.startsWith('/c/') || pathname.startsWith('/user/')) {
      const username = pathname.split('/')[2];
      return { type: 'username', value: username };
    }

    throw new Error('Invalid YouTube URL format');
  } catch (error) {
    throw new Error('Invalid YouTube URL');
  }
};

/**
 * Get channel ID from handle (@username)
 */
const getChannelIdFromHandle = async (handle) => {
  try {
    const response = await axios.get(`${YOUTUBE_API_BASE}/search`, {
      params: {
        part: 'snippet',
        q: `@${handle}`,
        type: 'channel',
        maxResults: 1,
        key: YOUTUBE_API_KEY,
      },
    });

    if (response.data.items && response.data.items.length > 0) {
      return response.data.items[0].snippet.channelId;
    }

    throw new Error('Channel not found');
  } catch (error) {
    throw new Error('Failed to fetch channel from handle');
  }
};

/**
 * Get channel ID from username
 */
const getChannelIdFromUsername = async (username) => {
  try {
    const response = await axios.get(`${YOUTUBE_API_BASE}/channels`, {
      params: {
        part: 'id',
        forUsername: username,
        key: YOUTUBE_API_KEY,
      },
    });

    if (response.data.items && response.data.items.length > 0) {
      return response.data.items[0].id;
    }

    throw new Error('Channel not found');
  } catch (error) {
    throw new Error('Failed to fetch channel from username');
  }
};

/**
 * Get channel details by channel ID
 */
const getChannelDetails = async (channelId) => {
  try {
    const response = await axios.get(`${YOUTUBE_API_BASE}/channels`, {
      params: {
        part: 'snippet,statistics,brandingSettings',
        id: channelId,
        key: YOUTUBE_API_KEY,
      },
    });

    if (!response.data.items || response.data.items.length === 0) {
      throw new Error('Channel not found');
    }

    const channel = response.data.items[0];

    return {
      id: channel.id,
      title: channel.snippet.title,
      description: channel.snippet.description,
      customUrl: channel.snippet.customUrl,
      thumbnail: channel.snippet.thumbnails.high.url,
      subscriberCount: parseInt(channel.statistics.subscriberCount),
      videoCount: parseInt(channel.statistics.videoCount),
      viewCount: parseInt(channel.statistics.viewCount),
      bannerUrl: channel.brandingSettings?.image?.bannerExternalUrl,
    };
  } catch (error) {
    console.error('YouTube API Error:', error.response?.data || error.message);
    throw new Error('Failed to fetch channel details');
  }
};

/**
 * Get channel videos with pagination
 */
const getChannelVideos = async (channelId, maxResults = 50) => {
  try {
    // First, get the uploads playlist ID
    const channelResponse = await axios.get(`${YOUTUBE_API_BASE}/channels`, {
      params: {
        part: 'contentDetails',
        id: channelId,
        key: YOUTUBE_API_KEY,
      },
    });

    if (!channelResponse.data.items || channelResponse.data.items.length === 0) {
      throw new Error('Channel not found');
    }

    const uploadsPlaylistId = channelResponse.data.items[0].contentDetails.relatedPlaylists.uploads;

    // Get videos from uploads playlist
    const playlistResponse = await axios.get(`${YOUTUBE_API_BASE}/playlistItems`, {
      params: {
        part: 'snippet',
        playlistId: uploadsPlaylistId,
        maxResults: maxResults,
        key: YOUTUBE_API_KEY,
      },
    });

    const videoIds = playlistResponse.data.items.map(item => item.snippet.resourceId.videoId);

    // Get video details including duration
    const videosResponse = await axios.get(`${YOUTUBE_API_BASE}/videos`, {
      params: {
        part: 'snippet,contentDetails,statistics',
        id: videoIds.join(','),
        key: YOUTUBE_API_KEY,
      },
    });

    // Parse ISO 8601 duration to seconds
    const parseDuration = (duration) => {
      if (!duration) return 0;

      const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
      if (!match) return 0;

      const hours = parseInt(match[1] || '0', 10);
      const minutes = parseInt(match[2] || '0', 10);
      const seconds = parseInt(match[3] || '0', 10);

      return hours * 3600 + minutes * 60 + seconds;
    };

    const videos = videosResponse.data.items.map(video => {
      const durationInSeconds = parseDuration(video.contentDetails.duration);
      const isShort = durationInSeconds <= 60;

      return {
        id: video.id,
        title: video.snippet.title,
        description: video.snippet.description,
        thumbnail: video.snippet.thumbnails.high.url,
        publishedAt: video.snippet.publishedAt,
        duration: video.contentDetails.duration,
        durationInSeconds,
        isShort,
        viewCount: parseInt(video.statistics.viewCount || 0),
        likeCount: parseInt(video.statistics.likeCount || 0),
        commentCount: parseInt(video.statistics.commentCount || 0),
      };
    });

    return videos;
  } catch (error) {
    console.error('YouTube API Error:', error.response?.data || error.message);
    throw new Error('Failed to fetch channel videos');
  }
};

/**
 * Main function to get YouTube channel info from URL
 */
export const getYouTubeChannelInfo = async (url) => {
  if (!YOUTUBE_API_KEY) {
    throw new Error('YouTube API key not configured');
  }

  const channelInfo = extractChannelInfo(url);
  let channelId;

  switch (channelInfo.type) {
    case 'id':
      channelId = channelInfo.value;
      break;
    case 'handle':
      channelId = await getChannelIdFromHandle(channelInfo.value);
      break;
    case 'username':
      channelId = await getChannelIdFromUsername(channelInfo.value);
      break;
    default:
      throw new Error('Unsupported URL format');
  }

  return await getChannelDetails(channelId);
};

/**
 * Get YouTube channel videos from URL
 */
export const getYouTubeChannelVideos = async (url, maxResults = 50) => {
  if (!YOUTUBE_API_KEY) {
    throw new Error('YouTube API key not configured');
  }

  const channelInfo = extractChannelInfo(url);
  let channelId;

  switch (channelInfo.type) {
    case 'id':
      channelId = channelInfo.value;
      break;
    case 'handle':
      channelId = await getChannelIdFromHandle(channelInfo.value);
      break;
    case 'username':
      channelId = await getChannelIdFromUsername(channelInfo.value);
      break;
    default:
      throw new Error('Unsupported URL format');
  }

  return await getChannelVideos(channelId, maxResults);
};

export default {
  getYouTubeChannelInfo,
  getYouTubeChannelVideos,
};
