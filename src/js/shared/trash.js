const fs = require('fs')
const path = require('path')
const { shell } = require('electron')

// Drop-in replacement for the `trash` npm package, backed by Electron's
// shell.trashItem (Electron >= 13).
//
// The `trash` package ships a prebuilt x86_64-only `macos-trash` helper
// binary, which needs Rosetta on Apple Silicon. shell.trashItem is native
// on every architecture Electron runs on.
//
// Mirrors the parts of the `trash` API we use:
// - accepts a single path or an array of paths
// - silently ignores paths that don't exist
// - resolves relative paths against the cwd
//
// Works in both the main and renderer processes.
const trash = async paths => {
  paths = (typeof paths === 'string' ? [paths] : paths).map(p => String(p))

  for (let filePath of paths) {
    try {
      await fs.promises.lstat(filePath)
    } catch (err) {
      if (err.code === 'ENOENT') continue
      throw err
    }

    await shell.trashItem(path.resolve(filePath))
  }
}

module.exports = trash
