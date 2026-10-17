const fs = require('fs')
const path = require('path')
const { spawnSync } = require('child_process')

// electron-builder `beforeBuild` hook, run once per target platform/arch.
//
// ffmpeg-static downloads a single ffmpeg binary at install time, picking the
// platform/arch from `npm_config_platform` / `npm_config_arch` (falling back
// to the host). When building for an arch other than the host (e.g. an x64
// build on an Apple Silicon Mac, or vice versa) we need to swap that binary
// for the target arch before packaging.
//
// Returning `true` lets electron-builder carry on with its usual native
// module rebuild. node_modules is left in place, so a locally installed
// electron-builder keeps working.
exports.default = async function beforeBuild (context) {
  console.log('  + scripts/electron-builder-before-build.js')

  const { appDir, platform, arch } = context
  const targetPlatform = platform.nodeName

  const pkgDir = path.join(appDir, 'node_modules', 'ffmpeg-static')
  const binaryPath = path.join(pkgDir, targetPlatform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg')

  if (!fs.existsSync(pkgDir)) {
    throw new Error(`ffmpeg-static is not installed in ${pkgDir}. Run npm install first.`)
  }

  console.log(`      • fetching ffmpeg for ${targetPlatform}-${arch}`)

  // ffmpeg-static's install script is a no-op when a binary already exists
  for (const file of [binaryPath, `${binaryPath}.README`, `${binaryPath}.LICENSE`]) {
    if (fs.existsSync(file)) fs.rmSync(file)
  }

  const result = spawnSync(process.execPath, ['install.js'], {
    cwd: pkgDir,
    stdio: 'inherit',
    env: {
      ...process.env,
      npm_config_platform: targetPlatform,
      npm_config_arch: arch
    }
  })

  if (result.status !== 0) {
    throw new Error(`ffmpeg-static install failed for ${targetPlatform}-${arch} (exit code ${result.status})`)
  }

  return true
}
