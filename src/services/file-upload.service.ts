import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);

@Injectable()
export class FileUploadService {
  private readonly uploadPath: string;
  private readonly maxFileSize: number = 5 * 1024 * 1024; // 5MB in bytes
  private readonly allowedMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
  ];

  constructor(private readonly configService: ConfigService) {
    // Get upload path from environment or use default
    this.uploadPath =
      this.configService.get<string>('FILE_STORAGE_PATH') ||
      path.join(process.cwd(), 'uploads', 'quiz-images');

    // Ensure upload directory exists
    this.ensureUploadDirectory();
  }

  private async ensureUploadDirectory(): Promise<void> {
    try {
      if (!fs.existsSync(this.uploadPath)) {
        await mkdir(this.uploadPath, { recursive: true });
      }
    } catch (error) {
      console.error('Failed to create upload directory:', error);
    }
  }

  /**
   * Validate image file
   */
  validateImage(
    fileBuffer: Buffer,
    mimeType: string,
    originalName: string,
  ): void {
    // Check file size
    if (fileBuffer.length > this.maxFileSize) {
      throw new BadRequestException(
        `Ukuran file terlalu besar. Maksimal ${this.maxFileSize / (1024 * 1024)}MB`,
      );
    }

    // Check MIME type
    if (!this.allowedMimeTypes.includes(mimeType)) {
      throw new BadRequestException(
        `Tipe file tidak didukung. Hanya menerima: ${this.allowedMimeTypes.join(', ')}`,
      );
    }

    // Check file extension
    const ext = path.extname(originalName).toLowerCase();
    const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    if (!validExtensions.includes(ext)) {
      throw new BadRequestException(
        `Ekstensi file tidak valid. Hanya menerima: ${validExtensions.join(', ')}`,
      );
    }
  }

  /**
   * Generate unique filename
   */
  generateFileName(originalName: string, prefix: string = 'img'): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const ext = path.extname(originalName).toLowerCase();
    const sanitizedPrefix = prefix.replace(/[^a-z0-9]/gi, '_');

    return `${sanitizedPrefix}_${timestamp}_${random}${ext}`;
  }

  /**
   * Save image file to storage
   */
  async saveImage(
    fileBuffer: Buffer,
    originalName: string,
    mimeType: string,
    prefix: string = 'quiz',
  ): Promise<{
    fileName: string;
    filePath: string;
    fileSize: number;
    mimeType: string;
    originalName: string;
  }> {
    // Validate image
    this.validateImage(fileBuffer, mimeType, originalName);

    // Generate unique filename
    const fileName = this.generateFileName(originalName, prefix);
    const filePath = path.join(this.uploadPath, fileName);
    const relativePath = path.join('uploads', 'quiz-images', fileName);

    try {
      // Save file to disk
      await writeFile(filePath, fileBuffer);

      return {
        fileName,
        filePath: relativePath.replace(/\\/g, '/'), // Normalize path separators
        fileSize: fileBuffer.length,
        mimeType,
        originalName,
      };
    } catch (error) {
      throw new BadRequestException(`Gagal menyimpan file: ${error.message}`);
    }
  }

  /**
   * Delete image file from storage
   */
  async deleteImage(filePath: string): Promise<void> {
    try {
      const fullPath = path.join(process.cwd(), filePath);
      if (fs.existsSync(fullPath)) {
        await promisify(fs.unlink)(fullPath);
      }
    } catch (error) {
      console.error('Failed to delete file:', error);
      // Don't throw error, just log it
    }
  }

  /**
   * Decode base64 image
   */
  decodeBase64Image(base64String: string): {
    buffer: Buffer;
    mimeType: string;
  } {
    // Check if it's a data URI
    const matches = base64String.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);

    if (matches && matches.length === 3) {
      // Data URI format: data:image/png;base64,iVBORw0KG...
      return {
        buffer: Buffer.from(matches[2], 'base64'),
        mimeType: matches[1],
      };
    } else {
      // Plain base64 string (assume JPEG)
      return {
        buffer: Buffer.from(base64String, 'base64'),
        mimeType: 'image/jpeg',
      };
    }
  }

  /**
   * Upload image from base64 string
   */
  async uploadFromBase64(
    base64String: string,
    originalName: string = 'image.jpg',
    prefix: string = 'quiz',
  ): Promise<{
    fileName: string;
    filePath: string;
    fileSize: number;
    mimeType: string;
    originalName: string;
  }> {
    const { buffer, mimeType } = this.decodeBase64Image(base64String);
    return this.saveImage(buffer, originalName, mimeType, prefix);
  }

  /**
   * Get full URL for file access
   */
  getFileUrl(filePath: string): string {
    const fileServerUrl =
      this.configService.get<string>('FILE_SERVER_URL') ||
      this.configService.get<string>('BACKEND_URL');
    return `${fileServerUrl}/${filePath}`;
  }
}
