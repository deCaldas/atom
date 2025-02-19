const fs = require('@npmcli/fs');
const path = require('path');

const hasWriteAccess = dir => {
  const testFilePath = path.join(dir, 'write.test');
  try {
    fs.writeFileSync(testFilePath, new Date().toISOString(), { flag: 'w+' });
    fs.unlinkSync(testFilePath);
    return true;
  } catch (err) {
    console.error(`Error checking write access to ${dir}:`, err);
    return false;
  }
};

const getAppDirectory = () => {
  switch (process.platform) {
    case 'darwin':
      return process.execPath.substring(0, process.execPath.indexOf('.app') + 4);
    case 'linux':
    case 'win32':
      return path.join(process.execPath, '..');
    default:
      throw new Error(`Unsupported platform: ${process.platform}`);
  }
};

module.exports = {
  setAtomHome: homePath => {
    if (typeof homePath !== 'string' || !homePath.trim()) {
      throw new Error('Invalid homePath provided');
    }

    const portableHomePath = path.join(getAppDirectory(), '..', '.atom');
    if (fs.existsSync(portableHomePath)) {
      if (hasWriteAccess(portableHomePath)) {
        process.env.ATOM_HOME = portableHomePath;
      } else {
        console.warn(`Insufficient permission to portable Atom home "${portableHomePath}".`);
      }
    }

    if (process.env.ATOM_HOME) {
      return;
    }

    process.env.ATOM_HOME = path.join(homePath, '.atom');
  },

  setUserData: app => {
    const electronUserDataPath = path.join(process.env.ATOM_HOME, 'electronUserData');
    if (fs.existsSync(electronUserDataPath)) {
      if (hasWriteAccess(electronUserDataPath)) {
        app.setPath('userData', electronUserDataPath);
      } else {
        console.warn(`Insufficient permission to Electron user data "${electronUserDataPath}".`);
      }
    }
  },

  getAppDirectory: getAppDirectory
};