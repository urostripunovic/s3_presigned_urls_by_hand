import { HttpRequest } from "@aws-sdk/protocol-http";
import { S3RequestPresigner } from "@aws-sdk/s3-request-presigner";
import { fileChunk } from "./SharedData";
import { request_config } from "./ServerConfig";

const base_url = `${request_config.protocol}://${request_config.hostname}:${request_config.port}/poc/${request_config.path}`;

export class Server {
  readonly s3_signer: S3RequestPresigner;
  readonly request: HttpRequest;

  constructor(s3_signer: S3RequestPresigner, request: HttpRequest) {
    this.s3_signer = s3_signer;
    this.request = request; //Not practical uploadID is should be dependency injected
  }

  /**
  * Generates presigned URLs for uploading a file in multiple parts.
  * 
  * The number of presigned URLs is calculated by dividing the file size by the chunk size.
  *
  * @param {number} [fileSize] - The total file size (in bytes) to be uploaded. 
  * @param {number} [chunkSize=64*1024*1024] - The size of each chunk in bytes. Defaults to 64 MB if not provided or if invalid (less than or equal to 0).
  */
  async generatePresignedUrls({ fileSize, chunkSize }: { fileSize: number, chunkSize?: number }): Promise<URL[]> {
    const chunk = (!chunkSize || chunkSize <= 0) ? fileChunk : chunkSize;
    // const presigned = await this.s3_signer.presign(this.request);
    // const url_upload_id = `${base_url}?${buildQuery(presigned.query)}`; //used to fetch the real uploadID
    const uploadId = "1234"

    const fileParts = Math.ceil(fileSize / chunk);
    const presignedUrls = []
    for (let i = 1; i <= fileParts; i++) {
      const presigned = await this.s3_signer.presign(new HttpRequest({
        method: 'PUT',
        ...request_config,
        query: {
          partNumber: `${i}`,
          uploadId: uploadId
        },
      }));
      const url = new URL(base_url);
      Object.keys(presigned.query!).forEach(key => {
        url.searchParams.set(key, presigned.query![key]?.toString()!);
      });
      presignedUrls.push(url);
    }
    return presignedUrls;
  }
}
