package main

import (
	"fmt"
	"html/template"
	"log"
	"net/http"
	"time"

	"akt/akt"
)

func FormatAsDate(t time.Time) string {
	year, month, day := t.Date()
	return fmt.Sprintf("%d-%02d-%02d", year, month, day)
}

func onlyForV2(c *akt.Context) {
	t := time.Now()
	c.String(500, "Internal Server Error. ")
	log.Printf("[%d] %s in %v for group v2", c.StatusCode, c.Req.RequestURI, time.Since(t))
}

func main() {
	r := akt.Default()
	r.GET("/", func(c *akt.Context) {
		c.String(http.StatusOK, "Hello World!")
	})
	r.GET("/hello", func(c *akt.Context) {
		c.String(http.StatusOK, "hello %s, you're at %s\n", c.Query("name"), c.Path)
	})

	r.POST("/login", func(c *akt.Context) {
		c.JSON(http.StatusOK, akt.H{
			"username": c.PostForm("username"),
			"password": c.PostForm("password"),
		})
	})

	r.GET("/hello/:name", func(c *akt.Context) {
		c.String(http.StatusOK, "hello %s, you're at %s\n", c.Param("name"), c.Path)
	})

	r.GET("/assets/*filepath", func(c *akt.Context) {
		c.JSON(http.StatusOK, akt.H{"filepath": c.Param("filepath")})
	})

	// Route Group Control
	v1 := r.Group("/v1")
	{
		v1.GET("/", func(c *akt.Context) {
			c.String(http.StatusOK, "Hello Akt")
		})

		v1.GET("/hello", func(c *akt.Context) {
			c.String(http.StatusOK, "hello %s, you're at %s\n", c.Query("name"), c.Path)
		})
	}

	v2 := r.Group("/v2")
	v2.Use(onlyForV2)
	{
		v2.GET("/hello/:name", func(c *akt.Context) {
			c.String(http.StatusOK, "hello %s, you're at %s\n", c.Param("name"), c.Path)
		})
		v2.POST("/login", func(c *akt.Context) {
			c.JSON(http.StatusOK, akt.H{
				"username": c.PostForm("username"),
				"password": c.PostForm("password"),
			})
		})

	}

	r.Static("/assets", "./assets")

	r.LoadHTMLGlob("assets/*")
	r.SetFuncMap(template.FuncMap{
		"FormatAsDate": FormatAsDate,
	})

	r.GET("/template", func(c *akt.Context) {
		c.HTML(http.StatusOK, "template.tmpl", akt.H{
			"Name": "akita",
		})
	})

	r.GET("/panic", func(c *akt.Context) {
		names := []string{"akita"}
		c.String(http.StatusOK, names[100])
	})

	err := r.Run(":9999")

	if err != nil {
		fmt.Printf("%v", err)
	}
}
