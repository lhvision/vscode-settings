import { fileURLToPath } from "node:url";
import { mkdirSync, readdirSync, existsSync, writeFileSync } from "node:fs";
import { copyFile } from "node:fs/promises";
import { join, extname as _extname } from "node:path";

const args = process.argv.slice(2); // 去除第一个（node）和第二个（脚本路径）参数

let shouldBackup = true; // 默认情况下应进行备份

for (const arg of args) {
  if (arg === '--not-backup' || arg === '-n') {
    shouldBackup = false;
    break; // 找到匹配项后，无需继续遍历
  }
  if (arg === '--help' || arg === '-h') {
    console.log(`Usage: @lhvision/vscode-settings [options]

Options:
  --not-backup, -n      Do not backup the original files
  --help, -h            Show this help message
`);
    process.exit(0);
  }
}

// 获取当前模块的绝对路径
const __dirname = fileURLToPath(new URL(".", import.meta.url));

const colorANSIMap = {
  reset: '\x1B[0m',
  bright: '\x1B[1m',
  dim: '\x1B[2m',
  underscore: '\x1B[4m',
  blink: '\x1B[5m',
  reverse: '\x1B[7m',
  hidden: '\x1B[8m',
  fgBlack: '\x1B[30m',
  fgRed: '\x1B[31m',
  fgGreen: '\x1B[32m',
  fgYellow: '\x1B[33m',
  fgBlue: '\x1B[34m',
  fgMagenta: '\x1B[35m',
  fgCyan: '\x1B[36m',
  fgWhite: '\x1B[37m',
  bgBlack: '\x1B[40m',
  bgRed: '\x1B[41m',
  bgGreen: '\x1B[42m',
  bgYellow: '\x1B[43m',
  bgBlue: '\x1B[44m',
  bgMagenta: '\x1B[45m',
  bgCyan: '\x1B[46m',
  bgWhite: '\x1B[47m'
};

function colorLog(message, type = 'info') {
  let color;

  switch (type) {
    case 'success':
      color = colorANSIMap.fgGreen;
      break;
    case 'info':
      color = colorANSIMap.fgBlue;
      break;
    case 'error':
      color = colorANSIMap.fgRed;
      break;
    case 'warning':
      color = colorANSIMap.fgYellow;
      break;
    default:
      color = colorANSIMap[type];
      break;
  }

  console.log(color, message, colorANSIMap.reset);
}

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
          if (shouldBackup && existsSync(destPath)) {
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
            colorLog(
              `old ${destPath} -> ${backupFilePath}`,
              'warning'
            );
          }
          await copyFile(srcPath, destPath);
          colorLog(`Copied file: ${entry.name}`);
        }
      })
    );
    colorLog('VSCode settings copied successfully!', 'success');
  } catch (e) {
    colorLog(`Error occurred during directory copy: ${e.message}`, 'error');
  }
}

// 主要逻辑函数，根据情况复制或合并配置文件
async function handleConfigs(vscodeDir, configDir) {
  if (!shouldBackup) {
    colorLog('Skipping file backup due to --not-backup flag.');
  }
  try {
    await copyDirAsync(configDir, vscodeDir);
  } catch (error) {
    colorLog(
      `An error occurred while checking VSCode configurations: ${error.message}`,
      error
    );
  }
}

handleConfigs(join(process.cwd(), '.vscode'), join(__dirname, '.vscode'));
