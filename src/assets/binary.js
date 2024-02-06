const { join } = require("path");
const { chmodSync, copyFileSync, existsSync, unlink } = require("fs");
const { getInstallationPath } = require("../common");
const fs = require("fs");

function verifyAndPlaceBinary(binName, binPath, callback) {
  console.log(binPath, fs.readdirSync(binPath));

  if (!existsSync(join(binPath, binName))) {
    return callback(
      `Downloaded binary does not contain the binary specified in configuration - ${binName}`
    );
  }

  getInstallationPath((err, installationPath) => {
    if (err) {
      return callback(err);
    }

    // Move the binary file and make sure it is executable
    copyFileSync(join(binPath, binName), join(installationPath, binName));
    //unlink(join(binPath, binName));
    chmodSync(join(installationPath, binName), "755");

    console.log("Placed binary on", join(installationPath, binName));

    callback(null);
  });
}

module.exports = verifyAndPlaceBinary;
