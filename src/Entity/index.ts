import {
  Syncable,
  Controllable,
  InputEvent,
  ButtonEvent,
  MouseEvent,
} from './Interfaces';
import { Bullet } from './Bullet';
import { Entity } from './Entity';
import { Human } from './Human';
import { Monster } from './Monster';
import { Flashlight } from './Flashlight';

export { Entity, Human, Monster, Bullet, Flashlight };
export type { InputEvent, ButtonEvent, MouseEvent, Controllable, Syncable };
