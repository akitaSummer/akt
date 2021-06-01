import http from "http";
import url from "url";
import { join } from "path";
import { Options, LocalsObject } from "pug";

import { HandlerFunc, AktType } from "./akt";

export type AktContext = {
  akt: AktType;
  req: http.IncomingMessage & { body?: any };
  res: http.ServerResponse;
  path: string; // 路径
  statusCode: number;
  method: string; // 请求方式
  params: Map<string, string>;
  handlers: HandlerFunc[];
  index: number;
  resData: any;
  next: () => void;
  query: (key) => string; // 获取get中query的某一项
  postForm: (key: string) => any; // 获取post中params的某一项
  status: (code: number, message?: string) => AktContext; // 设置statusCode
  setHeader: (key: string, value: string) => AktContext; // 设置header
  string: (code: number, str: string) => void; // 返回string
  JSON: (code: number, obj: object) => void; // 返回json
  data: (code: number, data: any) => void; // 返回data
  HTML: (code: number, name: string, options?: Options & LocalsObject) => void; // 返回html
  param: (key: string) => string;
};

const getContext = (
  requset: http.IncomingMessage & { body?: any },
  response: http.ServerResponse,
  akt: AktType
) => {
  const URL = new url.URL(`http://${requset.headers.host}${requset.url}`);
  const context: AktContext = {
    akt,
    req: requset,
    res: response,
    path: URL.pathname,
    statusCode: 0,
    method: requset.method,
    params: new Map(),
    handlers: [],
    index: -1,
    resData: null,
    query: (key) => {
      return URL.searchParams.get(key);
    },
    postForm: (key: string) => {
      return context.req.body?.[key];
    },
    status: (code: number, message?: string) => {
      context.statusCode = code;
      context.res.statusCode = code;
      context.res.statusMessage = message;
      return context;
    },

    setHeader: (key: string, value: string) => {
      context.res.setHeader(key, value);
      return context;
    },

    string: (code: number, str: string) => {
      context.setHeader("Content-Type", "text/plain");
      context.status(code);
      if (typeof context.resData === "string") {
        context.resData += str;
      } else {
        context.resData = str;
      }
    },

    JSON: (code: number, obj: object) => {
      context.setHeader("Content-Type", "application/json");
      context.status(code);
      try {
        const data = JSON.stringify(obj);
        context.resData = data;
      } catch (e) {
        console.log(e);
        if (context.akt.onError) akt.onError(e)
        context.res.end(JSON.stringify({ err: e.toStirng() }));
      }
    },

    data: (code: number, data: any) => {
      context.status(code);
      if (typeof context.resData === "object" && typeof data === "object") {
        context.resData = {
          ...context.resData,
          ...data,
        };
      } else {
        context.resData = data;
      }
    },

    HTML: (code: number, name: string, options?: Options & LocalsObject) => {
      context.setHeader("Content-Type", "text/html");
      context.status(code);
      context.resData = akt.pug.renderFile(
        join(akt.templateRoot, name),
        options
      );
    },

    param: (key: string) => {
      return context.params.get(key);
    },
    next: async () => {
      context.index++;
      // 兼容不写next()，即使写next(),之前的next会在新的next调用结束后再继续执行，导致index必定大于handlers.length
      while (context.index < context.handlers.length) {
        await context.handlers[context.index](context);
        context.index++;
      }
    },
  };

  return context;
};

export default getContext;
