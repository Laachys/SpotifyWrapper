import { ScaleType } from '@swimlane/ngx-charts';

export const SPOTIFY_COLOR_SCHEME = {
  name: 'spotify',
  selectable: true,
  group: ScaleType.Ordinal,
  domain: [
    '#1DB954', // Verde Spotify
    '#191414', // Negro Spotify
    '#FFFFFF', // Blanco
    '#B3B3B3', // Gris claro
    '#535353', // Gris oscuro
    '#FFCDD2', // Rojo claro
    '#4682B4', // Azul acero
    '#FFA500'  // Naranja
  ]
};