/**
 * RTC channel configuration settings
 */
const channelConfigs = {
  admin: {
    id: 0,
    ordered: true,
  },
  stateReliable: {
    id: 1,
    ordered: false,
    maxRetransmits: 3,
  },
  stateUnreliable: {
    id: 2,
    ordered: false,
    maxRetransmits: 0,
  },
};
type NetworkChannels = keyof typeof channelConfigs;

export default channelConfigs;
export type { NetworkChannels };
