const unzipStream = require('unzip-stream');

/**
 * Unzip strategy for resources using `.zip`.
 *
 * Once unzip is completed, binary is downloaded into `binPath`.
 * Verify the binary and call it good.
 */
function unzip({ opts, req, onSuccess, onError }) {

  const unzip = unzipStream.Extract({ path: opts.binPath });

  unzip.on('error', onError);
  unzip.on('close', onSuccess);

  req.pipe(unzip);
}

module.exports = unzip;
