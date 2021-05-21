package main

import (
	"fmt"
	"net/http"

	"akt/akt"
)

func main() {
	r := akt.New()
	r.GET("/", func(c *akt.Context) {
		c.HTML(http.StatusOK, "<h1>Hello World!</h1>")
	})
	r.GET("/hello", func(c *akt.Context) {
		c.String(http.StatusOK, "hello %s, you're at %s\n", c.Query("name"), c.Path)
	})

	r.POST("/login", func(c *akt.Context) {
		c.JSON(http.StatusOK, akt.Obj{
			"username": c.PostForm("username"),
			"password": c.PostForm("password"),
		})
	})

	err := r.Run(":9999")

	if err != nil {
		fmt.Printf("%v", err)
	}
}
