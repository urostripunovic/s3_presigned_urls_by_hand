
import { Hash } from "@aws-sdk/hash-node";
import { HttpRequest } from "@aws-sdk/protocol-http";
import { S3RequestPresigner } from "@aws-sdk/s3-request-presigner";
import { describe, expect, test } from "bun:test";
import { Server } from '../Server';
import { request_config } from "../ServerConfig";

const signer = new S3RequestPresigner({
  region: '',
  credentials: { accessKeyId: '123', secretAccessKey: '456' },
  sha256: Hash.bind(null, "sha256"),
});

const request = new HttpRequest({
  method: 'POST',
  ...request_config,
  query: {
    uploads: ''
  },
});

const server = new Server(signer, request);

describe('generatePresignedUrls', () => {
  test('should return an array of presigned URLs matching ?partNumber=&uploadId=', async () => {
    const fileSize = 1368709120;
    const presignedUrls = await server.generatePresignedUrls({ fileSize });

    expect(presignedUrls.length).toBe(21);

    for (const url of presignedUrls) {
      expect(url.href).toMatch(/\?partNumber=\d+&uploadId=.*/);
    }
  });

  test('should return an array of presigned URLs when no chunk size is provided (defaults to 64MB)', async () => {
    const fileSize = 1368709120; //test file size
    const presignedUrls = await server.generatePresignedUrls({ fileSize });
    expect(presignedUrls.length).toBe(21)
  });

  test('should return an array of presigned URLs based on the custom chunk size', async () => {
    const fileSize = 1 * 1024 * 1024 * 1024; // 1 GB in bytes
    const chunkSize = 32 * 1024 * 1024; // 32MB per chunk
    const presignedUrls = await server.generatePresignedUrls({ fileSize, chunkSize });
    expect(presignedUrls.length).toBe(32);
  });

  test('should return a single presigned URL for file sizes smaller than the chunk size', async () => {
    const fileSize = 10 * 1024 * 1024; // 10 MB file size, smaller than the default 64 MB chunk size
    const presignedUrls = await server.generatePresignedUrls({ fileSize });
    expect(presignedUrls.length).toBe(1); // Only one chunk required
  });

  test('should return an empty array when file size is 0', async () => {
    const fileSize = 0; // 0 bytes file
    const presignedUrls = await server.generatePresignedUrls({ fileSize });
    expect(presignedUrls.length).toBe(0); // No URLs should be returned
  });

  test('should return an empty array for negative file size', async () => {
    const fileSize = -1024 * 1024; // -1MB file size (invalid input)
    const presignedUrls = await server.generatePresignedUrls({ fileSize });
    expect(presignedUrls.length).toBe(0); // No URLs should be returned
  });

  test('should use default chunk size if chunk size is negative', async () => {
    const fileSize = 10 * 1024 * 1024; // 10 MB file
    const chunkSize = -64 * 1024 * 1024; // Invalid negative chunk size
    const presignedUrls = await server.generatePresignedUrls({ fileSize, chunkSize })
    expect(presignedUrls.length).toBe(1);
  });
  test('should return a large number of presigned URLs for a very large file size (e.g., 10TB)', async () => {
    const fileSize = 10 * 1024 * 1024 * 1024 * 1024; // 10 TB
    const presignedUrls = await server.generatePresignedUrls({ fileSize });
    const expectedLength = Math.ceil(fileSize / (64 * 1024 * 1024)); // 64MB chunks
    expect(presignedUrls.length).toBe(expectedLength);
  });
})
