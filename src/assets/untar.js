const tar = require("tar");

/**
 * Unzip strategy for resources using `.tar.gz`.
 *
 * First we will Un-GZip, then we will untar. So once untar is completed,
 * binary is downloaded into `binPath`. Verify the binary and call it good.
 */
function untar({ opts, req, onSuccess, onError }) {
  const pipe = req.pipe(tar.x({ cwd: opts.binPath }));
  pipe.on("error", onError);
  pipe.on("finish", onSuccess);
}

module.exports = untar;
