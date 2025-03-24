import type { ChannelInfo } from "@/EIPote/Data";

export default function getChannelName(channelInfo: ChannelInfo) {
    return channelInfo.name + ": " + ((new Intl.DateTimeFormat("en-US", {
        hour: "2-digit",
        hour12: false,
        timeZone: channelInfo.timeZone
    })).format()) + "h";
}
