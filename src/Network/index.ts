import { ClientToServerEvents, ServerToClientEvents } from './Events';
import { KeyInputSocketData, MouseInputSocketData } from './Input';
import { LobbySocketData, PlayerSocketData, StartSocketData } from './Startup';
import { GameStateSocketData, MapTransitionSocketData } from './State';

export type {
  ClientToServerEvents,
  ServerToClientEvents,
  KeyInputSocketData,
  MouseInputSocketData,
  PlayerSocketData,
  LobbySocketData,
  StartSocketData,
  GameStateSocketData,
  MapTransitionSocketData,
};
