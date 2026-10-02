export type SearchItem = {
  imdbId: string
  title: string | null
  year: string | null
  type: string
  poster: string | null
}

export type SearchResponse = {
  results: SearchItem[]
  total: number
  page: number
}

export type TitleDetail = {
  imdbId: string
  title: string | null
  year: string | null
  releaseYear: number
  runtimeMinutes: number | null
  rated: string | null
  released: string | null
  genre: string | null
  director: string | null
  writer: string | null
  actors: string | null
  plot: string | null
  language: string | null
  poster: string | null
  imdbRating: string | null
  type: string
  saved: boolean
  libraryId: number | null
  totalRatings: number
  averageRating: number
  classification: number
  recommendation: string | null
  includedInPlan: boolean
  personalScore: number | null
}

export type LibraryItem = {
  id: number
  imdbId: string
  title: string
  year: string | null
  releaseYear: number
  runtimeMinutes: number | null
  type: string
  poster: string | null
  plot: string | null
  director: string | null
  genre: string | null
  imdbRating: string | null
  includedInPlan: boolean
  totalRatings: number
  averageRating: number
  classification: number
  recommendation: string
  personalScore: number | null
}

export type LibrarySummary = {
  count: number
  totalMinutes: number
  items: LibraryItem[]
}

export type Film = {
  id: number
  episodeId: number
  title: string
  openingCrawl: string | null
  director: string | null
  producer: string | null
  releaseDate: string | null
  saved: boolean
}

export type AuthUrl = { authorizationUrl: string }

export type SpotifyProfile = {
  id: string
  displayName: string | null
  email: string | null
  imageUrl: string | null
  product: string | null
}

export type AlbumCard = {
  id: string | null
  name: string | null
  artists: string
  imageUrl: string | null
  releaseDate: string | null
  totalTracks: number
  externalUrl: string | null
}

export type AlbumPage = {
  albums: AlbumCard[]
  total: number
  offset: number
}

export type TrackCard = {
  id: string | null
  name: string | null
  artists: string
  albumName: string | null
  imageUrl: string | null
  durationMs: number
  popularity: number | null
  previewUrl: string | null
  externalUrl: string | null
}

export type Atmosphere = 'home' | 'cine' | 'biblioteca' | 'starwars' | 'spotify' | 'books' | 'community' | 'profile'

export type AuthUser = {
  id: number
  username: string
  email: string
  displayName: string
}

export type AuthResponse = {
  token: string
  user: AuthUser
}

export type ContentCard = {
  id: number
  kind: 'MOVIE' | 'BOOK' | 'TRACK' | 'FILM' | string
  externalId: string
  title: string
  year: string | null
  creator: string | null
  imageUrl: string | null
  synopsis: string | null
  category: string | null
  runtimeMinutes: number | null
  previewUrl: string | null
  sourceRating: string | null
  subtype: string | null
  average: number
  votes: number
  personalScore: number | null
  saved: boolean
  favorite: boolean
}

export type HomeCatalog = {
  movies: ContentCard[]
  books: ContentCard[]
  tracks: ContentCard[]
  films: ContentCard[]
  trending: ContentCard[]
}

export type Opinion = {
  username: string
  displayName: string
  score: number
  opinion: string | null
  updatedAt: string
}

export type RateResult = {
  catalogId: number
  personalScore: number
  average: number
  votes: number
  classification: number
  recommendation: string | null
}

export type Comment = {
  id: number
  username: string
  displayName: string
  body: string
  createdAt: string
  mine: boolean
}

export type Post = {
  id: number
  username: string
  displayName: string
  title: string
  body: string
  createdAt: string
  likes: number
  liked: boolean
  mine: boolean
  comments: Comment[]
}

export type CommunityOverview = {
  trending: ContentCard[]
  topRated: ContentCard[]
  popular: ContentCard[]
  recent: Opinion[]
  posts: Post[]
}

export type SavedView = {
  id: number
  includedInPlan: boolean
  card: ContentCard
}

export type Shelf = {
  id: number
  name: string
  items: ContentCard[]
}

export type Profile = {
  id: number
  username: string
  displayName: string
  email: string
  ratings: Array<{ card: ContentCard; score: number; opinion: string | null; updatedAt: string }>
  favorites: ContentCard[]
  shelves: Shelf[]
  history: Array<{ card: ContentCard; viewedAt: string }>
  saved: SavedView[]
}
