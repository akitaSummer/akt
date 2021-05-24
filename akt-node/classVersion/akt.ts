import http from "http";
import querystring from "querystring";

import { Context } from "./context";
import { Router } from "./router";

export type HandlerFunc = (ctx: Context) => void;

class RouterGroup {
  prefix: string;
  protected parent: RouterGroup | Akt;
  protected middleware: HandlerFunc[];
  protected akt: Akt;

  constructor(prefix: string, parent: RouterGroup | Akt, akt: Akt) {
    this.prefix = (parent ? parent.prefix : "") + prefix;
    this.parent = parent;
    this.akt = akt;
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
}

class Akt extends RouterGroup {
  private server: http.Server;
  private router: Router;
  groups: (RouterGroup | Akt)[];

  constructor(requestListener?: http.RequestListener) {
    super("", null, null);
    this.akt = this;
    this.parent = null;
    this.server = http.createServer(requestListener);
    this.router = new Router();
    this.groups = [this];
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
          const ctx = new Context(requset, response);
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
}

const akt = (requestListener?: http.RequestListener) =>
  new Akt(requestListener);

export default akt;
