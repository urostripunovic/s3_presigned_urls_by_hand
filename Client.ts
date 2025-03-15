import { CryptoHasher } from "bun";
import { fileChunk } from "./SharedData";

export const readableStream = (reader: ReadableStreamDefaultReader<Uint8Array<ArrayBufferLike>>, chunkSize = fileChunk) => {
  const buffer = new Uint8Array(chunkSize);
  let bufferLength = 0;
  let i = 0;
  const streamChunks = () => new ReadableStream({
    async start(controller) {
      return pump();

      async function pump(): Promise<void> {
        const { done, value } = await reader.read();
        if (done) {
          if (bufferLength > 0) controller.enqueue(buffer.slice(0, bufferLength));
          controller.close();
          ++i;
          return;
        }
        if (bufferLength === chunkSize) {
          controller.enqueue(buffer.slice(0, bufferLength));
          ++i;
          bufferLength = 0;
        }

        buffer.set(value, bufferLength)
        bufferLength += value.length;
        return pump();
      }
    },
  });

  const hash = async () => {
    const hasher = new CryptoHasher('sha256');
    for await (const chunk of streamChunks()) {
      hasher.update(chunk);
    }
    return hasher.digest('hex');
  }

  const totalChunksStreamed = () => i;

  return { streamChunks, hash, totalChunksStreamed }
};


