const fs = require('fs');
const path = require('path');

function merge(target, source) {
  // 遍历源对象的属性
  for (let key of Object.keys(source)) {
    if (source[key] && typeof source[key] === 'object') {
      // 如果属性值是对象,则递归合并
      if (!target[key]) {
        target[key] = {};
      }
      target[key] = merge(target[key], source[key]);
    } else {
      // 否则直接复制属性值,除非目标对象已有该属性
      if (!target.hasOwnProperty(key)) {
        target[key] = source[key];
      }
    }
  }
  return target;
}

const vscodeDir = path.join(process.cwd(), '.vscode');
const packageDir = path.dirname(require.resolve('@lhvision/vscode-settings/package.json'));
const configDir = path.join(packageDir, '.vscode');

// 创建 .vscode 目录
if (!fs.existsSync(vscodeDir)) {
  fs.mkdirSync(vscodeDir);
}

// 读取 NPM 包中的配置文件目录
const files = fs.readdirSync(configDir);

files.forEach(file => {
  const filePath = path.join(configDir, file);
  const fileContent = require(filePath);

  const vscodeFile = path.join(vscodeDir, file);
  let existingContent = {};

  // 读取现有文件内容
  if (fs.existsSync(vscodeFile)) {
    existingContent = JSON.parse(fs.readFileSync(vscodeFile, 'utf8'));
  }

  // 合并新内容到现有内容
  const mergedContent = merge({}, existingContent, fileContent);

  // 写入合并后的内容
  const contentData = JSON.stringify(mergedContent, null, 2);
  fs.writeFileSync(vscodeFile, contentData);
});

console.log('VSCode settings merged successfully!');
