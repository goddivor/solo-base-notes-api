import Extract from '../models/Extract.js';
import Theme from '../models/Theme.js';
import jikanService from '../services/jikanService.js';
import malService from '../services/malService.js';

export const resolvers = {
  Query: {
    // Auth
    me: async (_, __, { user }) => {
      if (!user) throw new Error('Not authenticated');
      return user;
    },

    // Extracts
    extracts: async (_, { themeId, animeId, limit = 50, offset = 0 }, { user }) => {
      if (!user) throw new Error('Not authenticated');

      const filter = { userId: user.id };
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

      const extract = await Extract.findOne({ _id: id, userId: user.id }).populate('themeId');
      if (!extract) throw new Error('Extract not found');
      return extract;
    },

    // Themes
    themes: async (_, __, { user }) => {
      if (!user) throw new Error('Not authenticated');
      return await Theme.find({ userId: user.id }).sort({ createdAt: -1 });
    },

    theme: async (_, { id }, { user }) => {
      if (!user) throw new Error('Not authenticated');

      const theme = await Theme.findOne({ _id: id, userId: user.id });
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

      const extract = await Extract.findOneAndUpdate(
        { _id: id, userId: user.id },
        { ...input, updatedAt: Date.now() },
        { new: true }
      ).populate('themeId');

      if (!extract) throw new Error('Extract not found');
      return extract;
    },

    deleteExtract: async (_, { id }, { user }) => {
      if (!user) throw new Error('Not authenticated');

      const result = await Extract.deleteOne({ _id: id, userId: user.id });
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

      const theme = await Theme.findOneAndUpdate(
        { _id: id, userId: user.id },
        { ...input, updatedAt: Date.now() },
        { new: true }
      );

      if (!theme) throw new Error('Theme not found');
      return theme;
    },

    deleteTheme: async (_, { id }, { user }) => {
      if (!user) throw new Error('Not authenticated');

      const result = await Theme.deleteOne({ _id: id, userId: user.id });
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
