export const typeDefs = `#graphql
  type User {
    id: ID!
    googleId: String!
    email: String!
    name: String!
    avatar: String
    youtubeChannelUrl: String
    createdAt: String!
    lastLogin: String!
  }

  type Settings {
    id: ID!
    youtubeChannelUrl: String
    updatedAt: String!
    updatedBy: ID
  }

  type YouTubeChannel {
    id: String!
    title: String!
    description: String
    customUrl: String
    thumbnail: String!
    subscriberCount: Int!
    videoCount: Int!
    viewCount: Int!
    bannerUrl: String
  }

  type YouTubeVideo {
    id: String!
    title: String!
    description: String
    thumbnail: String!
    publishedAt: String!
    duration: String!
    durationInSeconds: Int!
    isShort: Boolean!
    viewCount: Int!
    likeCount: Int!
    commentCount: Int!
  }

  type SpotifyArtist {
    id: String!
    name: String!
  }

  type SpotifyAlbum {
    id: String!
    name: String!
    image: String
  }

  type SpotifyTrack {
    id: String!
    name: String!
    artists: [SpotifyArtist!]!
    album: SpotifyAlbum!
    duration: Int!
    previewUrl: String
    spotifyUrl: String!
    uri: String!
  }

  type VideoSegment {
    extractId: ID!
    text: String!
    order: Int!
  }

  type Video {
    id: ID!
    title: String!
    description: String!
    tags: String!
    segments: [VideoSegment!]!
    musicTracks: [SpotifyTrack!]!
    userId: ID!
    createdAt: String!
    updatedAt: String!
  }

  type Character {
    malId: Int!
    name: String!
    image: String
  }

  type Timing {
    start: String!
    end: String!
  }

  type Anime {
    id: Int!
    title: String!
    image: String
    synopsis: String
    episodes: Int
    score: Float
    year: Int
    status: String
  }

  type Episode {
    number: Int!
    title: String
    aired: String
    duration: Int
  }

  type Theme {
    id: ID!
    name: String!
    description: String
    color: String!
    userId: ID!
    createdAt: String!
    updatedAt: String!
  }

  type Extract {
    id: ID!
    text: String!
    characters: [Character!]!
    animeId: Int!
    animeTitle: String!
    animeImage: String
    anime: Anime
    apiSource: String!
    timing: Timing!
    season: Int
    episode: Int
    theme: Theme
    themeId: ID
    userId: ID!
    createdAt: String!
    updatedAt: String!
  }

  enum APISource {
    MAL
    JIKAN
  }

  input CharacterInput {
    malId: Int!
    name: String!
    image: String
  }

  input TimingInput {
    start: String!
    end: String!
  }

  input CreateExtractInput {
    text: String!
    characters: [CharacterInput!]!
    animeId: Int!
    animeTitle: String!
    animeImage: String
    apiSource: APISource!
    timing: TimingInput!
    season: Int
    episode: Int
    themeId: ID
  }

  input UpdateExtractInput {
    text: String
    characters: [CharacterInput!]
    animeId: Int
    animeTitle: String
    animeImage: String
    apiSource: APISource
    timing: TimingInput
    season: Int
    episode: Int
    themeId: ID
  }

  input CreateThemeInput {
    name: String!
    description: String
    color: String
  }

  input UpdateThemeInput {
    name: String
    description: String
    color: String
  }

  input VideoSegmentInput {
    extractId: ID!
    text: String!
    order: Int!
  }

  input SpotifyArtistInput {
    id: String!
    name: String!
  }

  input SpotifyAlbumInput {
    id: String!
    name: String!
    image: String
  }

  input SpotifyTrackInput {
    id: String!
    name: String!
    artists: [SpotifyArtistInput!]!
    album: SpotifyAlbumInput!
    duration: Int!
    previewUrl: String
    spotifyUrl: String!
    uri: String!
  }

  input CreateVideoInput {
    title: String!
    description: String!
    tags: String!
    segments: [VideoSegmentInput!]!
    musicTracks: [SpotifyTrackInput!]
  }

  input UpdateVideoInput {
    title: String
    description: String
    tags: String
    segments: [VideoSegmentInput!]
    musicTracks: [SpotifyTrackInput!]
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  type Query {
    # Auth
    me: User

    # Settings
    settings: Settings!

    # Extracts
    extracts(themeId: ID, animeId: Int, limit: Int, offset: Int): [Extract!]!
    extract(id: ID!): Extract

    # Themes
    themes: [Theme!]!
    theme(id: ID!): Theme

    # Anime APIs
    searchAnime(query: String!, source: APISource!): [Anime!]!
    getAnime(id: Int!, source: APISource!): Anime
    getAnimeCharacters(animeId: Int!, source: APISource!): [Character!]!
    getAnimeEpisodes(animeId: Int!, source: APISource!): [Episode!]!

    # YouTube
    getYouTubeChannelInfo(url: String!): YouTubeChannel!
    getYouTubeChannelVideos(url: String!, maxResults: Int): [YouTubeVideo!]!

    # Spotify
    searchSpotifyTracks(query: String!, limit: Int): [SpotifyTrack!]!
    getSpotifyTrack(trackId: String!): SpotifyTrack

    # Videos
    videos(limit: Int, offset: Int): [Video!]!
    video(id: ID!): Video
  }

  type Mutation {
    # Extracts
    createExtract(input: CreateExtractInput!): Extract!
    updateExtract(id: ID!, input: UpdateExtractInput!): Extract!
    deleteExtract(id: ID!): Boolean!

    # Themes
    createTheme(input: CreateThemeInput!): Theme!
    updateTheme(id: ID!, input: UpdateThemeInput!): Theme!
    deleteTheme(id: ID!): Boolean!

    # Settings
    updateSettings(youtubeChannelUrl: String): Settings!

    # User (deprecated - kept for backward compatibility)
    updateYouTubeChannelUrl(url: String!): User!

    # Videos
    createVideo(input: CreateVideoInput!): Video!
    updateVideo(id: ID!, input: UpdateVideoInput!): Video!
    deleteVideo(id: ID!): Boolean!
  }
`;
