import { fileURLToPath } from "url";
import {
  copyFile,
  mkdirSync,
  readdirSync,
  existsSync,
  writeFileSync,
} from "fs";
import { join, extname as _extname } from "path";
import { promisify } from "util";

// 获取当前模块的绝对路径
const __dirname = fileURLToPath(new URL(".", import.meta.url));

// 转换为 promise 版本
const copyFilePromise = promisify(copyFile);

async function copyDirAsync(configDir, vscodeDir) {
  try {
    mkdirSync(vscodeDir, { recursive: true });
    const entries = readdirSync(configDir, { withFileTypes: true });

    for (const entry of entries) {
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
            extname ? `_backup${extname}` : ""
          );
          const backupFilePath = join(vscodeDir, backupFileName);
          // 不存在则创建一个备份文件
          if (!existsSync(backupFilePath)) {
            writeFileSync(backupFilePath, "");
          }
          await copyFilePromise(destPath, backupFilePath);
          console.log(
            `${vscodeDir} 下 ${entry.name} 已备份为 ${backupFileName}`
          );
        }
        await copyFilePromise(srcPath, destPath);
        console.log(`Copied file: ${entry.name}`);
      }
    }
    console.log("VSCode settings copied successfully!");
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

handleConfigs(join(process.cwd(), ".vscode"), join(__dirname, ".vscode"));
