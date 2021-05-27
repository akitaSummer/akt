package akt

type RouterGroup struct {
	prefix      string
	parent      *RouterGroup
	middlewares []HandlerFunc
	engine      *Engine
}

func (group *RouterGroup) Group(prefix string) *RouterGroup {
	newGroup := &RouterGroup{
		prefix:      group.prefix + prefix,
		parent:      group,
		middlewares: make([]HandlerFunc, 0),
		engine:      group.engine,
	}
	group.engine.groups = append(group.engine.groups, newGroup)
	return newGroup
}

func (group *RouterGroup) addRoute(method string, comp string, handler HandlerFunc) {
	pattern := group.prefix + comp
	group.engine.router.addRoute(method, pattern, handler)
}

func (group *RouterGroup) GET(comp string, handler HandlerFunc) {
	group.addRoute("GET", comp, handler)
}

func (group *RouterGroup) POST(comp string, handler HandlerFunc) {
	group.addRoute("POST", comp, handler)
}

func (group *RouterGroup) Use(handler HandlerFunc) {
	group.middlewares = append(group.middlewares, handler)
}
