# Solo Base Notes - Backend API

Backend GraphQL API for managing anime extracts for Solo Geek YouTube channel.

## Features

- GraphQL API with Apollo Server
- Google OAuth authentication
- MongoDB database
- MyAnimeList & Jikan API integration
- Extract management with themes and characters
- Character search by anime
- **Subtitle auto-fill with OpenSubtitles API integration**
- **Anime ID mapping with ARM and ids.moe services**
- **AI-powered text correction with Gemini API**
- Video creation and management
- YouTube channel integration
- Spotify music search integration
- Extract usage tracking across videos
- Published video linking system

## Tech Stack

- Node.js + Express
- Apollo Server (GraphQL)
- MongoDB + Mongoose
- Passport.js (Google OAuth)
- JWT authentication

## Getting Started

### Prerequisites

- Node.js (v18+)
- MongoDB (local or cloud)
- Google OAuth credentials

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

3. Configure your `.env` file with:
   - MongoDB URI
   - Google OAuth credentials (get from Google Cloud Console)
   - JWT secret
   - Port and frontend URL
   - OpenSubtitles API credentials (API key, username, password)
   - ids.moe API key (optional, for ID mapping)
   - Gemini API key (for AI text correction)

### Get Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:4000/auth/google/callback`
6. Copy Client ID and Client Secret to `.env`

### Run the Server

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

The server will start at `http://localhost:4000`

- GraphQL Playground: `http://localhost:4000/graphql`
- Google Login: `http://localhost:4000/auth/google`

## GraphQL API

### Authentication

All queries and mutations (except anime search) require authentication. Include JWT token in headers:

```
Authorization: Bearer YOUR_JWT_TOKEN
```

### Main Queries

```graphql
# Get current user
query {
  me {
    id
    name
    email
  }
}

# Search anime
query {
  searchAnime(query: "Demon Slayer", source: JIKAN) {
    id
    title
    image
  }
}

# Get anime characters
query {
  getAnimeCharacters(animeId: 38000, source: JIKAN) {
    malId
    name
    image
  }
}

# Get all extracts
query {
  extracts {
    id
    text
    characters {
      name
    }
    animeTitle
  }
}

# Get all themes
query {
  themes {
    id
    name
    color
  }
}
```

### Main Mutations

```graphql
# Create theme
mutation {
  createTheme(input: {
    name: "Courage"
    description: "Extraits sur le courage"
    color: "#FF6B6B"
  }) {
    id
    name
  }
}

# Create extract
mutation {
  createExtract(input: {
    text: "Ne pleure pas... ne laisse pas le désespoir t'envahir !"
    characters: [{
      malId: 146156
      name: "Giyuu Tomioka"
    }]
    animeId: 38000
    animeTitle: "Demon Slayer"
    animeImage: "https://..."
    apiSource: JIKAN
    timing: {
      start: "12:30"
      end: "13:45"
    }
    season: 1
    episode: 1
    themeId: "..."
  }) {
    id
    text
  }
}
```

## Project Structure

```
solo-base-notes/
├── config/
│   ├── database.js          # MongoDB connection
│   └── passport.js          # Google OAuth config
├── graphql/
│   ├── typeDefs.js          # GraphQL schema
│   └── resolvers.js         # GraphQL resolvers
├── middleware/
│   └── auth.js              # JWT authentication
├── models/
│   ├── User.js              # User schema
│   ├── Extract.js           # Extract schema
│   ├── Theme.js             # Theme schema
│   ├── Video.js             # Video schema
│   └── PublishedVideo.js    # Published video schema
├── routes/
│   └── auth.js              # OAuth routes
├── services/
│   ├── jikanService.js          # Jikan API integration
│   ├── malService.js            # MyAnimeList API integration
│   ├── youtubeService.js        # YouTube Data API integration
│   ├── spotifyService.js        # Spotify API integration
│   ├── openSubtitlesService.js  # OpenSubtitles API integration
│   ├── armService.js            # ARM ID mapping service
│   ├── idsMoeService.js         # ids.moe ID mapping service
│   ├── mappingService.js        # Unified ID mapping interface
│   └── geminiService.js         # Gemini AI service
├── .env.example             # Environment variables template
├── server.js                # Main server file
└── package.json
```

## Database Models

### User
- googleId, email, name, avatar
- Automatically created on first Google login

### Theme
- name, description, color
- User-specific themes for video categories
- Computed field: extractCount (number of extracts per theme)

### Extract
- text, characters, animeId, timing, season, episode
- Links to theme and user
- Stores anime metadata (title, image)
- Computed field: isUsedInVideo (tracks if extract is used in any video)

### Video
- title, description, tags, segments, musicTracks
- segments: array of extract references with order
- musicTracks: Spotify track data
- isPublished: boolean flag for publication status
- youtubeVideoId: optional YouTube video ID when published

### PublishedVideo
- youtubeVideoId, title, description, thumbnail
- extractIds: array of extract references used in the video
- YouTube metadata: viewCount, likeCount, commentCount
- Links already-published YouTube videos to extracts

## API Sources

### Jikan API (Default)
- Free, no authentication required
- Full anime and character data
- Rate limit: 3 requests/second

### MyAnimeList API
- Requires client ID
- More accurate data
- No character endpoint (use Jikan for characters)

### YouTube Data API v3
- Requires API key
- Channel information retrieval
- Video list and metadata
- Short detection based on video duration (≤60s)

### Spotify Web API
- Requires client ID and secret
- Track search functionality
- Full track metadata including album and artist info

### OpenSubtitles API
- Requires API key, username, and password
- Automatic subtitle search by IMDb ID
- SRT file download and parsing
- Text extraction by time range
- Support for multiple languages (EN, FR)

### Anime ID Mapping Services
- **ARM (anime-relations-mapper)**: No authentication required, default service
- **ids.moe**: Requires API key, fallback service
- Converts MyAnimeList IDs to IMDb IDs for subtitle search
- Automatic fallback mechanism for reliability

### Gemini AI API
- Requires API key
- AI-powered text correction and spelling fixes
- Theme suggestions based on extract text

## License

MIT
