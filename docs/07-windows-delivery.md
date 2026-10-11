# Windows 安装与使用 · 0.4.0

适用系统：Windows 11，x64。

1. 下载 `TAKT-Pi-GUI-Setup-0.4.0-x64.exe`，运行安装向导。
2. 从桌面或开始菜单打开 TAKT Pi GUI。
3. 保持「本机使用」，填写 API 地址、自己的 API Key、模型列表和默认模型。
4. 点击「连接」，打开项目或新建对话。

不需要另外安装 pi、Node.js、npm 或 WSL。模型服务需要网络和用户自己的额度。API 必须兼容 OpenAI Chat Completions，模型名称及权限以服务商信息为准。

VanYo 示例：地址 `https://api.vanyospace.com/v1`，模型和默认模型均填写 `gpt-6.1-sol`。密钥由用户自己填写。不同密钥组应分别配置，模型列表须属于当前密钥。

Ctrl+Shift+C 返回配置；密钥留空沿用已保存的密钥。F11 切换全屏，Escape 退出全屏。Alt 显示菜单，可以打开日志目录。

程序内置 Windows 终端依赖。项目需要 Git 操作时另行安装 Git for Windows；运行项目代码可能需要自己的开发工具。

配置、密钥和会话位于 `%APPDATA%\TAKT Pi GUI\agent`。密钥是本机 JSON 配置，请勿分享该目录。卸载保留数据。当前安装包未签名，Windows 可能显示未知发布者；升级运行新版安装包，目前无自动更新。

## 文档结构

本文件面向最终用户；`06-windows.md` 记录设计与验证；`../windows/README.md` 记录构建流程和代码目录。
