import http from "http";
import querystring from "querystring";

import getContext, { AktContext } from "./context";
import getRouter, { AktRouter } from "./router";

export type HandlerFunc = (ctx: AktContext) => void;

export type AktType = {
  server: http.Server;
  router: AktRouter;
  get: (pattern: string, handler: HandlerFunc) => void;
  post: (pattern: string, handler: HandlerFunc) => void;
  run: (addr: string, listeningListener?: () => void) => http.Server;
};

const akt = (requestListener?: http.RequestListener) => {
  const akt: AktType = {
    // server
    server: http.createServer(requestListener),
    // 路由
    router: getRouter(),
    // 设置get请求的路由
    get: (pattern: string, handler: HandlerFunc) => {
      akt.router.addRoute("GET", pattern, handler);
    },
    // 设置post请求的路由
    post: (pattern: string, handler: HandlerFunc) => {
      akt.router.addRoute("POST", pattern, handler);
    },
    // 设置监听端口
    run: (addr: string, listeningListener?: () => void) =>
      akt.server.listen(addr, listeningListener),
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
        // data接收完毕后创建context,并执行
        const ctx = getContext(requset, response);
        akt.router.handle(ctx);
      });
    }
  );

  return akt;
};

export default akt;
