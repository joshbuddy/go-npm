const mkdirp = require("mkdirp");
const { getUri } = require("get-uri");
const { parsePackageJson } = require("../common");
const verifyAndPlaceBinary = require("../assets/binary");

/**
 * Select a resource handling strategy based on given options.
 */
function getStrategy(url) {
  if (url.endsWith(".tar.gz")) {
    return require("../assets/untar");
  } else if (url.endsWith(".zip")) {
    return require("../assets/unzip");
  } else {
    return require("../assets/move");
  }
}

/**
 * Reads the configuration from application's package.json,
 * validates properties, downloads the binary, untars, and stores at
 * ./bin in the package's root. NPM already has support to install binary files
 * specific locations when invoked with "npm install -g"
 *
 *  See: https://docs.npmjs.com/files/package.json#bin
 */
function install(callback) {
  const opts = parsePackageJson();
  if (!opts) return callback("Invalid inputs");

  mkdirp.sync(opts.binPath);

  console.log("Downloading from URL: " + opts.url);

  getUri(opts.url)
    .then((stream) => {
      const strategy = getStrategy(opts.url);
      strategy({
        opts,
        req: stream,
        onSuccess: () =>
          verifyAndPlaceBinary(opts.binName, opts.binPath, callback),
        onError: callback,
      });
    })
    .catch(callback);
}

module.exports = install;
