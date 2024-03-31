import { fileURLToPath } from "node:url";
import { mkdirSync, readdirSync, existsSync, writeFileSync } from "node:fs";
import { copyFile } from "node:fs/promises";
import { join, extname as _extname } from "node:path";

// 获取当前模块的绝对路径
const __dirname = fileURLToPath(new URL(".", import.meta.url));

async function copyDirAsync(configDir, vscodeDir) {
  try {
    if (!existsSync(vscodeDir)) {
      mkdirSync(vscodeDir, { recursive: true });
    }
    const entries = readdirSync(configDir, { withFileTypes: true });

    await Promise.all(
      entries.map(async entry => {
        const srcPath = join(configDir, entry.name);
        const destPath = join(vscodeDir, entry.name);
        if (entry.isDirectory()) {
          await copyDirAsync(srcPath, destPath);
        } else {
          if (existsSync(destPath)) {
            // 获取文件后缀
            const extname = _extname(destPath);
            const backupFileName = entry.name.replace(
              extname,
              extname ? `_backup${extname}` : ''
            );
            const backupFilePath = join(vscodeDir, backupFileName);
            // 不存在则创建一个备份文件
            if (!existsSync(backupFilePath)) {
              writeFileSync(backupFilePath, '');
            }
            await copyFile(destPath, backupFilePath);
            console.log(
              `${vscodeDir} 下 ${entry.name} 已备份为 ${backupFileName}`
            );
          }
          await copyFile(srcPath, destPath);
          console.log(`Copied file: ${entry.name}`);
        }
      })
    );
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
    console.error(
      `An error occurred while checking VSCode configurations: ${error.message}`
    );
  }
}

handleConfigs(join(process.cwd(), '.vscode'), join(__dirname, '.vscode'));
