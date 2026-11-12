# Heavy asset storage and restoration

## Start here

Heavy production sources live in the **private Google Drive archive**:

https://drive.google.com/drive/folders/1PsC5KGXSNGwIFF0TBlI-fuSA2y4PATaG

Folder: `2026-11-11_c58afb8_merged-assets`.
Original repository: https://github.com/naufaldi/echoes-below
Original source commit: `c58afb8e848e396333490ff9e698d30bc5d5173b` (merged PR #150).

The archive preserves every tracked `output/` file from that commit: versioned character and equipment sources, Tripo exports, textures, reference images, the saved Blender file, scripts, manifests, handoff notes and production evidence. Failed or invalid evidence retains its original labels. It also includes selected runtime character references and project context. It is not a new licence grant or production-art approval.

## Access

The folder and files are private to the owner's Google Drive account. A repository or public game link does **not** grant Drive access. Use the owner's connected Google Drive account when authorized. If access is unavailable, ask the owner for access or the specific files; do not make the folder public, upload it elsewhere, regenerate assets, or change sharing as a workaround.

The folder contains these entry points:

- `README-RESTORE.md`: archive contents, restoration steps and limitations.
- `ASSET-MANIFEST.json`: every original repository-relative path, archive name, byte size and SHA-256.
- `SHA256SUMS.txt`: checksums for all 22 ZIP archives.
- `UPLOAD-RECEIPTS.json`: uploaded archive identities and verification records.

## Pick the right archive

- Elf Rogue V6c: `characters_elf-rogue-v1.zip`. Includes `output/characters/elf-rogue-v1/animation-v6c/elf-rogue-weapon-fix.blend`, its GLB, original exports and validation evidence.
- Elf Female V1: `characters_elf-female-v1.zip`.
- Elf Female V2 Studio 8000: all 14 `characters_elf-female-v2-studio-8000_part-NN.zip` files for a complete version.
- Elf Fighter V1: all three `characters_elf-fighter-v1_part-NN.zip` files.
- Fighter equipment: `equipment_elf-fighter-v1.zip`.
- Project and preview handoffs: `archive_context.zip`.
- Prior runtime character references and existing licence files: `reference_runtime_characters.zip`.

Use `ASSET-MANIFEST.json` to find the ZIP for any exact path. Each ZIP is independently extractable. Numbered parts are separate standard ZIP files, not split-volume segments; do not concatenate them.

## Restore safely

1. Read `README-RESTORE.md` and download `ASSET-MANIFEST.json`, `SHA256SUMS.txt` and only the ZIPs needed. Keep downloads outside the checkout and public web directories.
2. Verify each downloaded ZIP against `SHA256SUMS.txt` before extraction. With all ZIPs present, run `sha256sum -c SHA256SUMS.txt` on Linux or `shasum -a 256 -c SHA256SUMS.txt` on macOS. For a partial download, verify the selected entries only; missing unrelated ZIPs do not mean your chosen ZIP is corrupt.
3. Extract into a fresh temporary directory first. Extract all chosen parts into the **same** directory, preserving the stored paths. Do not overwrite an active checkout with archived context or runtime references.
4. Check restored files against the size and SHA-256 in `ASSET-MANIFEST.json`. Copy only the required, verified `output/` subtree into the checkout root. This recreates paths such as `output/characters/elf-rogue-v1/animation-v6c/`.
5. For reproducible asset work, start from original GitHub commit `c58afb8e848e396333490ff9e698d30bc5d5173b`. For a later checkout, review differences before applying archived context. GitHub's original commits and history have not been rewritten.
6. Read the asset's own README and [Rogue V6c handoff](ELF-ROGUE-V6C-HANDOFF.md) before running Blender or a local preview. `npm run rogue:prepare` requires the restored V6c GLB; the ordinary production build does not.

Preserve original sources when making optimized variants. New versions should retain repository-relative `output/` structure, provenance, checksums and clear status in their private Drive archive. Do not overwrite this dated snapshot or claim a new version has been backed up until its authorized upload and checksums are verified.

## Deployment source and safety

The lightweight Sites source snapshot takes the game source from GitHub commit `c58afb8e848e396333490ff9e698d30bc5d5173b`, with the heavy `output/` tree omitted except its handoff README. It adds these storage instructions and an ignore rule. It is based on the existing Site source `9f132c78c58f618d7b13dcafd9e552baa6a35048`; it does not import the heavy archive's Git history, replace GitHub history, or change the Site's identity.

All runtime code, configuration and `public/assets/` bytes remain those of the original GitHub commit. The normal build includes the existing approved runtime assets and works without Drive access. Drive is source storage, not a game asset CDN. Documentation and Drive links belong in source, never in `public/` or the deployment bundle.

The development-only Rogue model is **not** the production default. Preserve the DEV/localhost gates and `scripts/elf-rogue-preview.mjs guard`. After local preview use `npm run rogue:clean`; never bypass the build guard or publish `public/__elf-rogue-preview.glb` / `public/__rogue-combat-fixture.json`. Production replacement still requires licence, manifest, budget, integration and owner approval. The original licensing limitations remain in force.

GitHub still contains its original archived assets and history. This storage change does not delete those records. `.gitignore` prevents new/restored untracked heavy files from entering Sites source; it does not untrack existing GitHub files. Do not force-add heavy files or merge the archive-bearing GitHub history into the lightweight Sites branch.
