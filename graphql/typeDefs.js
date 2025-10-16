export const typeDefs = `#graphql
  type User {
    id: ID!
    googleId: String!
    email: String!
    name: String!
    avatar: String
    createdAt: String!
    lastLogin: String!
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

  type AuthPayload {
    token: String!
    user: User!
  }

  type Query {
    # Auth
    me: User

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
  }
`;
