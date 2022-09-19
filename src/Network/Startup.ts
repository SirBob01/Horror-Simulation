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
  player_id: string;
  player_name: string;
}

/**
 * Sent when the game is started
 */
interface StartSocketData {
  key: string;
  map_data: WorldMapSocketData;
}

export type { PlayerSocketData, LobbySocketData, StartSocketData };
