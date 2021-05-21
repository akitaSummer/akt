package akt

import (
	"net/http"
)

type router struct {
	handlers map[string]HandlerFunc
}

func newRouter() *router {
	return &router{handlers: make(map[string]HandlerFunc)}
}

func (router *router) addRoute(method string, pattern string, handler HandlerFunc) {
	name := method + "-" + pattern
	router.handlers[name] = handler
}

func (router *router) handle(c *Context) {
	key := c.Method + "-" + c.Path
	if hander, ok := router.handlers[key]; ok {
		hander(c)
	} else {
		c.String(http.StatusNotFound, "404 NOT FOUND: %s\n", c.Path)
	}
}
