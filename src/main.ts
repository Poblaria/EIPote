import EIPote from "@/EIPote/EIPote";

await (await EIPote.create(Bun.env.DISCORD_TOKEN, import.meta.dir)).start();
