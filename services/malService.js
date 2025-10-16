import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const MAL_BASE_URL = 'https://api.myanimelist.net/v2';

class MALService {
  constructor() {
    this.clientId = process.env.MAL_CLIENT_ID;
  }

  getHeaders() {
    if (!this.clientId) {
      throw new Error('MAL_CLIENT_ID is not configured');
    }
    return {
      'X-MAL-CLIENT-ID': this.clientId,
    };
  }

  async searchAnime(query) {
    try {
      const response = await axios.get(`${MAL_BASE_URL}/anime`, {
        params: {
          q: query,
          limit: 20,
          fields: 'id,title,main_picture,synopsis,num_episodes,mean,start_season,status',
        },
        headers: this.getHeaders(),
      });

      return response.data.data.map(item => ({
        id: item.node.id,
        title: item.node.title,
        image: item.node.main_picture?.large || item.node.main_picture?.medium,
        synopsis: item.node.synopsis,
        episodes: item.node.num_episodes,
        score: item.node.mean,
        year: item.node.start_season?.year,
        status: item.node.status,
      }));
    } catch (error) {
      console.error('MAL API Error:', error.message);
      throw new Error('Failed to search anime from MyAnimeList API');
    }
  }

  async getAnime(id) {
    try {
      const response = await axios.get(`${MAL_BASE_URL}/anime/${id}`, {
        params: {
          fields: 'id,title,main_picture,synopsis,num_episodes,mean,start_season,status',
        },
        headers: this.getHeaders(),
      });

      const anime = response.data;
      return {
        id: anime.id,
        title: anime.title,
        image: anime.main_picture?.large || anime.main_picture?.medium,
        synopsis: anime.synopsis,
        episodes: anime.num_episodes,
        score: anime.mean,
        year: anime.start_season?.year,
        status: anime.status,
      };
    } catch (error) {
      console.error('MAL API Error:', error.message);
      throw new Error('Failed to get anime from MyAnimeList API');
    }
  }

  async getAnimeCharacters(animeId) {
    // Note: MAL API v2 doesn't provide character endpoints directly
    // We'll fallback to Jikan for this
    throw new Error('MAL API does not support character queries. Please use Jikan API instead.');
  }

  async getAnimeEpisodes(animeId) {
    // Note: MAL API v2 doesn't provide episode details
    // We'll fallback to Jikan for this
    throw new Error('MAL API does not support episode queries. Please use Jikan API instead.');
  }
}

export default new MALService();
