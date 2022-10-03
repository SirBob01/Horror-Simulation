import { ClientToServerEvents, ServerToClientEvents } from './Events';
import { InputEvent } from '../Entity';
import { LobbySocketData, PlayerSocketData, StartSocketData } from './Startup';
import {
  GameStateSocketData,
  InputStateSocketData,
  MapTransitionSocketData,
} from './State';
import {
  EntitySocketData,
  HumanEntitySocketData,
  MonsterEntitySocketData,
} from './Entity';
import channelConfigs, { NetworkChannels } from './Channels';

export { channelConfigs };
export type {
  NetworkChannels,
  ClientToServerEvents,
  ServerToClientEvents,
  InputEvent,
  PlayerSocketData,
  LobbySocketData,
  StartSocketData,
  EntitySocketData,
  HumanEntitySocketData,
  MonsterEntitySocketData,
  InputStateSocketData,
  GameStateSocketData,
  MapTransitionSocketData,
};
