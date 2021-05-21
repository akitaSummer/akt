import http from "http";
import querystring from "querystring";
import url from "url";
import util from "util";

export type ContextOptionsType = {
  [propsName: string]: any;
};

export class Context {
  req: http.IncomingMessage & { body?: any };
  res: http.ServerResponse;
  path: string;
  method: string;
  statusCode: number;

  private URL: url.URL;
  constructor(requset: http.IncomingMessage, response: http.ServerResponse) {
    this.req = requset;
    this.res = response;
    this.URL = new url.URL(`http://${this.req.headers.host}${this.req.url}`);
    this.path = this.URL.pathname;
    this.method = requset.method;
  }

  query = (key: string) => {
    return this.URL.searchParams.get(key);
  };

  postForm = (key: string) => {
    return this.req.body?.[key];
  };

  status = (code: number, message?: string) => {
    this.statusCode = code;
    this.res.statusCode = code;
    this.res.statusMessage = message;
    return this;
  };

  setHeader = (key: string, value: string) => {
    this.res.setHeader(key, value);
    return this;
  };

  string = (code: number, str: string) => {
    this.setHeader("Content-Type", "text/plain");
    this.status(code);
    this.res.end(str);
  };

  JSON = (code: number, obj: object) => {
    this.setHeader("Content-Type", "application/json");
    this.status(code);
    try {
      const data = JSON.stringify(obj);
      this.res.end(data);
    } catch (e) {
      console.log(e);
      this.res.end(JSON.stringify({ err: e.toStirng() }));
    }
  };

  data = (code: number, data: any) => {
    this.status(code);
    this.res.end(data);
  };

  HTML = (code: number, HTML: string) => {
    this.setHeader("Content-Type", "text/html");
    this.status(code);
    this.res.end(HTML);
  };
}
