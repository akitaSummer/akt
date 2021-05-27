import { AktContext } from "./context";
import { HandlerFunc } from "./akt";
import { TrieNodeType, insert, search } from "./trie";

export type AktRouter = {
  roots: Map<string, TrieNodeType>;
  handlers: Map<string, HandlerFunc>; // 路由的映射
  addRoute: (method: string, pattern: string, handler: HandlerFunc) => void; // 添加路由映射
  handle: (ctx: AktContext) => void; // 处理请求
  getRouter: (
    method: string,
    path: string
  ) => {
    node: TrieNodeType;
    params: Map<string, string>;
  } | null;
};

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

const getRouter = () => {
  const router: AktRouter = {
    roots: new Map(),
    handlers: new Map(),
    addRoute: (method: string, pattern: string, handler: HandlerFunc) => {
      const parts = parsePattern(pattern);
      if (!router.roots.get(method)) {
        const node: TrieNodeType = {
          pattern: "",
          part: "",
          children: [],
          isWild: false,
        };
        router.roots.set(method, node);
      }
      insert(router.roots.get(method), pattern, parts, 0);
      router.handlers.set(`${method}-${pattern}`, handler);
    },
    handle: async (ctx: AktContext) => {
      const { node, params } = router.getRouter(ctx.method, ctx.path);
      if (node) {
        ctx.params = params;
        const key = `${ctx.method}-${node.pattern}`;
        const handler = router.handlers.get(key);
        ctx.handlers.push(handler);
      } else {
        ctx.string(404, `404 NOT FOUND: ${ctx.path}`);
      }
      await ctx.next();
      ctx.res.end(ctx.resData)
    },
    getRouter: (method: string, path: string) => {
      const searchParts = parsePattern(path);
      const params: Map<string, string> = new Map();
      const root = router.roots.get(method);

      if (!root) {
        return null;
      }

      const n = search(root, searchParts, 0);

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
    },
  };

  return router;
};

export default getRouter;
