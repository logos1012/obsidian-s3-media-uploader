# Obsidian Media Contents Manager in S3

Upload media files (images and videos) from Obsidian to AWS S3 with automatic WebP conversion and Airtable integration.

## Features

- **Easy Upload**: Drag & drop or click to upload multiple files at once
- **Ribbon Button**: Quick access via left sidebar cloud icon
- **Progress Tracking**: Real-time upload progress for each file
- **Auto Code Insertion**: Automatically insert HTML embed code after upload
- **WebP Conversion**: Automatic WebP conversion for images (backend)
- **Metadata Tracking**: All uploads tracked in Airtable
- **Multiple File Support**: Upload multiple files simultaneously

## Installation

### From GitHub Releases

1. Download the latest release from [Releases](../../releases)
2. Extract the files to your Obsidian plugins folder:
   - Windows: `%APPDATA%\Obsidian\<vault-name>\.obsidian\plugins\s3-media-uploader\`
   - macOS: `<vault-path>/.obsidian/plugins/s3-media-uploader/`
   - Linux: `<vault-path>/.obsidian/plugins/s3-media-uploader/`
3. Reload Obsidian
4. Enable the plugin in Settings → Community plugins

### Manual Installation

1. Clone this repository
2. Run `npm install` to install dependencies
3. Run `npm run build` to build the plugin
4. Copy `main.js`, `manifest.json`, and `styles.css` to your vault's `.obsidian/plugins/s3-media-uploader/` folder

## Setup

After installation, configure the plugin in **Settings → S3 Media Uploader**.

See [SETUP.md](./SETUP.md) for detailed setup instructions including:
- AWS API Gateway endpoint configuration
- S3 bucket setup
- Required AWS region settings

## Usage

### Method 1: Ribbon Icon
Click the **cloud upload icon** in the left sidebar to open the upload dialog.

### Method 2: Command Palette
1. Press `Ctrl/Cmd + P` to open the command palette
2. Type "Upload media to S3"
3. Press Enter to open the upload dialog

### Uploading Files
1. **Drag & drop** files into the upload area, or **click** to browse
2. Select one or more files (images or videos)
3. Click **Upload**
4. HTML embed code will be automatically inserted into your active note

## Supported File Formats

- **Images**: `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`, `.bmp`
- **Videos**: `.mp4`, `.webm`, `.ogg`, `.mov`, `.avi`

**Maximum file size**: 500MB

## Backend Infrastructure

This plugin integrates with the following AWS services:

- **API Gateway**: Presigned URL generation and upload notifications
- **Lambda Functions**:
  - `post-img-upload-presign`: Generate S3 presigned URLs
  - `post-img-upload-convert-webp`: Convert images to WebP format
- **S3**: Media file storage
- **SQS FIFO Queue**: WebP conversion job queue
- **Airtable**: Upload metadata storage

## Configuration Options

| Setting | Description | Default |
|---------|-------------|---------|
| **API Endpoint** | AWS API Gateway URL | (empty - must configure) |
| **S3 Bucket** | AWS S3 bucket name | (empty - must configure) |
| **AWS Region** | AWS region | `ap-northeast-2` |
| **Enable Progress Bar** | Show upload progress | ON |
| **Auto Insert Code** | Auto-insert HTML after upload | ON |

## Troubleshooting

### API Endpoint Error
- Verify your API Gateway URL is correct in settings
- Ensure Lambda functions are deployed

### Upload Failed (403 Forbidden)
- Check S3 bucket name is correct
- Verify Lambda IAM permissions are properly configured
- Ensure presigned URL metadata headers match

### Code Not Inserted
- Ensure "Auto Insert Code" is enabled in settings
- Make sure an editor is active when uploading

## Development

```bash
# Install dependencies
npm install

# Build the plugin
npm run build

# Watch for changes (development)
npm run dev
```

### Project Structure

```
obsidian-s3-uploader/
├── main.ts                  # Plugin entry point
├── manifest.json            # Plugin metadata
├── styles.css               # Plugin styles
├── src/
│   ├── api/
│   │   └── S3Uploader.ts   # S3 upload logic
│   └── utils/
│       ├── CodeGenerator.ts # HTML code generation
│       └── FileHandler.ts   # File validation
├── package.json
├── tsconfig.json
└── esbuild.config.mjs
```

## License

MIT License

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Author

Built with AWS Lambda, S3, and Airtable integration.
