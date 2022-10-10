import { ChannelConfiguration } from 'dynamojs-net';

/**
 * RTC channel configuration settings
 */
const channelConfigs = {
  admin: {
    id: 0,
    ordered: true,
  } as ChannelConfiguration,
  stateReliable: {
    id: 1,
    ordered: false,
    maxRetransmits: 3,
  } as ChannelConfiguration,
  stateUnreliable: {
    id: 2,
    ordered: false,
    maxRetransmits: 0,
  } as ChannelConfiguration,
};
type NetworkChannels = keyof typeof channelConfigs;

export default channelConfigs;
export type { NetworkChannels };
