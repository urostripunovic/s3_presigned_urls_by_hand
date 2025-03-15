import { Hash } from "@aws-sdk/hash-node";
import { HttpRequest } from "@aws-sdk/protocol-http";
import { S3RequestPresigner } from "@aws-sdk/s3-request-presigner";
import { file, fileChunk, fileSize } from "./SharedData";
import { request_config } from "./ServerConfig";
const signer = new S3RequestPresigner({
  region: '',
  credentials: { accessKeyId: '123', secretAccessKey: '456' },
  sha256: Hash.bind(null, "sha256"), // In Node.js
});

const base_url = `${request_config.protocol}//${request_config.hostname}:${request_config.port}/poc/${request_config.path}`;

//server side
const request = new HttpRequest({
  method: 'POST',
  ...request_config,
  query: {
    uploads: ''
  },
});

const presigned = await signer.presign(request);
const buildQuery = (obj: any) => Object.keys(obj).map(key => obj[key] === '' ? key : `${key}=${obj[key]}`).join('&');
const url = `${base_url}?${buildQuery(presigned.query)}`
console.log(url)

const uploadId = "1234"

const fileParts = Math.ceil(fileSize / fileChunk);
const presignedUrls = []
for (let i = 1; i <= fileParts; i++) {
  const presigned = await signer.presign(new HttpRequest({
    method: 'PUT',
    ...request_config,
    query: {
      partNumber: `${i}`,
      uploadId: uploadId
    },
  }));
  const url = `${base_url}?${buildQuery(presigned.query)}`
  presignedUrls.push(url)
}
console.log(presignedUrls)

const reader = file.stream().getReader();

const buffer = new Uint8Array(fileChunk);
let bufferLength = 0;
export const readableStream = new ReadableStream({
  async start(controller) {
    return pump();

    async function pump(): Promise<void> {
      const { done, value } = await reader.read();
      if (done) {
        if (bufferLength > 0) controller.enqueue(buffer.slice(0, bufferLength));
        controller.close();
        return;
      }
      if (bufferLength >= fileChunk) {
        controller.enqueue(buffer.slice(0, bufferLength));
        bufferLength = 0;
      }

      buffer.set(value, bufferLength)
      bufferLength += value.length;
      return pump();
    }
  },
}, {
  size(chunk) {
    console.log('chunk size:', chunk?.length);
    return chunk?.length;
  },
});

// POST for each chunk
let i = 0;
const hasher = new Bun.CryptoHasher('sha256');
for await (const chunk of readableStream) {
  hasher.update(chunk)
  console.log(chunk.length, presignedUrls[i++]);
}
console.log(hasher.digest('hex'))
