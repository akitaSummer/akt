import { Context } from "./context";
import { HandlerFunc } from "./akt";
import TrieNode from "./trie";

export const parsePattern = (pattern: string) => {
  const vs = pattern.split("/");
  const parts: string[] = [];
  for (let item of vs) {
    if (item !== "") {
      parts.push(item);
      if (item[0] === "*") {
        break;
      }
    }
  }

  return parts;
};

export class Router {
  private handlers: Map<string, HandlerFunc>;
  roots: Map<string, TrieNode>;

  constructor() {
    this.handlers = new Map();
    this.roots = new Map();
  }

  // 添加路由
  addRoute = (method: string, pattern: string, handler: HandlerFunc) => {
    const parts = parsePattern(pattern);
    if (!this.roots.get(method)) {
      const node = new TrieNode("", "", [], false);
      this.roots.set(method, node);
    }
    this.roots.get(method).insert(pattern, parts, 0);
    this.handlers.set(`${method}-${pattern}`, handler);
  };

  handle = async (ctx: Context) => {
    try {
      const { node, params } = this.getRouter(ctx.method, ctx.path);
      if (node) {
        ctx.params = params;
        const key = `${ctx.method}-${node.pattern}`;
        const handler = this.handlers.get(key);
        ctx.hanlders.push(handler);
      } else {
        ctx.string(404, `404 NOT FOUND: ${ctx.path}`);
      }
      await ctx.next();
      if (typeof ctx.resData === "object") {
        ctx.resData = JSON.stringify(ctx.resData);
      }
      ctx.res.end(ctx.resData);
    } catch (e) {
      if (ctx.akt.onError) ctx.akt.onError(e);
      ctx.string(500, "Internal Server Error");
      ctx.setHeader("Content-Type", "text/plain");
      ctx.res.end(ctx.resData);
    }
  };
  getRouter = (method: string, path: string) => {
    const searchParts = parsePattern(path);
    const params: Map<string, string> = new Map();
    const root = this.roots.get(method);

    if (!root) {
      return null;
    }

    const n = root.search(searchParts, 0);

    if (n) {
      const parts = parsePattern(n.pattern);
      for (let i = 0; i < parts.length; i++) {
        if (parts[i][0] === ":") {
          params.set(parts[i].slice(1), searchParts[i]);
        }
        if (parts[i][0] === "*") {
          params.set(parts[i].slice(1), searchParts.slice(i).join("/"));
          break;
        }
      }
      return {
        node: n,
        params,
      };
    }

    return null;
  };
}
