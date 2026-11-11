# Heavy asset sources are on Google Drive

The hosted source snapshot intentionally omits the heavy production archives from this directory. They are preserved in the [private Google Drive folder](https://drive.google.com/drive/folders/1PsC5KGXSNGwIFF0TBlI-fuSA2y4PATaG).

Start with [asset storage and restoration](../docs/ASSET-STORAGE.md) for access, archive names, checksums and the original GitHub commit. Restore only the needed version into its original `output/` path for local work. The regular game build uses `public/assets/` and does not require this archive or Drive access.

Do not regenerate missing assets, force-add the archive to Sites Git, make it public, or promote the Rogue prototype to production merely because these files are absent.
