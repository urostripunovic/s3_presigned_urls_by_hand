const fileChunk = 64 * 1024 * 1024;
const file = Bun.file('./1GB_text_file.txt')
const fileName = file.name;
const fileSize = file.size

export { fileChunk, file, fileName, fileSize };
