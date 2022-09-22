import { ClientToServerEvents, ServerToClientEvents } from './Events';
import { InputEvent } from '../Entity';
import { LobbySocketData, PlayerSocketData, StartSocketData } from './Startup';
import {
  EntitySocketData,
  GameStateSocketData,
  MapTransitionSocketData,
} from './State';

export type {
  ClientToServerEvents,
  ServerToClientEvents,
  InputEvent,
  PlayerSocketData,
  LobbySocketData,
  StartSocketData,
  EntitySocketData,
  GameStateSocketData,
  MapTransitionSocketData,
};
