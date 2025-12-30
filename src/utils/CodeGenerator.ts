/**
 * CodeGenerator
 * Generates HTML embed code for images and videos
 */

export class CodeGenerator {
	/**
	 * Generate HTML embed code based on file type
	 */
	generate(file: File, s3Url: string): string {
		const isVideo = file.type.startsWith('video/');

		if (isVideo) {
			return this.generateVideoCode(s3Url, file.type);
		} else {
			return this.generateImageCode(s3Url);
		}
	}

	/**
	 * Generate HTML code for images
	 * Images are converted to WebP format by the backend Lambda
	 */
	private generateImageCode(s3Url: string): string {
		// Convert URL to WebP format
		const webpUrl = this.convertToWebpUrl(s3Url);

		return `<div style='text-align:center;'><img src='${webpUrl}' alt='' style='max-width:100%; height:auto;'></div>`;
	}

	/**
	 * Generate HTML code for videos
	 */
	private generateVideoCode(s3Url: string, mimeType: string): string {
		return `<video width="800" height="450" controls>
  <source src="${s3Url}" type="${mimeType}">
</video>`;
	}

	/**
	 * Convert image URL to WebP format
	 * Example: uploads/251230_123456_abc123.jpg -> uploads/251230_123456_abc123.webp
	 */
	private convertToWebpUrl(url: string): string {
		return url.replace(/\.(jpg|jpeg|png|gif|bmp)$/i, '.webp');
	}

	/**
	 * Get file extension from filename
	 */
	getFileExtension(filename: string): string {
		const parts = filename.split('.');
		return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
	}

	/**
	 * Check if file is an image
	 */
	isImage(file: File): boolean {
		return file.type.startsWith('image/');
	}

	/**
	 * Check if file is a video
	 */
	isVideo(file: File): boolean {
		return file.type.startsWith('video/');
	}
}
