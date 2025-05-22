// spotify.model.ts
export interface SpotifyImage {
  url: string;
  height?: number;
  width?: number;
}

export interface SpotifyArtist {
  id?: string;
  name: string;
  // Puedes añadir más propiedades según necesites
}

export interface SpotifyAlbum {
  id: string;
  name: string;
  images: SpotifyImage[];
  // Otras propiedades del álbum
}

export interface SpotifyTrack {
  id: string;
  name: string;
  duration_ms: number;
  artists: SpotifyArtist[];
  album: SpotifyAlbum;
  preview_url: string | null;
  // Otras propiedades de la canción
}

export interface SpotifyPlaylistTrack {
  track: {
    id: string;
    name: string;
    duration_ms: number;
    artists: Array<{ name: string }>;
    album: {
      name: string;
      images: Array<{ url: string }>;
    };
    preview_url: string | null;
  };
}


export interface SpotifyPlaylistTracks {
  href: string;
  items: SpotifyPlaylistTrack[];
  limit: number;
  next: string | null;
  offset: number;
  previous: string | null;
  total: number;
}

export interface SpotifyPlaylist {
  id: string;
  name: string;
  description: string;
  images: SpotifyImage[];
  owner: {
    display_name: string;
    id: string;
  };
  tracks: SpotifyPlaylistTracks;
  followers?: {
    total: number;
  };
  public?: boolean;
}

export interface SpotifyPagination<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
  next: string | null;
}

// spotify.interfaces.ts
export interface FormattedTrack {
  position: number;
  id: string;
  name: string;
  artists: string[];
  album: string;
  duration: string;
  previewUrl: string | null;
  image: string | null;
}

export interface FormattedPlaylist {
  id: string;
  name: string;
  description: string;
  images: Array<{ url: string }>;
  owner: { display_name: string };
  followers?: { total: number };
  tracks: SpotifyPagination<FormattedTrack>;
}

export interface SpotifyUserPlaylistsResponse {
  href: string;
  items: SpotifyPlaylist[];
  limit: number;
  next: string | null;
  offset: number;
  previous: string | null;
  total: number;
}

export interface SpotifyPlaylistOwner {
  display_name: string;
  id: string;
  uri?: string;
  href?: string;
  external_urls?: {
    spotify: string;
  };
}

export interface SpotifyExternalUrls {
  spotify: string;
}

export interface SpotifyTrackObject {
  album: SpotifyAlbum;
  artists: SpotifyArtist[];
  available_markets?: string[];
  disc_number: number;
  duration_ms: number;
  explicit: boolean;
  external_ids: {
    isrc: string;
  };
  external_urls: SpotifyExternalUrls;
  href: string;
  id: string;
  is_local: boolean;
  name: string;
  popularity: number;
  preview_url: string | null;
  track_number: number;
  type: 'track';
  uri: string;
}

export interface SpotifyContext {
  type: 'artist' | 'playlist' | 'album';
  href: string;
  external_urls: SpotifyExternalUrls;
  uri: string;
}

// Tipos para respuestas específicas
export interface SpotifyPlaylistResponse extends SpotifyPlaylist {}
export interface SpotifyPlaylistTracksResponse {
  items: SpotifyPlaylistTrack[];
  total: number;
  limit: number;
  offset: number;
  next:string | null;
}
