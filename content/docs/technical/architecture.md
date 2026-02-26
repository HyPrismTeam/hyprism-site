+++
title = "Architecture"
template = "article.html"
+++

## Overview

HyPrism follows a **Console + IPC + React SPA** architecture.

At a high level, a .NET backend hosts the application logic, Electron provides
the desktop shell, and a React SPA renders the UI. Communication between layers
is done through typed IPC channels.

```
.NET Console Backend
────────────────────────────────
Program.cs
├─ Bootstrapper.cs   (DI container)
├─ Services/         (business logic)
└─ IpcService.cs     (IPC registry)

⇅ Electron.NET socket bridge

Electron Main Process
────────────────────────────────
BrowserWindow (frameless)
└─ preload.js        (contextBridge)
   ⇅ ipcRenderer

React SPA
────────────────────────────────
App.tsx              (routing)
pages/               (views)
components/          (shared UI)
lib/ipc.ts           (generated bindings)
```

---

## Startup Flow

1. `Program.Main()` initializes the logger
2. `ElectronLogInterceptor` is attached to stdout/stderr
3. `Bootstrapper.Initialize()` builds the DI container
4. Electron is started via `ElectronNetRuntime`
5. A frameless `BrowserWindow` loads `index.html`
6. `IpcService.RegisterAll()` registers IPC handlers
7. React mounts and begins IPC-based data access

---

## Communication Model

All frontend ↔ backend communication uses **named IPC channels**.

```
hyprism:{domain}:{action}

Examples:
hyprism:game:launch
hyprism:settings:get
hyprism:i18n:set
```

### Channel Types

| Type       | Direction                      | Description |
|------------|--------------------------------|-------------|
| **send**   | React → .NET                   | Fire-and-forget |
| **invoke** | React → .NET → React           | Request / reply |
| **event**  | .NET → React                   | Push updates |

---

## Security Model

- `contextIsolation: true`
- `nodeIntegration: false`
- Only a minimal IPC surface is exposed via `preload.js`
- No Node.js APIs are available to the renderer

---

## Dependency Injection

All services are registered as singletons in `Bootstrapper.cs`:

```csharp
var services = new ServiceCollection();

services.AddSingleton<ConfigService>();
services.AddSingleton<IpcService>();
// ...

return services.BuildServiceProvider();
```

`IpcService` acts as the central bridge and receives dependencies via
constructor injection.

---

## Log Interception

Electron.NET writes unstructured output to stdout/stderr.
HyPrism intercepts this using a custom `ElectronLogInterceptor`.

Behavior:

- Framework messages → `Logger.Info("Electron", …)`
- Debug noise → `Logger.Debug("Electron", …)`
- Errors / crash patterns → `Logger.Warning("Electron", …)`
- Known spam patterns → suppressed
