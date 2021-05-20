package main

import (
	"fmt"
	"net/http"

	"akt/akt"
)

func main() {
	app := akt.New()

	app.GET("/", func(w http.ResponseWriter, req *http.Request) {
		fmt.Fprintf(w, "URL.Path = %q\n", req.URL.Path)
	})

	app.GET("/hello", func(w http.ResponseWriter, req *http.Request) {
		for k, v := range req.Header {
			fmt.Fprintf(w, "Header[%q] = %q\n", k, v)
		}
	})

	err := app.Run(":9900")

	if err != nil {
		fmt.Printf("%v", err)
	}
}
