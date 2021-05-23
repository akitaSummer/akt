class TrieNode {
  pattern: string;
  part: string;
  children: TrieNode[];
  isWild: boolean;

  constructor(
    pattern?: string,
    part?: string,
    children?: TrieNode[],
    isWild?: boolean
  ) {
    this.pattern = pattern || "";
    this.part = part || "";
    this.children = children || [];
    this.isWild = isWild || false;
  }

  matchChild = (part: string) => {
    for (let child of this.children) {
      if (child.part === part || child.isWild) {
        return child;
      }
    }

    return null;
  };

  matchChildren = (part: string) => {
    const nodes: TrieNode[] = [];
    for (let child of this.children) {
      if (child.part === part || child.isWild) {
        nodes.push(child);
      }
    }

    return nodes;
  };

  insert = (pattern: string, parts: string[], height: number) => {
    if (parts.length === height) {
      this.pattern = pattern;
      return;
    }

    const part = parts[height];
    let child = this.matchChild(part);

    if (!child) {
      child = new TrieNode("", part, [], part[0] === ":" || part[0] === "*");
      this.children.push(child);
    }

    child.insert(pattern, parts, height + 1);
  };

  search = (parts: string[], height: number): TrieNode | null => {
    if (parts.length === height || this.part.includes("*")) {
      if (this.pattern === "") {
        return null;
      }
      return this;
    }

    const part = parts[height];
    const children = this.matchChildren(part);

    for (let child of children) {
      const result = child.search(parts, height + 1);
      if (result) {
        return result;
      }
    }

    return null;
  };
}

export default TrieNode;
