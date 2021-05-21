import http from "http";
import { Context } from "./context";
import { HandlerFunc } from "./index";

export class Router {
  private handlers: Map<string, HandlerFunc>;

  constructor() {
    this.handlers = new Map();
  }

  addRoute = (method: string, pattern: string, handler: HandlerFunc) => {
    this.handlers.set(`${method}-${pattern}`, handler);
  };

  handle = (ctx: Context) => {
    const key = `${ctx.method}-${ctx.path}`;
    const handler = this.handlers.get(key);
    if (handler) {
      handler(ctx);
    } else {
      ctx.string(404, `404 NOT FOUND: ${ctx.path}`);
    }
  };
}
