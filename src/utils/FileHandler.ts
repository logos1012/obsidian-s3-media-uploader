/**
 * FileHandler
 * Utility functions for file validation and formatting
 */

export class FileHandler {
	// Supported image formats
	private static readonly IMAGE_FORMATS = [
		'image/jpeg',
		'image/png',
		'image/gif',
		'image/bmp',
		'image/webp'
	];

	// Supported video formats
	private static readonly VIDEO_FORMATS = [
		'video/mp4',
		'video/quicktime',     // .mov
		'video/x-msvideo',     // .avi
		'video/x-matroska',    // .mkv
		'video/x-m4v',         // .m4v
		'video/webm'
	];

	// Maximum file size (500MB)
	private static readonly MAX_FILE_SIZE = 500 * 1024 * 1024;

	/**
	 * Validate if file is supported
	 */
	static validateFile(file: File): { valid: boolean; error?: string } {
		// Check file type
		const isImage = this.IMAGE_FORMATS.includes(file.type);
		const isVideo = this.VIDEO_FORMATS.includes(file.type);

		if (!isImage && !isVideo) {
			return {
				valid: false,
				error: `Unsupported file type: ${file.type}. Supported formats: JPEG, PNG, GIF, BMP, WebP, MP4, MOV, AVI, MKV, M4V, WebM`
			};
		}

		// Check file size
		if (file.size > this.MAX_FILE_SIZE) {
			return {
				valid: false,
				error: `File size exceeds maximum limit of ${this.formatFileSize(this.MAX_FILE_SIZE)}`
			};
		}

		return { valid: true };
	}

	/**
	 * Format file size in human-readable format
	 */
	static formatFileSize(bytes: number): string {
		if (bytes === 0) return '0 Bytes';

		const k = 1024;
		const sizes = ['Bytes', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));

		return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
	}

	/**
	 * Check if file is an image
	 */
	static isImage(file: File): boolean {
		return this.IMAGE_FORMATS.includes(file.type);
	}

	/**
	 * Check if file is a video
	 */
	static isVideo(file: File): boolean {
		return this.VIDEO_FORMATS.includes(file.type);
	}

	/**
	 * Get file extension from filename
	 */
	static getFileExtension(filename: string): string {
		const parts = filename.split('.');
		return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
	}

	/**
	 * Get file name without extension
	 */
	static getFileNameWithoutExtension(filename: string): string {
		const parts = filename.split('.');
		if (parts.length > 1) {
			return parts.slice(0, -1).join('.');
		}
		return filename;
	}

	/**
	 * Filter valid files from a list
	 */
	static filterValidFiles(files: File[]): { valid: File[]; invalid: Array<{ file: File; error: string }> } {
		const valid: File[] = [];
		const invalid: Array<{ file: File; error: string }> = [];

		files.forEach(file => {
			const validation = this.validateFile(file);
			if (validation.valid) {
				valid.push(file);
			} else {
				invalid.push({ file, error: validation.error || 'Unknown error' });
			}
		});

		return { valid, invalid };
	}
}
