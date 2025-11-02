import Extract from '../models/Extract.js';
import Theme from '../models/Theme.js';
import ThemeGroup from '../models/ThemeGroup.js';
import User from '../models/User.js';
import Video from '../models/Video.js';
import PublishedVideo from '../models/PublishedVideo.js';
import Settings from '../models/Settings.js';
import jikanService from '../services/jikanService.js';
import malService from '../services/malService.js';
import { getYouTubeChannelInfo, getYouTubeChannelVideos } from '../services/youtubeService.js';
import { searchTracks, getTrack } from '../services/spotifyService.js';
import { correctSpelling, suggestThemeGroups, suggestCustomThemeGroups, suggestThemeFromText, translateText } from '../services/geminiService.js';
import { getImdbIdFromMal } from '../services/mappingService.js';
import { searchSubtitles as searchSubtitlesService, downloadSubtitle, parseSRT, extractTextByTiming } from '../services/openSubtitlesService.js';

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

    // Theme Groups
    themeGroups: async (_, __, { user }) => {
      if (!user) throw new Error('Not authenticated');
      return await ThemeGroup.find({}).sort({ createdAt: -1 }).populate('themes');
    },

    themeGroup: async (_, { id }, { user }) => {
      if (!user) throw new Error('Not authenticated');

      const themeGroup = await ThemeGroup.findById(id).populate('themes');
      if (!themeGroup) throw new Error('Theme group not found');
      return themeGroup;
    },

    suggestThemeGroups: async (_, __, { user }) => {
      if (!user) throw new Error('Not authenticated');

      try {
        // Get all existing theme groups
        const existingGroups = await ThemeGroup.find({});

        // Extract all theme IDs that are already used in groups
        const usedThemeIds = new Set();
        existingGroups.forEach(group => {
          if (group.themes && group.themes.length > 0) {
            group.themes.forEach(themeId => {
              usedThemeIds.add(themeId.toString());
            });
          }
        });

        // Get all themes
        const allThemes = await Theme.find({}).select('id name description color');

        // Filter out themes that are already used in groups
        let availableThemes = allThemes.filter(theme =>
          !usedThemeIds.has(theme._id.toString())
        );

        // Additionally, filter out themes where ALL extracts are already used
        const themesWithAvailableExtracts = [];

        for (const theme of availableThemes) {
          // Get all extracts for this theme
          const themeExtracts = await Extract.find({ themeId: theme._id });

          // If the theme has no extracts at all, skip it
          if (themeExtracts.length === 0) {
            continue;
          }

          // Check if at least one extract is available (not used in any video)
          let hasAvailableExtract = false;

          for (const extract of themeExtracts) {
            // Check if extract is used in a video
            const usedInVideo = await Video.findOne({
              'segments.extractId': extract._id
            });

            // Check if extract is linked to a published video
            const linkedToPublished = await PublishedVideo.findOne({
              extractIds: extract._id
            });

            // If extract is not used anywhere, the theme has available extracts
            if (!usedInVideo && !linkedToPublished) {
              hasAvailableExtract = true;
              break; // No need to check other extracts
            }
          }

          // Only include theme if it has at least one available extract
          if (hasAvailableExtract) {
            themesWithAvailableExtracts.push(theme);
          }
        }

        if (themesWithAvailableExtracts.length < 2) {
          throw new Error('Need at least 2 themes with available extracts to suggest groups');
        }

        // Get AI suggestions using only themes with available extracts
        const suggestions = await suggestThemeGroups(themesWithAvailableExtracts);
        return suggestions;
      } catch (error) {
        console.error('Error in suggestThemeGroups query:', error);
        throw new Error(`Failed to suggest theme groups: ${error.message}`);
      }
    },

    suggestCustomThemeGroups: async (_, { userInput }, { user }) => {
      if (!user) throw new Error('Not authenticated');

      try {
        // Get all existing theme groups
        const existingGroups = await ThemeGroup.find({});

        // Extract all theme IDs that are already used in groups
        const usedThemeIds = new Set();
        existingGroups.forEach(group => {
          if (group.themes && group.themes.length > 0) {
            group.themes.forEach(themeId => {
              usedThemeIds.add(themeId.toString());
            });
          }
        });

        // Get all themes
        const allThemes = await Theme.find({}).select('id name description color');

        // Filter out themes that are already used in groups
        let availableThemes = allThemes.filter(theme =>
          !usedThemeIds.has(theme._id.toString())
        );

        // Additionally, filter out themes where ALL extracts are already used
        const themesWithAvailableExtracts = [];

        for (const theme of availableThemes) {
          const themeExtracts = await Extract.find({ themeId: theme._id });

          if (themeExtracts.length === 0) {
            continue;
          }

          let hasAvailableExtract = false;

          for (const extract of themeExtracts) {
            const usedInVideo = await Video.findOne({
              'segments.extractId': extract._id
            });

            const linkedToPublished = await PublishedVideo.findOne({
              extractIds: extract._id
            });

            if (!usedInVideo && !linkedToPublished) {
              hasAvailableExtract = true;
              break;
            }
          }

          if (hasAvailableExtract) {
            themesWithAvailableExtracts.push(theme);
          }
        }

        if (themesWithAvailableExtracts.length < 2) {
          throw new Error('Need at least 2 themes with available extracts to suggest groups');
        }

        // Get AI suggestions using user input and available themes
        const suggestions = await suggestCustomThemeGroups(themesWithAvailableExtracts, userInput);
        return suggestions;
      } catch (error) {
        console.error('Error in suggestCustomThemeGroups query:', error);
        throw new Error(`Failed to suggest custom theme groups: ${error.message}`);
      }
    },

    suggestThemeFromText: async (_, { text }, { user }) => {
      if (!user) throw new Error('Not authenticated');

      try {
        const suggestion = await suggestThemeFromText(text);
        return suggestion;
      } catch (error) {
        console.error('Error in suggestThemeFromText query:', error);
        throw new Error(`Failed to suggest theme: ${error.message}`);
      }
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

    // Subtitles
    searchSubtitles: async (_, { animeId, season, episode, languages, mappingService = 'arm' }, { user }) => {
      if (!user) throw new Error('Not authenticated');

      try {
        // Get IMDb ID from MAL ID using the selected mapping service (ARM or ids.moe)
        console.log(`Using ${mappingService} service to map MAL ID ${animeId} to IMDb ID...`);
        const imdbId = await getImdbIdFromMal(animeId, mappingService);

        if (!imdbId) {
          console.log(`No IMDb ID found for MAL ID ${animeId} using ${mappingService}`);
          return [];
        }

        console.log(`Found IMDb ID: ${imdbId}`);

        // Search subtitles using OpenSubtitles API
        const subtitles = await searchSubtitlesService(imdbId, season, episode, languages);
        return subtitles;
      } catch (error) {
        console.error('Error searching subtitles:', error);
        throw new Error(`Failed to search subtitles: ${error.message}`);
      }
    },

    downloadSubtitle: async (_, { fileId }, { user }) => {
      if (!user) throw new Error('Not authenticated');

      try {
        // Download subtitle file
        const srtContent = await downloadSubtitle(fileId);

        // Parse SRT format
        const parsedSubtitles = parseSRT(srtContent);

        return { entries: parsedSubtitles };
      } catch (error) {
        console.error('Error downloading subtitle:', error);
        throw new Error(`Failed to download subtitle: ${error.message}`);
      }
    },

    extractSubtitleText: async (_, { fileId, startTime, endTime }, { user }) => {
      if (!user) throw new Error('Not authenticated');

      try {
        // Download subtitle file
        const srtContent = await downloadSubtitle(fileId);

        // Parse SRT format
        const parsedSubtitles = parseSRT(srtContent);

        // Extract text within the specified time range
        const text = extractTextByTiming(parsedSubtitles, startTime, endTime);

        return { text };
      } catch (error) {
        console.error('Error extracting subtitle text:', error);
        throw new Error(`Failed to extract subtitle text: ${error.message}`);
      }
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

    // Published Videos
    publishedVideos: async (_, { limit = 50, offset = 0 }, { user }) => {
      if (!user) throw new Error('Not authenticated');

      return await PublishedVideo.find({})
        .sort({ publishedAt: -1 })
        .limit(limit)
        .skip(offset);
    },

    publishedVideo: async (_, { id }, { user }) => {
      if (!user) throw new Error('Not authenticated');

      const publishedVideo = await PublishedVideo.findById(id);
      if (!publishedVideo) throw new Error('Published video not found');
      return publishedVideo;
    },

    publishedVideoByYoutubeId: async (_, { youtubeVideoId }, { user }) => {
      if (!user) throw new Error('Not authenticated');

      const publishedVideo = await PublishedVideo.findOne({ youtubeVideoId });
      return publishedVideo; // Can be null if not found
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

    // Theme Groups
    createThemeGroup: async (_, { input }, { user }) => {
      if (!user) throw new Error('Not authenticated');

      const themeGroup = new ThemeGroup({
        name: input.name,
        description: input.description,
        color: input.color,
        themes: input.themeIds || [],
        userId: user.id,
      });

      await themeGroup.save();
      return await ThemeGroup.findById(themeGroup._id).populate('themes');
    },

    updateThemeGroup: async (_, { id, input }, { user }) => {
      if (!user) throw new Error('Not authenticated');

      const updateData = {
        updatedAt: Date.now(),
      };

      if (input.name !== undefined) updateData.name = input.name;
      if (input.description !== undefined) updateData.description = input.description;
      if (input.color !== undefined) updateData.color = input.color;
      if (input.themeIds !== undefined) updateData.themes = input.themeIds;

      const themeGroup = await ThemeGroup.findByIdAndUpdate(
        id,
        updateData,
        { new: true }
      ).populate('themes');

      if (!themeGroup) throw new Error('Theme group not found');
      return themeGroup;
    },

    deleteThemeGroup: async (_, { id }, { user }) => {
      if (!user) throw new Error('Not authenticated');

      const result = await ThemeGroup.deleteOne({ _id: id });
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

    publishVideo: async (_, { id, youtubeVideoId }, { user }) => {
      if (!user) throw new Error('Not authenticated');

      const video = await Video.findByIdAndUpdate(
        id,
        { isPublished: true, youtubeVideoId, updatedAt: Date.now() },
        { new: true }
      );

      if (!video) throw new Error('Video not found');
      return video;
    },

    // Published Videos
    linkPublishedVideo: async (_, { input }, { user }) => {
      if (!user) throw new Error('Not authenticated');

      // Check if video already exists
      const existing = await PublishedVideo.findOne({ youtubeVideoId: input.youtubeVideoId });
      if (existing) {
        throw new Error('This YouTube video is already linked');
      }

      const publishedVideo = new PublishedVideo({
        ...input,
        userId: user.id,
      });

      await publishedVideo.save();
      return await PublishedVideo.findById(publishedVideo._id);
    },

    updatePublishedVideo: async (_, { id, extractIds }, { user }) => {
      if (!user) throw new Error('Not authenticated');

      const publishedVideo = await PublishedVideo.findByIdAndUpdate(
        id,
        { extractIds, updatedAt: Date.now() },
        { new: true }
      );

      if (!publishedVideo) throw new Error('Published video not found');
      return publishedVideo;
    },

    deletePublishedVideo: async (_, { id }, { user }) => {
      if (!user) throw new Error('Not authenticated');

      const result = await PublishedVideo.deleteOne({ _id: id });
      return result.deletedCount > 0;
    },

    // AI Services
    correctSpelling: async (_, { text }, { user }) => {
      if (!user) throw new Error('Not authenticated');

      try {
        const correctedText = await correctSpelling(text);
        return correctedText;
      } catch (error) {
        console.error('Error in correctSpelling mutation:', error);
        throw new Error(`Failed to correct spelling: ${error.message}`);
      }
    },

    translateText: async (_, { text }, { user }) => {
      if (!user) throw new Error('Not authenticated');

      try {
        const translatedText = await translateText(text);
        return translatedText;
      } catch (error) {
        console.error('Error in translateText mutation:', error);
        throw new Error(`Failed to translate text: ${error.message}`);
      }
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
    isUsedInVideo: async (parent) => {
      // Check if this extract is used in any video (from Video collection)
      const video = await Video.findOne({
        'segments.extractId': parent._id
      });

      // Also check if it's linked to any published YouTube video
      const publishedVideo = await PublishedVideo.findOne({
        extractIds: parent._id
      });

      return !!(video || publishedVideo);
    },
  },

  VideoSegment: {
    extract: async (parent) => {
      if (parent.extractId) {
        const extract = await Extract.findById(parent.extractId).populate('themeId');
        return extract;
      }
      return null;
    },
  },

  Theme: {
    extractCount: async (parent) => {
      const count = await Extract.countDocuments({ themeId: parent._id });
      return count;
    },
  },

  ThemeGroup: {
    extractCount: async (parent) => {
      // Count all extracts that belong to any of the themes in this group
      if (!parent.themes || parent.themes.length === 0) {
        return 0;
      }
      const themeIds = parent.themes.map(theme => theme._id || theme);
      const count = await Extract.countDocuments({ themeId: { $in: themeIds } });
      return count;
    },
  },

  PublishedVideo: {
    extracts: async (parent) => {
      if (parent.extractIds && parent.extractIds.length > 0) {
        return await Extract.find({ _id: { $in: parent.extractIds } }).populate('themeId');
      }
      return [];
    },
  },
};
