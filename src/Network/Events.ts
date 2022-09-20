import { InputEvent } from '../Entity';
import { LobbySocketData, StartSocketData } from './Startup';
import { GameStateSocketData, MapTransitionSocketData } from './State';

/**
 * Client-to-server events
 */
interface ClientToServerEvents {
  /**
   * Create a new lobby
   */
  create: (callback: (key: string) => void) => void;

  /**
   * Join an existing lobby
   */
  join: (key: string, callback: (success: boolean) => void) => void;

  /**
   * Set the name of a player
   */
  setname: (name: string) => void;

  /**
   * Name of the map to be played
   */
  setmap: (name: string) => void;

  /**
   * Start a game
   */
  start: () => void;

  /**
   * Stop a game
   */
  stop: () => void;

  /**
   * Handle user input event
   */
  input: (input: InputEvent) => void;

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
  broadcast: (state: GameStateSocketData) => void;

  /**
   * Handle transitioning between maps
   */
  map_transition: (data: MapTransitionSocketData) => void;

  /**
   * Kick a player
   */
  kick: () => void;
}

export type { ClientToServerEvents, ServerToClientEvents };
