import http from "http";
import url from "url";
import { join } from "path";
import { Options, LocalsObject } from "pug";

import { HandlerFunc, Akt } from "./akt";

export type ContextOptionsType = {
  [propsName: string]: any;
};

export class Context {
  req: http.IncomingMessage & { body?: any };
  res: http.ServerResponse;
  path: string;
  method: string;
  statusCode: number;
  params: Map<string, string>;
  private index: number;
  hanlders: HandlerFunc[];
  resData: any;
  akt: Akt;

  private URL: url.URL;
  constructor(
    requset: http.IncomingMessage,
    response: http.ServerResponse,
    akt: Akt
  ) {
    this.req = requset;
    this.res = response;
    this.URL = new url.URL(`http://${this.req.headers.host}${this.req.url}`);
    this.path = this.URL.pathname;
    this.method = requset.method;
    this.params = new Map();
    this.index = -1;
    this.hanlders = [];
    this.resData = null;
    this.akt = akt;
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
    this.resData = str;
  };

  JSON = (code: number, obj: object) => {
    this.setHeader("Content-Type", "application/json");
    this.status(code);
    try {
      const data = JSON.stringify(obj);
      this.resData = data;
    } catch (e) {
      console.log(e);
      if (this.akt.onError) this.akt.onError(e);
      this.res.end(JSON.stringify({ err: e.toStirng() }));
    }
  };

  data = (code: number, data: any) => {
    this.status(code);
    this.resData = data;
  };

  HTML = (code: number, name: string, options?: Options & LocalsObject) => {
    this.setHeader("Content-Type", "text/html");
    this.status(code);
    this.resData = this.akt.pug.renderFile(
      join(this.akt.templateRoot, name),
      options
    );
  };

  param = (key: string) => {
    return this.params.get(key);
  };

  next = async () => {
    this.index++;
    while (this.index < this.hanlders.length) {
      await this.hanlders[this.index](this);
      this.index++;
    }
  };
}
