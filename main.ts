import { App, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';
import { S3Uploader } from './src/api/S3Uploader';
import { CodeGenerator } from './src/utils/CodeGenerator';
import { FileHandler } from './src/utils/FileHandler';

// Settings interface
interface S3UploaderSettings {
	apiEndpoint: string;
	s3Bucket: string;
	awsRegion: string;
	enableProgressBar: boolean;
	autoInsertCode: boolean;
}

const DEFAULT_SETTINGS: S3UploaderSettings = {
	apiEndpoint: '',
	s3Bucket: '',
	awsRegion: 'ap-northeast-2',
	enableProgressBar: true,
	autoInsertCode: true
};

export default class S3UploaderPlugin extends Plugin {
	settings!: S3UploaderSettings;

	async onload() {
		await this.loadSettings();

		// Add ribbon icon
		this.addRibbonIcon('upload-cloud', 'Upload media to S3', () => {
			new UploadModal(this.app, this).open();
		});

		// Add command to open upload modal
		this.addCommand({
			id: 'upload-media-to-s3',
			name: 'Upload media to S3',
			callback: () => {
				new UploadModal(this.app, this).open();
			}
		});

		// Add settings tab
		this.addSettingTab(new S3UploaderSettingTab(this.app, this));

		console.log('S3 Media Uploader plugin loaded');
	}

	onunload() {
		console.log('S3 Media Uploader plugin unloaded');
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

// Upload Modal
class UploadModal extends Modal {
	plugin: S3UploaderPlugin;

	constructor(app: App, plugin: S3UploaderPlugin) {
		super(app);
		this.plugin = plugin;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass('s3-uploader-modal');

		// Title
		contentEl.createEl('h2', { text: 'Upload Media to S3' });

		// Dropzone
		const dropzone = contentEl.createDiv({ cls: 's3-dropzone' });
		dropzone.createEl('p', {
			text: 'Drag and drop files here',
			cls: 's3-dropzone-text'
		});
		dropzone.createEl('p', {
			text: 'or click to browse',
			cls: 's3-dropzone-hint'
		});

		// File input
		const fileInput = dropzone.createEl('input', {
			type: 'file',
			attr: {
				multiple: 'true',
				accept: 'image/*,video/*'
			}
		});

		// Click handler
		dropzone.addEventListener('click', () => {
			fileInput.click();
		});

		// Drag & Drop handlers
		dropzone.addEventListener('dragover', (e) => {
			e.preventDefault();
			dropzone.addClass('dragover');
		});

		dropzone.addEventListener('dragleave', () => {
			dropzone.removeClass('dragover');
		});

		dropzone.addEventListener('drop', (e) => {
			e.preventDefault();
			dropzone.removeClass('dragover');

			const files = e.dataTransfer?.files;
			if (files) {
				this.handleFiles(Array.from(files));
			}
		});

		// File input change handler
		fileInput.addEventListener('change', () => {
			if (fileInput.files) {
				this.handleFiles(Array.from(fileInput.files));
			}
		});

		// File list container
		const fileListContainer = contentEl.createDiv({ cls: 's3-file-list' });

		// Progress container
		const progressContainer = contentEl.createDiv({ cls: 's3-progress-container' });
		const progressBar = progressContainer.createDiv({ cls: 's3-progress-bar' });
		const progressFill = progressBar.createDiv({ cls: 's3-progress-fill' });
		progressFill.setText('0%');
		const progressText = progressContainer.createDiv({
			cls: 's3-progress-text',
			text: 'Ready to upload'
		});

		// Buttons
		const buttonGroup = contentEl.createDiv({ cls: 's3-button-group' });

		const cancelButton = buttonGroup.createEl('button', {
			text: 'Cancel',
			cls: 's3-button s3-button-secondary'
		});
		cancelButton.addEventListener('click', () => {
			this.close();
		});

		const uploadButton = buttonGroup.createEl('button', {
			text: 'Upload',
			cls: 's3-button s3-button-primary'
		});
		uploadButton.disabled = true;
		uploadButton.addEventListener('click', async () => {
			await this.uploadFiles();
		});

		// Store references for later use
		(this as any).fileListContainer = fileListContainer;
		(this as any).progressContainer = progressContainer;
		(this as any).progressFill = progressFill;
		(this as any).progressText = progressText;
		(this as any).uploadButton = uploadButton;
		(this as any).selectedFiles = [];
	}

	handleFiles(files: File[]) {
		// Validate files using FileHandler
		const { valid, invalid } = FileHandler.filterValidFiles(files);

		if (invalid.length > 0) {
			invalid.forEach(({ file, error }) => {
				new Notice(`${file.name}: ${error}`);
			});
		}

		if (valid.length === 0) {
			new Notice('No valid files selected');
			return;
		}

		// Store selected files
		(this as any).selectedFiles = valid;

		// Update file list UI
		const fileListContainer = (this as any).fileListContainer;
		fileListContainer.empty();

		valid.forEach(file => {
			const fileItem = fileListContainer.createDiv({ cls: 's3-file-item' });
			fileItem.createSpan({
				text: file.name,
				cls: 's3-file-name'
			});
			fileItem.createSpan({
				text: this.formatFileSize(file.size),
				cls: 's3-file-size'
			});
		});

		// Enable upload button
		(this as any).uploadButton.disabled = false;
	}

	async uploadFiles() {
		const files: File[] = (this as any).selectedFiles;
		if (files.length === 0) {
			new Notice('No files selected');
			return;
		}

		const progressContainer = (this as any).progressContainer;
		const progressFill = (this as any).progressFill;
		const progressText = (this as any).progressText;
		const uploadButton = (this as any).uploadButton;

		// Show progress
		progressContainer.addClass('active');
		uploadButton.disabled = true;

		// Initialize S3Uploader and CodeGenerator
		const uploader = new S3Uploader(this.plugin.settings.apiEndpoint);
		const codeGenerator = new CodeGenerator();

		const uploadedCodes: string[] = [];

		try {
			for (let i = 0; i < files.length; i++) {
				const file = files[i];

				// Upload file with progress tracking
				const presignData = await uploader.uploadFile(file, (stage, progress) => {
					// Map progress to overall progress for this file
					const fileStartProgress = (i / files.length) * 100;
					const fileEndProgress = ((i + 1) / files.length) * 100;
					const fileProgress = fileStartProgress + (progress / 100) * (fileEndProgress - fileStartProgress);

					progressFill.style.width = `${fileProgress}%`;
					progressFill.setText(`${Math.round(fileProgress)}%`);
					progressText.setText(`${stage} - ${file.name} (${i + 1}/${files.length})`);
				});

				// Generate HTML embed code
				const htmlCode = codeGenerator.generate(file, presignData.file_url);
				uploadedCodes.push(htmlCode);

				console.log(`Uploaded: ${file.name} -> ${presignData.file_url}`);
			}

			progressText.setText('Upload completed!');
			progressFill.style.width = '100%';
			progressFill.setText('100%');

			// Auto-insert code if enabled
			if (this.plugin.settings.autoInsertCode && uploadedCodes.length > 0) {
				this.insertCodesToEditor(uploadedCodes);
			}

			new Notice(`Successfully uploaded ${files.length} file(s)!`);

			// Close modal after 1.5 seconds
			setTimeout(() => this.close(), 1500);

		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
		new Notice(`Upload failed: ${errorMessage}`);
			console.error('Upload error:', error);
			uploadButton.disabled = false;
			progressContainer.removeClass('active');
		}
	}

	/**
	 * Insert HTML codes to the active editor
	 */
	insertCodesToEditor(codes: string[]) {
		const editor = this.app.workspace.activeEditor?.editor;
		if (!editor) {
			new Notice('No active editor found');
			return;
		}

		console.log(`Inserting ${codes.length} codes to editor`);
		console.log(`Codes array:`, codes);

		const cursor = editor.getCursor();
		const codeBlock = codes.join('\n\n');

		console.log(`Joined codeBlock length: ${codeBlock.length} characters`);
		console.log(`CodeBlock preview:`, codeBlock.substring(0, 200));

		editor.replaceRange(codeBlock + '\n\n', cursor);

		new Notice(`HTML code inserted to editor (${codes.length} files)`);
	}

	formatFileSize(bytes: number): string {
		if (bytes === 0) return '0 Bytes';
		const k = 1024;
		const sizes = ['Bytes', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

// Settings Tab
class S3UploaderSettingTab extends PluginSettingTab {
	plugin: S3UploaderPlugin;

	constructor(app: App, plugin: S3UploaderPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		containerEl.createEl('h2', { text: 'S3 Media Uploader Settings' });

		new Setting(containerEl)
			.setName('API Endpoint')
			.setDesc('AWS API Gateway endpoint URL')
			.addText(text => text
				.setPlaceholder('https://...')
				.setValue(this.plugin.settings.apiEndpoint)
				.onChange(async (value) => {
					this.plugin.settings.apiEndpoint = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('S3 Bucket')
			.setDesc('AWS S3 bucket name')
			.addText(text => text
				.setPlaceholder('my-bucket')
				.setValue(this.plugin.settings.s3Bucket)
				.onChange(async (value) => {
					this.plugin.settings.s3Bucket = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('AWS Region')
			.setDesc('AWS region (e.g., ap-northeast-2)')
			.addText(text => text
				.setPlaceholder('ap-northeast-2')
				.setValue(this.plugin.settings.awsRegion)
				.onChange(async (value) => {
					this.plugin.settings.awsRegion = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Enable Progress Bar')
			.setDesc('Show upload progress')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.enableProgressBar)
				.onChange(async (value) => {
					this.plugin.settings.enableProgressBar = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Auto Insert Code')
			.setDesc('Automatically insert HTML embed code after upload')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.autoInsertCode)
				.onChange(async (value) => {
					this.plugin.settings.autoInsertCode = value;
					await this.plugin.saveSettings();
				}));
	}
}
