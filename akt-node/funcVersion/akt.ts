import http from "http";
import querystring from "querystring";

import getContext, { AktContext } from "./context";
import getRouter, { AktRouter } from "./router";

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
};

export type HandlerFunc = (ctx: AktContext) => void;

export type AktType = {
  server: http.Server;
  router: AktRouter;
  groups: (RouterGroupType | AktType)[];
  get: (pattern: string, handler: HandlerFunc) => void;
  post: (pattern: string, handler: HandlerFunc) => void;
  run: (addr: string, listeningListener?: () => void) => http.Server;
} & Omit<RouterGroupType, "addRoute" | "post" | "get">;

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
        // data接收完毕后创建context,并执行
        const ctx = getContext(requset, response);
        akt.router.handle(ctx);
      });
    }
  );

  akt.akt = akt;
  akt.groups.push(akt);

  return akt;
};

export default akt;
