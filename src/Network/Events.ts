import { LobbySocketData, StartSocketData } from './Startup';
import {
  GameStateSocketData,
  InputStateSocketData,
  MapTransitionSocketData,
} from './State';

/**
 * Client-to-server events
 */
interface ClientToServerEvents {
  /**
   * Create a new lobby
   */
  create: () => void;

  /**
   * Join an existing lobby
   */
  join: (key: string) => void;

  /**
   * Set the name of a player
   */
  setName: (name: string) => void;

  /**
   * Name of the map to be played
   */
  setMap: (name: string) => void;

  /**
   * Start a game
   */
  start: () => void;

  /**
   * Stop a game
   */
  stop: () => void;

  /**
   * Handle buffered user input events
   */
  input: (state: InputStateSocketData) => void;

  /**
   * Kick a player
   */
  kick: (id: string) => void;
}

/**
 * Server-to-client events
 */
interface ServerToClientEvents {
  /**
   * Response to creating a new lobby
   */
  createResponse: (key: string) => void;

  /**
   * Response to joining a lobby
   */
  joinResponse: (success: boolean) => void;

  /**
   * Emit lobby information to the players
   */
  lobby: (data: LobbySocketData) => void;

  /**
   * Emit the initial start data to the players
   */
  start: (data: StartSocketData) => void;

  /**
   * Live broadcast live game state information to the players
   */
  broadcastState: (state: GameStateSocketData) => void;

  /**
   * Broadcast player input information to other players
   */
  broadcastInput: (state: InputStateSocketData) => void;

  /**
   * Handle transitioning between maps
   */
  mapTransition: (data: MapTransitionSocketData) => void;

  /**
   * Kick a player
   */
  kick: () => void;
}

export type { ClientToServerEvents, ServerToClientEvents };
