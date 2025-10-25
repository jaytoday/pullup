# Example Documentation Folder

This folder demonstrates using a documentation folder with PullUp.

Place any text or markdown files in here, and PullUp will read them all recursively.

## Usage

```bash
node execute.js --name myapp --docs ./examples/docs-folder
```

PullUp will:
1. Read all `.txt`, `.md`, `.markdown` files in this folder and subfolders
2. Extract URLs, credentials, page paths, and features
3. Use this information to guide exploration
4. Generate a more informed testing skill
