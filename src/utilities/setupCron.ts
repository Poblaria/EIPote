import type { VoiceChannel } from "discord.js";
import { CronJob } from "cron";
import getChannelName from "@utilities/getChannelName";
import type { ChannelInfo } from "@/EIPote/Data";
import type Data from "@/EIPote/Data";

export default function setupCron(channel: VoiceChannel, channelInfo: ChannelInfo, data: Data, runOnInit = false) {
    const job = CronJob.from({
        // Every hour at 0 minute 0 second
        cronTime: "0 0 * * * *",
        onTick: () => {
            channel.setName(getChannelName(channelInfo)).catch(async (error) => {
                if (error.code === 10003)
                    await data.deleteChannel(channel.guild.id, channel.id);
                else
                    console.error(error);

                job.stop();
            });
        },
        start: true,
        runOnInit
    });

    return job;
}
