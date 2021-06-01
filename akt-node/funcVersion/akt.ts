import http from "http";
import querystring from "querystring";
import { join, parse, resolve } from "path";
import { getType } from "mime";
import { createReadStream } from "fs";
import { stat } from "fs/promises";
import pug from "pug";

import getContext, { AktContext } from "./context";
import getRouter, { AktRouter } from "./router";

const createStaticHandler = (root: string) => {
  const absolutePath = join(resolve("."), root);
  return async (ctx: AktContext) => {
    let pipe: http.ServerResponse
    try {
      const filePath = join(absolutePath, ctx.param("filepath"));
      const fileName = await stat(filePath);
      if (fileName.isFile()) {
        const ext = parse(filePath).ext;
        const mimeType = getType(ext);
        ctx.setHeader("Content-Type", mimeType);
        pipe = createReadStream(filePath).pipe(ctx.res);
        await new Promise((resolve) => {
          pipe.on("end", () => {
            resolve("");
          });
        });
      } else {
        throw Error("File is not found!");
      }
    } catch (e) {
      if (pipe) pipe.destroy() 
      if (ctx.akt.onError) ctx.akt.onError(e)
      ctx.string(404, "File is not found!");
      ctx.setHeader("Content-Type", "text/plain");
      ctx.res.end(ctx.resData);
    }
  };
};

export type RouterGroupType = {
  // 前缀
  prefix: string;
  middlewares: HandlerFunc[];
  // 父组
  parent: RouterGroupType | AktType;
  // 根akt
  akt: AktType;
  // 建立新分组
  group: (prefix: string, group?: RouterGroupType) => RouterGroupType;
  // 添加路由
  addRoute: (
    method: string,
    pattern: string,
    handler: HandlerFunc,
    group?: RouterGroupType
  ) => void;
  get: (pattern: string, handler: HandlerFunc) => void;
  post: (pattern: string, handler: HandlerFunc) => void;
  use: (middlewares: HandlerFunc) => void;
  static: (relativePath: string, root: string, group?: RouterGroupType) => void;
};

export type HandlerFunc = (ctx: AktContext) => void;

export type AktType = {
  server: http.Server;
  router: AktRouter;
  templateRoot: string;
  pug: typeof pug;
  groups: (RouterGroupType | AktType)[];
  get: (pattern: string, handler: HandlerFunc) => void;
  post: (pattern: string, handler: HandlerFunc) => void;
  run: (addr: string, listeningListener?: () => void) => http.Server;
  loadHTMLGlob: (pattern: string) => void;
  onError: (e: any, p?: Promise<any>) => void;
  use: (middlewares: HandlerFunc, group?: RouterGroupType) => void;
} & Omit<RouterGroupType, "addRoute" | "post" | "get" | "use">;

const akt = (requestListener?: http.RequestListener) => {
  const akt: AktType = {
    // server
    server: http.createServer(requestListener),
    // 路由
    router: getRouter(),
    prefix: "",
    middlewares: [],
    parent: null,
    akt: null,
    groups: [],
    pug: pug,
    onError: null,
    templateRoot: null,
    // 设置get请求的路由
    get: (pattern: string, handler: HandlerFunc, group?: RouterGroupType) => {
      akt.router.addRoute("GET", pattern, handler);
    },
    // 设置post请求的路由
    post: (pattern: string, handler: HandlerFunc, group?: RouterGroupType) => {
      akt.router.addRoute("POST", pattern, handler);
    },
    // 设置监听端口
    run: (addr: string, listeningListener?: () => void) =>
      akt.server.listen(addr, listeningListener),
    use: (middlewares: HandlerFunc, group?: RouterGroupType) => {
      group
        ? group.middlewares.push(middlewares)
        : akt.middlewares.push(middlewares);
    },
    static: (relativePath: string, root: string, group?: RouterGroupType) => {
      const newGroup = group || akt;
      const handler = createStaticHandler(root);
      const urlPattern = join(relativePath, "/*filepath").replace(/\\/g, "/");
      newGroup.get(urlPattern, handler);
    },
    loadHTMLGlob: (pattern: string) => {
      akt.templateRoot = join(resolve("."), pattern);
    },
    // 建立新分组
    group: (prefix: string, parentGroup?: RouterGroupType) => {
      const group = parentGroup || akt;
      const newGroup: RouterGroupType = {
        prefix: group.prefix + prefix,
        parent: group,
        akt: akt,
        middlewares: [],
        group: (prefix: string) => akt.group(prefix, newGroup),
        addRoute: (method: string, pattern: string, handler: HandlerFunc) => {
          pattern = newGroup.prefix + pattern;
          akt.router.addRoute(method, pattern, handler);
        },
        get: (pattern: string, handler: HandlerFunc) => {
          newGroup.addRoute("GET", pattern, handler, newGroup);
        },
        post: (pattern: string, handler: HandlerFunc) => {
          newGroup.addRoute("POST", pattern, handler, newGroup);
        },
        use: (middlewares: HandlerFunc) => {
          akt.use(middlewares, newGroup);
        },
        static: (relativePath: string, root: string) => {
          akt.static(relativePath, root, newGroup);
        },
      };

      group.akt.groups.push(newGroup);

      return newGroup;
    },
  };

  // 监听请求
  akt.server.on(
    "request",
    (
      requset: http.IncomingMessage & { body?: any },
      response: http.ServerResponse
    ) => {
      // 处理post请求
      requset.body = "";
      requset.on("data", (chuck) => {
        requset.body += chuck;
      });
      requset.on("end", () => {
        if (requset.headers["content-type"]?.includes("application/json")) {
          requset.body = JSON.parse(requset.body);
        } else if (requset.method === "POST") {
          requset.body = querystring.parse(requset.body);
        }
        let middlewares: HandlerFunc[] = [];
        for (let i = 0; i < akt.groups.length; i++) {
          if (requset.url.includes(akt.groups[i].prefix)) {
            middlewares = [...middlewares, ...akt.groups[i].middlewares];
          }
        }
        // data接收完毕后创建context,并执行
        const ctx = getContext(requset, response, akt);
        ctx.handlers = middlewares;
        akt.router.handle(ctx);
      });
    }
  );

  // 捕获错误，用于防止服务器崩溃
  process.on("uncaughtException", function (err) {
    if (akt.onError) akt.onError(err)
    console.log(err.stack);
  });

  process.on("unhandledRejection", (reason, p) => {
    if (akt.onError) akt.onError(reason, p)
    console.log("Unhandled Rejection at: Promise", p, "reason:", reason);
  });

  akt.akt = akt;
  akt.groups.push(akt);

  return akt;
};

export default akt;
