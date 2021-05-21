import http from "http";
import { Context } from "./context";
import { Router } from "./router";

export { Context as AktContext } from "./context";
export { Router as AktRouter } from "./router";
import util from "util";
import querystring from "querystring";
import parse from "co-body";

export type HandlerFunc = (ctx: Context) => void;

class Akt {
  private server: http.Server;
  private router: Router;

  constructor(requestListener?: http.RequestListener) {
    this.server = http.createServer(requestListener);
    this.router = new Router();
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

  get = (pattern: string, handler: HandlerFunc) => {
    this.router.addRoute("GET", pattern, handler);
  };
  post = (pattern: string, handler: HandlerFunc) => {
    this.router.addRoute("POST", pattern, handler);
  };

  getServer = () => {
    return this.server;
  };

  run = (addr: string, listeningListener?: () => void) => {
    return this.server.listen(addr, listeningListener);
  };
}

const akt = (requestListener?: http.RequestListener) =>
  new Akt(requestListener);

export default akt;
