import http from "http";
import querystring from "querystring";
import { join, resolve, parse } from "path";
import { createReadStream } from "fs";
import { stat } from "fs/promises";
import { getType } from "mime";
import pug from "pug";

import { Context } from "./context";
import { Router } from "./router";
import { AktContext } from "classVersion";

export type HandlerFunc = (ctx: Context) => void;

const createStaticHandler = (root: string): HandlerFunc => {
  const absolutePath = join(resolve("."), root);
  return async (ctx: AktContext) => {
    try {
      const filePath = join(absolutePath, ctx.param("filepath"));
      const fileName = await stat(filePath);
      if (fileName.isFile()) {
        const ext = parse(filePath).ext;
        const mimeType = getType(ext);
        ctx.setHeader("Content-Type", mimeType);
        const pipe = createReadStream(filePath).pipe(ctx.res);
        await new Promise((resolve) => {
          pipe.on("end", () => {
            resolve("");
          });
        });
      } else {
        throw Error("File is not found!");
      }
    } catch (e) {
      ctx.string(404, "File is not found!");
      ctx.setHeader("Content-Type", "text/plain");
      ctx.res.end();
    }
  };
};

class RouterGroup {
  prefix: string;
  protected parent: RouterGroup | Akt;
  middlewares: HandlerFunc[];
  protected akt: Akt;

  constructor(prefix: string, parent: RouterGroup | Akt, akt: Akt) {
    this.prefix = (parent ? parent.prefix : "") + prefix;
    this.parent = parent;
    this.akt = akt;
    this.middlewares = [];
  }

  group = (prefix: string) => {
    const newGruop = new RouterGroup(prefix, this, this.akt);
    this.akt.groups.push(newGruop);
    return newGruop;
  };

  get = (pattern: string, handler: HandlerFunc) => {
    this.addRoute("GET", pattern, handler);
  };
  post = (pattern: string, handler: HandlerFunc) => {
    this.addRoute("POST", pattern, handler);
  };

  protected addRoute = (method: string, comp: string, handler: HandlerFunc) => {
    const pattern = this.prefix + comp;
    this.akt.addRoute(method, pattern, handler);
  };

  use = (handler: HandlerFunc) => {
    this.middlewares.push(handler);
  };

  static = (relativePath: string, root: string) => {
    const handler = createStaticHandler(root);
    const urlPattern = join(relativePath, "/*filepath").replace(/\\/g, "/");
    this.get(urlPattern, handler);
  };
}

export class Akt extends RouterGroup {
  private server: http.Server;
  private router: Router;
  groups: (RouterGroup | Akt)[];
  pug: typeof pug;
  templateRoot: string;

  constructor(requestListener?: http.RequestListener) {
    super("", null, null);
    this.akt = this;
    this.parent = null;
    this.server = http.createServer(requestListener);
    this.router = new Router();
    this.groups = [this];
    this.pug = pug;
    this.templateRoot = null;
    // 监听请求
    this.server.on(
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
          for (let i = 0; i < this.groups.length; i++) {
            if (requset.url.includes(this.groups[i].prefix)) {
              middlewares = [...middlewares, ...this.groups[i].middlewares];
            }
          }
          const ctx = new Context(requset, response, this);
          ctx.hanlders = middlewares;
          this.router.handle(ctx);
        });
      }
    );
  }

  // 返回server实例，可用于多进程
  getServer = () => {
    return this.server;
  };

  // 设置监听端口
  run = (addr: string, listeningListener?: () => void) => {
    return this.server.listen(addr, listeningListener);
  };

  addRoute = (method: string, pattern: string, handler: HandlerFunc) => {
    this.router.addRoute(method, pattern, handler);
  };

  loadHTMLGlob = (pattern: string) => {
    this.templateRoot = join(resolve("."), pattern);
  };
}

const akt = (requestListener?: http.RequestListener) =>
  new Akt(requestListener);

export default akt;
