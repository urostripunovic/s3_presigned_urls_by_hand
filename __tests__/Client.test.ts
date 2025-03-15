import { $ } from "bun";
import { describe, expect, test } from "bun:test";
import { file, file2, fileChunk } from "../SharedData";
import { readableStream } from "../Client";

const file_hash = await $`sha256sum 1GB_text_file.txt | cut -d ' ' -f 1`.text();
const file_2_hash = await $`sha256sum 1GB_text_file2.txt | cut -d ' ' -f 1`.text();

describe('readableStream', () => {
  test('should chunk data correctly for file1', async () => {
    const read = readableStream(file.stream().getReader());
    const hash = await read.hash();
    expect(hash).toBe(file_hash.trim());
    expect(read.totalChunksStreamed()).toBe(21);
  });

  test('should chunk data correctly for file1 with custom chunk size', async () => {
    const chunkSize = 32 * 1024 * 1024;
    const expectedChunks = Math.ceil(file.size / chunkSize);
    const read = readableStream(file.stream().getReader(), chunkSize);
    const hash = await read.hash();
    expect(hash).toBe(file_hash.trim());
    expect(read.totalChunksStreamed()).toBe(expectedChunks);
  });

  test('should chunk data correctly for file2', async () => {
    const read = readableStream(file2.stream().getReader());
    expect(await read.hash()).toBe(file_2_hash.trim());
    expect(read.totalChunksStreamed()).toBe(21);
  });

  test('of file2 should not have the same hash as file1', async () => {
    const read = readableStream(file2.stream().getReader());
    expect(await read.hash()).not.toBe(file_hash.trim());
    expect(read.totalChunksStreamed()).toBe(21);
  });
});
