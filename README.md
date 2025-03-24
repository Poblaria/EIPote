# EIPote

To install dependencies:

```bash
bun install
```

To run:

```bash
bun .
```

## Docker

To build the image:

```bash
docker build --pull -t eipote .
```

To run the image:

```bash
docker run -d -e DISCORD_TOKEN="your-token" eipote
```

To stop the container:

```bash
docker stop <container-id>
```

If you don't know the container id, you can get it by running:

```bash
docker ps
```
