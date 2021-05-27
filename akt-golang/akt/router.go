package akt

import (
	"net/http"
	"strings"

	"fmt"
)

type router struct {
	handlers map[string]HandlerFunc
	roots    map[string]*node
}

func parsePattern(pattern string) []string {
	vs := strings.Split(pattern, "/")

	parts := make([]string, 0)
	for _, item := range vs {
		if item != "" {
			parts = append(parts, item)
			if item[0] == '*' {
				break
			}
		}
	}

	return parts
}

func newRouter() *router {
	return &router{handlers: make(map[string]HandlerFunc), roots: make(map[string]*node)}
}

func (router *router) addRoute(method string, pattern string, handler HandlerFunc) {
	parts := parsePattern(pattern)

	name := method + "-" + pattern

	_, ok := router.roots[method]

	if !ok {
		router.roots[method] = &node{}
	}

	router.roots[method].insert(pattern, parts, 0)

	router.handlers[name] = handler
}

func (router *router) getRoute(method string, path string) (*node, map[string]string) {
	searchParts := parsePattern(path)

	params := make(map[string]string)

	root, ok := router.roots[method]

	if !ok {
		return nil, nil
	}

	n := root.search(searchParts, 0)

	if n != nil {
		parts := parsePattern(n.pattern)
		for i, part := range parts {
			if part[0] == ':' {
				params[part[1:]] = searchParts[i]
			}
			if part[0] == '*' && len(part) > 1 {
				params[part[1:]] = strings.Join(searchParts[i:], "/")
				break
			}
		}
		return n, params
	}

	return nil, nil
}

func (router *router) handle(c *Context) {
	n, params := router.getRoute(c.Method, c.Path)
	fmt.Printf("%v", n)
	if n != nil {
		c.Params = params
		key := c.Method + "-" + n.pattern
		handler := router.handlers[key]
		c.handlers = append(c.handlers, handler)
	} else {
		c.String(http.StatusNotFound, "404 NOT FOUND: %s\n", c.Path)
	}
	c.Next()
}
