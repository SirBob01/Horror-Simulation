/**
 * RTC channel configuration settings
 */
const channelConfigs = {
  admin: {
    id: 0,
    ordered: true,
    reliable: true,
  },
  state: {
    id: 1,
    ordered: false,
    reliable: false,
  },
};
type NetworkChannels = keyof typeof channelConfigs;

export default channelConfigs;
export type { NetworkChannels };
