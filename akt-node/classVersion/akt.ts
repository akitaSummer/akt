import http from "http";
import querystring from "querystring";

import { Context } from "./context";
import { Router } from "./router";

export type HandlerFunc = (ctx: Context) => void;

class Akt {
  private server: http.Server;
  private router: Router;

  constructor(requestListener?: http.RequestListener) {
    this.server = http.createServer(requestListener);
    this.router = new Router();
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

  // 建立get、post路由方法
  get = (pattern: string, handler: HandlerFunc) => {
    this.router.addRoute("GET", pattern, handler);
  };
  post = (pattern: string, handler: HandlerFunc) => {
    this.router.addRoute("POST", pattern, handler);
  };

  // 返回server实例，可用于多进程
  getServer = () => {
    return this.server;
  };

  // 设置监听端口
  run = (addr: string, listeningListener?: () => void) => {
    return this.server.listen(addr, listeningListener);
  };
}

const akt = (requestListener?: http.RequestListener) =>
  new Akt(requestListener);

export default akt;
