export type TrieNodeType = {
  pattern: string; // 待匹配路由，例如 /p/:lang
  part: string; // 路由中的一部分，例如 :lang
  children: TrieNodeType[]; // 子节点，例如 [doc, tutorial, intro]
  isWild: boolean; // 是否精确匹配，part 含有 : 或 * 时为true
};

// 匹配第一个成功节点
const matchChild = (n: TrieNodeType, part: string) => {
  for (let child of n.children) {
    if (child.part === part || child.isWild) {
      return child;
    }
  }

  return null;
};

// 匹配所有成功的节点
const matchChildren = (n: TrieNodeType, part: string) => {
  const nodes: TrieNodeType[] = [];
  for (let child of n.children) {
    if (child.part === part || child.isWild) {
      nodes.push(child);
    }
  }

  return nodes;
};

export const insert = (
  n: TrieNodeType,
  pattern: string,
  parts: string[],
  height: number
) => {
  if (parts.length === height) {
    n.pattern = pattern;
    return;
  }

  const part = parts[height];
  let child = matchChild(n, part);

  if (!child) {
    child = {
      pattern: "",
      part,
      isWild: part[0] === ":" || part[0] === "*",
      children: [],
    };
    n.children.push(child);
  }

  insert(child, pattern, parts, height + 1);
};

export const search = (n: TrieNodeType, parts: string[], height: number): TrieNodeType | null => {
  if (parts.length === height || n.part.includes("*")) {
    if (n.pattern === "") {
      return null;
    }
    return n;
  }

  const part = parts[height];
  const children = matchChildren(n, part);

  for (let child of children) {
    const result = search(child, parts, height + 1);
    if (result) {
      return result;
    }
  }

  return null;
};
