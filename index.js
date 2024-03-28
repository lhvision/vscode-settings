const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

// 转换为 promise 版本
const copyFilePromise = promisify(fs.copyFile);

async function copyDirAsync(configDir, vscodeDir) {
  try {
    fs.mkdirSync(vscodeDir, { recursive: true });
    const entries = fs.readdirSync(configDir, { withFileTypes: true });

    for (const entry of entries) {
      const srcPath = path.join(configDir, entry.name);
      const destPath = path.join(vscodeDir, entry.name);

      if (entry.isDirectory()) {
        await copyDirAsync(srcPath, destPath);
      } else {
        if (fs.existsSync(destPath)) {
          // 获取文件后缀
          const extname = path.extname(destPath);
          const backupFileName = entry.name.replace(extname, extname ? `_backup${extname}` : '');
          const backupFilePath = path.join(vscodeDir, backupFileName);
          // 不存在则创建一个备份文件
          if (!fs.existsSync(backupFilePath)) {
            fs.writeFileSync(backupFilePath, '');
          }
          await copyFilePromise(destPath, backupFilePath);
          console.log(`${vscodeDir} 下 ${entry.name} 已备份为 ${backupFileName}`);
        }
        await copyFilePromise(srcPath, destPath);
        console.log(`Copied file: ${entry.name}`);
      }
    }
    console.log('VSCode settings copied successfully!');
  } catch (e) {
    console.error(`Error occurred during directory copy: ${e.message}`);
  }
}

// 主要逻辑函数，根据情况复制或合并配置文件
async function handleConfigs(vscodeDir, configDir) {
  try {
    await copyDirAsync(configDir, vscodeDir);
  } catch (error) {
    console.error(`An error occurred while checking VSCode configurations: ${error.message}`);
  }
}

handleConfigs(path.join(process.cwd(), '.vscode'), path.join(__dirname, '.vscode'));
