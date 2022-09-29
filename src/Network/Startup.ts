import { WorldMapSocketData } from '../Map';

/**
 * Defines the necessary data for the client to store player information
 */
interface PlayerSocketData {
  id: string;
  name: string;
  host: boolean;
}

/**
 * Sent on lobby initialization
 */
interface LobbySocketData {
  players: PlayerSocketData[];
  playerId: string;
  playerName: string;
}

/**
 * Sent when the game is started
 */
interface StartSocketData {
  key: string;
  mapData: WorldMapSocketData;
}

export type { PlayerSocketData, LobbySocketData, StartSocketData };
