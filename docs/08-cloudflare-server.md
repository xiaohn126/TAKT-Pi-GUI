# 独立后端与 Cloudflare Tunnel · 0.1.0 · 2026-10-11

目标公网地址 `https://pi.xiao-dev.top`，本机固定地址 `http://127.0.0.1:30141`。桌面客户端选「远程服务」，关闭窗口不影响独立后端。

## 结构和配置

`windows/standalone.cjs` 独立启动 pi-web 与可选的 cloudflared，异常退出等待五秒重启。`windows/server-task.ps1` 安装、查询和管理自启任务。`windows/standalone-version.json` 单独记录服务版本。

状态目录默认 `%LOCALAPPDATA%\TAKT-Pi-Server`，可通过 `TAKT_SERVER_STATE` 指定。`server.json` 保存固定端口、持久密码、后端与 Node 路径、agentDirectory 和 Tunnel 文件路径；`agent/` 保存模型凭据与会话；`logs/` 保存追加日志，需定期归档。这些文件含密钥，保留在私有用户目录，不提交 Git 或共享。

在项目根目录执行（后端未准备时先运行 `windows/prepare-delivery.ps1`）：

```powershell
& .\windows\runtime\delivery\node.exe .\windows\standalone.cjs init
& .\windows\runtime\delivery\node.exe .\windows\standalone.cjs check
& .\windows\runtime\delivery\node.exe .\windows\standalone.cjs
```

init 仅运行一次，随机生成固定密码，重启不重置。可在本机编辑 server.json 的 password（至少 16 字符），随后重启服务。登录本机网页设置模型，或从原 `.pi/agent` 复制 `auth.json`、`models.json`、`settings.json` 到独立 agent 目录。原会话无需搬迁。

## 正式 Tunnel 和域名

安装 cloudflared 后，用有 `xiao-dev.top` 管理权限的账号授权：

```powershell
cloudflared tunnel login
cloudflared tunnel create takt-pi
cloudflared tunnel route dns takt-pi pi.xiao-dev.top
```

在私有状态目录创建 tunnel.yml，替换 UUID 和凭据路径：

```yaml
tunnel: YOUR-TUNNEL-UUID
credentials-file: 'C:\Users\YOUR-USER\.cloudflared\YOUR-TUNNEL-UUID.json'
ingress:
  - hostname: pi.xiao-dev.top
    service: http://127.0.0.1:30141
  - service: http_status:404
```

server.json 中 cloudflared 设置 exe 的绝对路径，tunnelConfig 设置 YAML 绝对路径，tokenFile 留空。也支持控制台创建的远程管理 Tunnel：token 保存在本地文件，把 tokenFile 设置为其绝对路径，tunnelConfig 留空；控制台将域名映射到上述本机 HTTP 地址。不要把 token 写入进程参数或提交仓库。配置后运行 check 并重启后台。

使用正式 Tunnel：[Quick Tunnel 不支持 SSE](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/do-more-with-tunnels/trycloudflare/)，不能用于流式聊天和终端。保留 pi-web 密码登录。公网验收需包含未登录拒绝、登录、实际模型回复、持续流式事件和终端操作。Cloudflare Access 额外登录页与 Electron 的兼容性需单独验证。

## 开机自启和管理

使用同一 Windows 用户打开**管理员 PowerShell**，在项目根目录执行：

```powershell
.\windows\server-task.ps1 -Action Install -Startup Boot
.\windows\server-task.ps1 -Action Status
```

Boot 使用当前用户的 S4U、Limited 权限，启动后无需登录，不将编码代理作为 SYSTEM 运行。S4U 无法访问 EFS 文件及需要 Windows 身份认证的网络资源；此类需求应由管理员使用专用账号的密码登录任务，并确认批处理登录权限。安装过程不保存 Windows 密码。

只需登录后自启可使用 `-Startup Logon`，部分系统仍要求管理员安装。任务无限运行、允许电池运行，异常退出后重试。它引用项目与运行时的绝对路径，安装后不要移动这些文件。安装前关闭手动独立后端的进程树，避免固定端口冲突。

```powershell
.\windows\server-task.ps1 -Action Stop
.\windows\server-task.ps1 -Action Start
.\windows\server-task.ps1 -Action Remove
```

Remove 保留配置与会话。若修改端口，需同时更新 Tunnel service 地址。

## 设计记录与本机验证

2026-10-11：保留桌面客户端既有模式，独立服务使用单独入口、固定回环端口和隔离 agent 数据，避免窗口退出中断公网。密码从本地文件读入，Tunnel 使用配置或 token 文件，避免命令行泄露。使用普通用户运行，管理员仅负责开机任务安装。

四项回归测试通过；真实后端本机启动成功，认证 `/api/home` 返回 200，未认证返回 401。当前会话安装任务被系统拒绝（Access denied），尚未完成真实重启验收。Cloudflare 账号授权与公网模型/终端验收尚未完成，不能把本机成功当作公网成功。

官方参考：[配置正式 Tunnel](https://developers.cloudflare.com/tunnel/features/locally-managed-tunnels/create-local-tunnel/)。
