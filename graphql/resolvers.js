import Extract from '../models/Extract.js';
import Theme from '../models/Theme.js';
import User from '../models/User.js';
import Video from '../models/Video.js';
import Settings from '../models/Settings.js';
import jikanService from '../services/jikanService.js';
import malService from '../services/malService.js';
import { getYouTubeChannelInfo, getYouTubeChannelVideos } from '../services/youtubeService.js';
import { searchTracks, getTrack } from '../services/spotifyService.js';

export const resolvers = {
  Query: {
    // Auth
    me: async (_, __, { user }) => {
      if (!user) throw new Error('Not authenticated');
      return user;
    },

    // Settings
    settings: async (_, __, { user }) => {
      if (!user) throw new Error('Not authenticated');

      // Get or create settings document
      let settings = await Settings.findById('global-settings');
      if (!settings) {
        settings = new Settings({ _id: 'global-settings' });
        await settings.save();
      }
      return settings;
    },

    // Extracts
    extracts: async (_, { themeId, animeId, limit = 50, offset = 0 }, { user }) => {
      if (!user) throw new Error('Not authenticated');

      const filter = {}; // Remove userId filter for collaborative access
      if (themeId) filter.themeId = themeId;
      if (animeId) filter.animeId = animeId;

      return await Extract.find(filter)
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(offset)
        .populate('themeId');
    },

    extract: async (_, { id }, { user }) => {
      if (!user) throw new Error('Not authenticated');

      const extract = await Extract.findById(id).populate('themeId'); // Remove userId filter
      if (!extract) throw new Error('Extract not found');
      return extract;
    },

    // Themes
    themes: async (_, __, { user }) => {
      if (!user) throw new Error('Not authenticated');
      return await Theme.find({}).sort({ createdAt: -1 }); // Remove userId filter
    },

    theme: async (_, { id }, { user }) => {
      if (!user) throw new Error('Not authenticated');

      const theme = await Theme.findById(id); // Remove userId filter
      if (!theme) throw new Error('Theme not found');
      return theme;
    },

    // Anime APIs
    searchAnime: async (_, { query, source }) => {
      if (source === 'MAL') {
        return await malService.searchAnime(query);
      }
      return await jikanService.searchAnime(query);
    },

    getAnime: async (_, { id, source }) => {
      if (source === 'MAL') {
        return await malService.getAnime(id);
      }
      return await jikanService.getAnime(id);
    },

    getAnimeCharacters: async (_, { animeId, source }) => {
      // Always use Jikan for characters as MAL API v2 doesn't support it
      return await jikanService.getAnimeCharacters(animeId);
    },

    getAnimeEpisodes: async (_, { animeId, source }) => {
      // Always use Jikan for episodes as MAL API v2 doesn't support it
      return await jikanService.getAnimeEpisodes(animeId);
    },

    // YouTube
    getYouTubeChannelInfo: async (_, { url }) => {
      try {
        return await getYouTubeChannelInfo(url);
      } catch (error) {
        throw new Error(error.message);
      }
    },

    getYouTubeChannelVideos: async (_, { url, maxResults = 50 }) => {
      try {
        return await getYouTubeChannelVideos(url, maxResults);
      } catch (error) {
        throw new Error(error.message);
      }
    },

    // Spotify
    searchSpotifyTracks: async (_, { query, limit = 10 }) => {
      try {
        return await searchTracks(query, limit);
      } catch (error) {
        console.error('GraphQL searchSpotifyTracks error:', error);
        throw new Error(error.message);
      }
    },

    getSpotifyTrack: async (_, { trackId }) => {
      try {
        return await getTrack(trackId);
      } catch (error) {
        throw new Error(error.message);
      }
    },

    // Videos
    videos: async (_, { limit = 50, offset = 0 }, { user }) => {
      if (!user) throw new Error('Not authenticated');

      return await Video.find({}) // Remove userId filter
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(offset);
    },

    video: async (_, { id }, { user }) => {
      if (!user) throw new Error('Not authenticated');

      const video = await Video.findById(id); // Remove userId filter
      if (!video) throw new Error('Video not found');
      return video;
    },
  },

  Mutation: {
    // Extracts
    createExtract: async (_, { input }, { user }) => {
      if (!user) throw new Error('Not authenticated');

      const extract = new Extract({
        ...input,
        userId: user.id,
      });

      await extract.save();
      return await Extract.findById(extract._id).populate('themeId');
    },

    updateExtract: async (_, { id, input }, { user }) => {
      if (!user) throw new Error('Not authenticated');

      const extract = await Extract.findByIdAndUpdate(
        id, // Remove userId filter for collaborative editing
        { ...input, updatedAt: Date.now() },
        { new: true }
      ).populate('themeId');

      if (!extract) throw new Error('Extract not found');
      return extract;
    },

    deleteExtract: async (_, { id }, { user }) => {
      if (!user) throw new Error('Not authenticated');

      const result = await Extract.deleteOne({ _id: id }); // Remove userId filter
      return result.deletedCount > 0;
    },

    // Themes
    createTheme: async (_, { input }, { user }) => {
      if (!user) throw new Error('Not authenticated');

      const theme = new Theme({
        ...input,
        userId: user.id,
      });

      await theme.save();
      return theme;
    },

    updateTheme: async (_, { id, input }, { user }) => {
      if (!user) throw new Error('Not authenticated');

      const theme = await Theme.findByIdAndUpdate(
        id, // Remove userId filter for collaborative editing
        { ...input, updatedAt: Date.now() },
        { new: true }
      );

      if (!theme) throw new Error('Theme not found');
      return theme;
    },

    deleteTheme: async (_, { id }, { user }) => {
      if (!user) throw new Error('Not authenticated');

      const result = await Theme.deleteOne({ _id: id }); // Remove userId filter
      return result.deletedCount > 0;
    },

    // Settings
    updateSettings: async (_, { youtubeChannelUrl }, { user }) => {
      if (!user) throw new Error('Not authenticated');

      // Get or create settings document
      let settings = await Settings.findById('global-settings');
      if (!settings) {
        settings = new Settings({ _id: 'global-settings' });
      }

      // Update fields
      if (youtubeChannelUrl !== undefined) {
        settings.youtubeChannelUrl = youtubeChannelUrl;
      }
      settings.updatedAt = Date.now();
      settings.updatedBy = user.id;

      await settings.save();
      return settings;
    },

    // User (deprecated - kept for backward compatibility)
    updateYouTubeChannelUrl: async (_, { url }, { user }) => {
      if (!user) throw new Error('Not authenticated');

      // Also update global settings
      let settings = await Settings.findById('global-settings');
      if (!settings) {
        settings = new Settings({ _id: 'global-settings' });
      }
      settings.youtubeChannelUrl = url;
      settings.updatedAt = Date.now();
      settings.updatedBy = user.id;
      await settings.save();

      // Keep user field for backward compatibility
      const updatedUser = await User.findByIdAndUpdate(
        user.id,
        { youtubeChannelUrl: url },
        { new: true }
      );

      if (!updatedUser) throw new Error('User not found');
      return updatedUser;
    },

    // Videos
    createVideo: async (_, { input }, { user }) => {
      if (!user) throw new Error('Not authenticated');

      const video = new Video({
        ...input,
        userId: user.id,
      });

      await video.save();
      return video;
    },

    updateVideo: async (_, { id, input }, { user }) => {
      if (!user) throw new Error('Not authenticated');

      const video = await Video.findByIdAndUpdate(
        id, // Remove userId filter for collaborative editing
        { ...input, updatedAt: Date.now() },
        { new: true }
      );

      if (!video) throw new Error('Video not found');
      return video;
    },

    deleteVideo: async (_, { id }, { user }) => {
      if (!user) throw new Error('Not authenticated');

      const result = await Video.deleteOne({ _id: id }); // Remove userId filter
      return result.deletedCount > 0;
    },
  },

  Extract: {
    theme: async (parent) => {
      if (parent.themeId) {
        return await Theme.findById(parent.themeId);
      }
      return null;
    },
    anime: async (parent) => {
      try {
        if (parent.apiSource === 'MAL') {
          return await malService.getAnime(parent.animeId);
        }
        return await jikanService.getAnime(parent.animeId);
      } catch (error) {
        console.error('Error fetching anime:', error);
        return null;
      }
    },
  },
};
