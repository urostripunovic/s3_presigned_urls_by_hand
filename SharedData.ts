const fileChunk = 64 * 1024 * 1024;
const file = Bun.file('./1GB_text_file.txt')
const file2 = Bun.file('./1GB_text_file2.txt')
const fileName = file.name;
const fileSize = file.size

export { fileChunk, file, file2, fileName, fileSize };
