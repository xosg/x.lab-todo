# Todo List 项目

本项目是一个简单的 Todo List 应用，包含前端和后端，支持任务的增删查改。

## 目录结构

```
├── backend/           # Node.js 后端服务
│   ├── package.json   # 后端依赖和脚本
│   ├── server.js      # 后端主程序
│   └── data/
│       └── todos.json # 任务数据存储
├── frontend/          # 前端静态页面
│   ├── favicon.svg
│   ├── index.html
│   ├── script.js
│   └── style.css
└── README.md          # 项目说明
```

## 快速开始

### 1. 启动后端

```powershell
cd backend
npm install
node server.js
```

后端服务默认运行在 `http://localhost:3000`。

### 2. 访问前端

启动后端服务后，直接用浏览器打开 `http://localhost:3000/index.html` 即可。

## 功能说明

- 添加、删除、修改、查询 Todo 任务
- 前后端分离，前端通过 API 与后端通信

## 技术栈

- 后端：原生Node.js，无依赖
- 数据库：JSON文件存储。
- 前端：原生HTML、CSS、JavaScript

## 交流与反馈

如有问题或建议，请提交 issue。
