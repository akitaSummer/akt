import http from "http";
import url from "url";

export type AktContext = {
  req: http.IncomingMessage & { body?: any };
  res: http.ServerResponse;
  path: string; // 路径
  statusCode: number;
  method: string; // 请求方式
  params: Map<string, string>
  query: (key) => string; // 获取get中query的某一项
  postForm: (key: string) => any; // 获取post中params的某一项
  status: (code: number, message?: string) => AktContext; // 设置statusCode
  setHeader: (key: string, value: string) => AktContext; // 设置header
  string: (code: number, str: string) => void; // 返回string
  JSON: (code: number, obj: object) => void; // 返回json
  data: (code: number, data: any) => void; // 返回data
  HTML: (code: number, HTML: string) => void; // 返回html
  param: (key: string) => string
};

const getContext = (
  requset: http.IncomingMessage & { body?: any },
  response: http.ServerResponse
) => {
  const URL = new url.URL(`http://${requset.headers.host}${requset.url}`);
  const context: AktContext = {
    req: requset,
    res: response,
    path: URL.pathname,
    statusCode: 0,
    method: requset.method,
    params: new Map(),
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
      context.res.end(str);
    },

    JSON: (code: number, obj: object) => {
      context.setHeader("Content-Type", "application/json");
      context.status(code);
      try {
        const data = JSON.stringify(obj);
        context.res.end(data);
      } catch (e) {
        console.log(e);
        context.res.end(JSON.stringify({ err: e.toStirng() }));
      }
    },

    data: (code: number, data: any) => {
      context.status(code);
      context.res.end(data);
    },

    HTML: (code: number, HTML: string) => {
      context.setHeader("Content-Type", "text/html");
      context.status(code);
      context.res.end(HTML);
    },

    param: (key: string) => {
      return context.params.get(key)
    }
  };

  return context;
};

export default getContext;
