export type ChannelInfo = {
    name: string;
    timeZone: string;
};

export default class Data {
    channels: Record<string, Record<string, ChannelInfo>> = {};

    private readonly dataFile: string;

    private constructor(dataFile: string) {
        this.dataFile = dataFile;
    }

    static async create(dataFile = "data.json") {
        const data = new this(dataFile);
        const file = Bun.file(dataFile, { type: "application/json" });

        if (!(await file.exists())) return data;

        try {
            const __data = JSON.parse(await file.text());

            data.channels = __data.channels;
        } catch (error) {
            console.error(error);
        }

        return data;
    }

    async save() {
        await Bun.write(this.dataFile, JSON.stringify({
            channels: this.channels
        }));
    }

    async editChannel(guildId: string, id: string, channelInfo: ChannelInfo) {
        this.channels[guildId][id] = channelInfo;
        await this.save();
    }

    async deleteChannel(guildId: string, id: string) {
        delete this.channels[guildId][id];
        await this.save();
    }
};
