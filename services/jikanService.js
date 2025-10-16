import axios from 'axios';

const JIKAN_BASE_URL = 'https://api.jikan.moe/v4';

class JikanService {
  async searchAnime(query) {
    try {
      const response = await axios.get(`${JIKAN_BASE_URL}/anime`, {
        params: {
          q: query,
          limit: 20,
        },
      });

      return response.data.data.map(anime => ({
        id: anime.mal_id,
        title: anime.title,
        image: anime.images?.jpg?.image_url || anime.images?.jpg?.large_image_url,
        synopsis: anime.synopsis,
        episodes: anime.episodes,
        score: anime.score,
        year: anime.year,
        status: anime.status,
      }));
    } catch (error) {
      console.error('Jikan API Error:', error.message);
      throw new Error('Failed to search anime from Jikan API');
    }
  }

  async getAnime(id) {
    try {
      const response = await axios.get(`${JIKAN_BASE_URL}/anime/${id}`);
      const anime = response.data.data;

      return {
        id: anime.mal_id,
        title: anime.title,
        image: anime.images?.jpg?.image_url || anime.images?.jpg?.large_image_url,
        synopsis: anime.synopsis,
        episodes: anime.episodes,
        score: anime.score,
        year: anime.year,
        status: anime.status,
      };
    } catch (error) {
      console.error('Jikan API Error:', error.message);
      throw new Error('Failed to get anime from Jikan API');
    }
  }

  async getAnimeCharacters(animeId) {
    try {
      const response = await axios.get(`${JIKAN_BASE_URL}/anime/${animeId}/characters`);

      return response.data.data.map(item => ({
        malId: item.character.mal_id,
        name: item.character.name,
        image: item.character.images?.jpg?.image_url,
      }));
    } catch (error) {
      console.error('Jikan API Error:', error.message);
      throw new Error('Failed to get anime characters from Jikan API');
    }
  }

  async getAnimeEpisodes(animeId) {
    try {
      const response = await axios.get(`${JIKAN_BASE_URL}/anime/${animeId}/episodes`);

      return response.data.data.map(episode => ({
        number: episode.mal_id,
        title: episode.title,
        aired: episode.aired,
        duration: episode.duration ? Math.round(episode.duration / 60) : 24, // Convert seconds to minutes, default 24
      }));
    } catch (error) {
      console.error('Jikan API Error:', error.message);
      throw new Error('Failed to get anime episodes from Jikan API');
    }
  }
}

export default new JikanService();
