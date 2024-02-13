const { join } = require('path');
const { exec } = require('child_process');
const { existsSync, readFileSync } = require('fs');
const mkdirp = require('mkdirp');

// Mapping from Node's `process.arch` to Golang's `$GOARCH`
const ARCH_MAPPING = {
  ia32: '386',
  x64: 'amd64',
  arm: 'arm',
  arm64: 'arm64'
};

// Mapping between Node's `process.platform` to Golang's
const PLATFORM_MAPPING = {
  darwin: 'macos',
  linux: 'linux',
  win32: 'windows',
  freebsd: 'freebsd'
};

// Mapping between Node's `process.platform` to extensions
const EXTENSION_MAPPING = {
  darwin: '.tar.gz',
  linux: '.tar.gz',
  win32: '.zip',
  freebsd: '.tar.gz'
};

function getInstallationPath(callback) {

  // `npm root' will output the node_modules directory
  exec(`npm root`, function(err, stdout, stderr) {
    let dir = null;
    if (err) {
      // We couldn't infer path from `npm root`.
      // Let's try to get it from env. Either we'll use
      // PWD or npm_config_prefix
      const env = process.env;
      if (env) {
        if (env.PWD) {
          dir = join(env.PWD, "node_modules", ".bin");
        } else if (env.npm_config_prefix) {
          dir = join(env.npm_config_prefix, "bin");
        }
      }
      if (dir === null) {
        return callback(
          new Error("Error finding binary installation directory")
        );
      }
    } else {
      dir = join(stdout.trim(), '.bin');
    }

    dir = dir.replace(/node_modules.*[\/\\]\.bin/, join('node_modules', '.bin'));
    mkdirp.sync(dir);
    callback(null, dir);
  });
}

function validateConfiguration({ version, goBinary }) {

  if (!version) {
    return "'version' property must be specified";
  }

  if (!goBinary || typeof (goBinary) !== 'object') {
    return "'goBinary' property must be defined and be an object";
  }

  if (!goBinary.name) {
    return "'name' property is necessary";
  }

  if (!goBinary.path) {
    return "'path' property is necessary";
  }

  if (!goBinary.url) {
    return "'url' property is required";
  }
}

function getUrl(url, process) {
  if (typeof url === 'string') {
    return url;
  }

  let _url;

  if (url[PLATFORM_MAPPING[process.platform]]) {
    _url = url[PLATFORM_MAPPING[process.platform]];
  } else {
    _url = url.default;
  }

  if (typeof _url === 'string') {
    return _url;
  }

  if (_url[ARCH_MAPPING[process.arch]]) {
    _url = _url[ARCH_MAPPING[process.arch]]
  } else {
    _url = _url.default;
  }

  return _url;
}

function parsePackageJson() {
  if (!(process.arch in ARCH_MAPPING)) {
    console.error('Installation is not supported for this architecture: ' + process.arch);
    return;
  }

  if (!(process.platform in PLATFORM_MAPPING)) {
    console.error('Installation is not supported for this platform: ' + process.platform);
    return
  }

  const packageJsonPath = join('.', 'package.json');
  if (!existsSync(packageJsonPath)) {
    console.error('Unable to find package.json. ' +
      'Please run this script at root of the package you want to be installed');
    return
  }

  const packageJson = JSON.parse(readFileSync(packageJsonPath));
  const error = validateConfiguration(packageJson);

  if (error && error.length > 0) {
    console.error('Invalid package.json: ' + error);
    return
  }

  // We have validated the config. It exists in all its glory
  const binPath = packageJson.goBinary.path;
  let binName = packageJson.goBinary.name;
  let url = getUrl(packageJson.goBinary.url, process);
  let version = packageJson.version;

  if (!url) {
    console.error('Could not find url matching platform and architecture');
    return
  }

  if (version[0] === 'v') version = version.substr(1);  // strip the 'v' if necessary v0.0.1 => 0.0.1

  // Binary name on Windows has .exe suffix
  if (process.platform === 'win32') {
    binName += '.exe'

    url = url.replace(/{{win_ext}}/g, '.exe');
  } else {
    url = url.replace(/{{win_ext}}/g, '');
  }

  // Interpolate variables in URL, if necessary
  url = url.replace(/{{arch}}/g, ARCH_MAPPING[process.arch]);
  url = url.replace(/{{platform}}/g, PLATFORM_MAPPING[process.platform]);
  url = url.replace(/{{version}}/g, version);
  url = url.replace(/{{bin_name}}/g, binName);
  url = url.replace(/{{package_ext}}/g, EXTENSION_MAPPING[process.platform]);

  return {
    binName,
    binPath,
    url,
    version
  };
}

module.exports = { parsePackageJson, getUrl, getInstallationPath };
