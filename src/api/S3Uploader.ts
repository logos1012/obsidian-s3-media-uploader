/**
 * S3Uploader
 * Handles file uploads to AWS S3 using presigned URLs
 */

export interface PresignedUrlResponse {
	success: boolean;
	upload_url: string;
	s3_key: string;
	file_url: string;
	content_type: string;
	expires_in: number;
	filename: string;
	metadata: {
		source: string;
		'file-hash': string;
		'original-filename': string;
	};
	error?: string;
}

export interface UploadCompleteRequest {
	s3Key: string;
	fileUrl: string;
	originalFilename: string;
	source: string;
}

export class S3Uploader {
	private apiEndpoint: string;

	constructor(apiEndpoint: string) {
		this.apiEndpoint = apiEndpoint;
	}

	/**
	 * Request a presigned URL from the API
	 */
	async requestPresignedUrl(file: File): Promise<PresignedUrlResponse> {
		const response = await fetch(`${this.apiEndpoint}/presign`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				filename: file.name,
				mimeType: file.type,
				source: 'obsidian'
			})
		});

		if (!response.ok) {
			throw new Error(`Failed to get presigned URL: ${response.status} ${response.statusText}`);
		}

		const data = await response.json();

		if (!data.success) {
			throw new Error(data.error || 'Unknown error from API');
		}

		return data;
	}

	/**
	 * Upload file to S3 using presigned URL with progress tracking
	 */
	async uploadToS3(
		file: File,
		presignedUrl: string,
		presignData: PresignedUrlResponse,
		onProgress: (progress: number) => void
	): Promise<void> {
		return new Promise<void>((resolve, reject) => {
			const xhr = new XMLHttpRequest();

			// Track upload progress
			xhr.upload.addEventListener('progress', (e) => {
				if (e.lengthComputable) {
					const progress = (e.loaded / e.total) * 100;
					onProgress(progress);
				}
			});

			// Handle successful upload
			xhr.addEventListener('load', () => {
				if (xhr.status === 200) {
					resolve();
				} else {
					reject(new Error(`Upload failed with status: ${xhr.status}`));
				}
			});

			// Handle upload error
			xhr.addEventListener('error', () => {
				reject(new Error('Network error during upload'));
			});

			// Handle upload cancellation
			xhr.addEventListener('abort', () => {
				reject(new Error('Upload cancelled'));
			});

			// Start upload
			xhr.open('PUT', presignedUrl);
			xhr.setRequestHeader('Content-Type', presignData.content_type);

			// Set required metadata headers for S3 presigned URL
			// Use the exact metadata values from Lambda to match the signature
			xhr.setRequestHeader('x-amz-meta-source', presignData.metadata.source);
			xhr.setRequestHeader('x-amz-meta-file-hash', presignData.metadata['file-hash']);
			xhr.setRequestHeader('x-amz-meta-original-filename', presignData.metadata['original-filename']);

			xhr.send(file);
		});
	}

	/**
	 * Notify the backend that upload is complete
	 */
	async notifyUploadComplete(presignData: PresignedUrlResponse): Promise<void> {
		const request: UploadCompleteRequest = {
			s3Key: presignData.s3_key,
			fileUrl: presignData.file_url,
			originalFilename: presignData.filename,
			source: 'obsidian'
		};

		const response = await fetch(`${this.apiEndpoint}/upload-complete`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(request)
		});

		if (!response.ok) {
			throw new Error(`Failed to notify upload complete: ${response.status}`);
		}

		const data = await response.json();

		if (!data.success) {
			throw new Error(data.error || 'Upload notification failed');
		}
	}

	/**
	 * Wait for WebP conversion to complete
	 * Polls the WebP URL until it's available or timeout
	 */
	async waitForWebP(
		webpUrl: string,
		maxAttempts: number = 30,
		intervalMs: number = 1000
	): Promise<boolean> {
		for (let i = 0; i < maxAttempts; i++) {
			try {
				// Check if WebP file exists using HEAD request
				const response = await fetch(webpUrl, { method: 'HEAD' });
				if (response.ok) {
					return true; // WebP file is ready
				}
			} catch (error) {
				// Continue polling on error
			}

			// Wait before next attempt
			if (i < maxAttempts - 1) {
				await new Promise(resolve => setTimeout(resolve, intervalMs));
			}
		}

		return false; // Timeout - WebP not ready
	}

	/**
	 * Convert image URL to WebP URL
	 */
	convertToWebpUrl(url: string): string {
		return url.replace(/\.(jpg|jpeg|png|gif|bmp)$/i, '.webp');
	}

	/**
	 * Complete upload workflow: request URL, upload file, notify completion
	 */
	async uploadFile(
		file: File,
		onProgress: (stage: string, progress: number) => void
	): Promise<PresignedUrlResponse> {
		// Step 1: Request presigned URL
		onProgress('Requesting upload URL...', 10);
		const presignData = await this.requestPresignedUrl(file);

		// Step 2: Upload to S3
		onProgress('Uploading to S3...', 20);
		await this.uploadToS3(file, presignData.upload_url, presignData, (uploadProgress) => {
			// Map S3 upload progress to overall progress (20% - 80%)
			const overallProgress = 20 + (uploadProgress * 0.6);
			onProgress('Uploading to S3...', overallProgress);
		});

		// Step 3: Notify backend
		onProgress('Processing...', 80);
		await this.notifyUploadComplete(presignData);

		// Step 4: Wait for WebP conversion (images only)
		const isImage = file.type.startsWith('image/');
		if (isImage) {
			onProgress('Converting to WebP...', 85);
			const webpUrl = this.convertToWebpUrl(presignData.file_url);
			const webpReady = await this.waitForWebP(webpUrl, 30, 1000);

			if (webpReady) {
				// Update file_url to WebP URL
				presignData.file_url = webpUrl;
			}
			// If WebP not ready, keep original URL
		}

		onProgress('Complete', 100);

		return presignData;
	}
}
