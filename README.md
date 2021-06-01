# Akt

Akt 是一个个人学习用的简易的 web 框架，其设计理念是来源自于 [Gin](https://github.com/gin-gonic/gin) 。

Akt 拥有 golang 和 nodejs 两种版本，其中 nodejs 中还拥有 class 和 func 两个版本。

## 使用

### golang

```shell
git clone git@github.com:akitaSummer/akt.git

cd akt/akt-golang

go run main.go
```

### nodejs

```shell
git clone git@github.com:akitaSummer/akt.git

cd akt/akt-node

yarn dev
```

## 特性

- [x] 支持 get, post 请求
- [x] 提供对 JSON、HTML 等返回类型的支持
- [x] 支持 query 和 param 传参
- [x] 支持 `:name` 和 `*filepath` 的路由前缀
- [x] 支持路由分组
- [x] 支持中间件
- [x] 拥有 HTML 模板渲染及静态资源服务
- [x] 拥有错误恢复机制

## Example

### golang

使用实例位于`main.go`中

```golang
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

```

### nodejs

使用实例位于`app.ts`中

```typescript
import akt, { AktContext } from "./classVersion";
// import akt, { AktContext } from "./funcVersion";

const app = akt();

// 添加get
app.get("/", (ctx: AktContext) => {
  ctx.string(200, "Hello Workd!");
});

// 添加post
app.post("/login", (ctx: AktContext) => {
  ctx.JSON(200, {
    username: ctx.postForm("username"),
    password: ctx.postForm("password"),
  });
});

// 支持param和query
app.get("/hello/:name", (ctx: AktContext) => {
  ctx.string(200, `hello ${ctx.param("name")}`);
});

app.get("/hello/b/c", (ctx: AktContext) => {
  ctx.string(200, ` you're at ${ctx.path}`);
});

app.get("/hi/:name", (ctx: AktContext) => {
  ctx.string(200, `hi ${ctx.param("name")}`);
});

// 支持*
app.get("/wildcard/*filepath", (ctx: AktContext) => {
  ctx.string(200, ` filepath is ${ctx.param("filepath")}`);
});

const onlyForV1 = async (ctx: AktContext) => {
  await ctx.next();
  ctx.setHeader("Token-V1", "onlyForV1");
};
// 支持分组
const v1 = app.group("/v1");
v1.use(onlyForV1);

v1.get("/", (ctx: AktContext) => {
  ctx.string(200, ` you're at /v1`);
});

v1.get("/hello", (ctx) => {
  ctx.string(200, `hello ${ctx.query("name")}, you are at ${ctx.path}`);
});

const onlyForV2 = async (ctx: AktContext) => {
  await new Promise((resolve) => {
    ctx.setHeader("Token-V2", "onlyForV2");
    setTimeout(() => {
      resolve("");
    }, 100);
  });
  await ctx.next();
};

const v2 = v1.group("/v2");
v2.use(onlyForV2);

v2.get("/hello/:name", (ctx) => {
  ctx.string(200, `hello ${ctx.param("name")}, you're at ${ctx.path}`);
});

v2.post("/login", (ctx: AktContext) => {
  ctx.JSON(200, {
    username: ctx.postForm("username"),
    password: ctx.postForm("password"),
    path: ctx.path,
  });
});

// 支持static
app.static("/assets", "./assets/");

// 设置模板所在文件夹
app.loadHTMLGlob("./assets");

// 支持pug模板编译
app.get("/template", (ctx) => {
  ctx.HTML(200, "template.pug", { name: "akita" });
});

// 发生错误后服务器不会崩溃
app.get("/error", (ctx) => {
  const err: any = null;
  const { e } = err;
  ctx.string(200, e);
});

app.run("9999", () => {
  console.log("app is running in http://localhost:9999/");
});
```

集成测试位于`app.test.ts`中

```typescript
import test from "ava";
import axios from "axios";
import { join } from "path";
import { spawn } from "child_process";

// 对象类型断言
const objAssert = (value: object, expected: object) => {
  const valueKeys = Object.keys(value);
  const expectedKeys = Object.keys(expected);

  for (let i = 0; i < valueKeys.length; i++) {
    if (expectedKeys.includes(valueKeys[i])) {
      const expectedValue = expected[valueKeys[i]];
      if (Array.isArray(expectedValue) || typeof expectedValue === "object") {
        if (!objAssert(value[valueKeys[i]], expectedValue)) return false;
      } else {
        if (value[valueKeys[i]] !== expectedValue) return false;
      }
    } else {
      return false;
    }
  }

  return true;
};

test.before(async (t) => {
  const app = await spawn("node", [join(__dirname, "./app.js")]);
  await new Promise((resolve) => {
    app.stdout.on("data", (m) => {
      console.log(m.toString()); // app is running in http://localhost:9999/
      resolve("");
    });
  });
});

test("test server running", async (t) => {
  const res = await axios({
    url: "http://localhost:9999",
    method: "GET",
  });
  t.is(res.status, 200);
  t.is(res.data, "Hello Workd!");
  t.pass();
});

test("test post", async (t) => {
  const res = await axios({
    url: "http://localhost:9999/login",
    method: "POST",
    data: {
      username: "akita",
      password: "akita",
    },
  });
  t.is(res.status, 200);
  // t.deepEqual(res.data, { username: "akita", password: "akita" });
  t.assert(
    objAssert(res.data, {
      username: "akita",
      password: "akita",
    })
  );
  t.pass();
});

test("test trie tree", async (t) => {
  const res = await axios({
    url: "http://localhost:9999/hello/akita",
    method: "GET",
  });
  t.is(res.data, `hello akita`);
  t.pass();
});

test("test route group control", async (t) => {
  {
    const res = await axios({
      url: "http://localhost:9999/v1/hello?name=akita",
      method: "GET",
    });
    t.is(res.data, `hello akita, you are at /v1/hello`);
  }

  {
    const res = await axios({
      url: "http://localhost:9999/v1/v2/hello/akita",
      method: "GET",
    });
    t.is(res.data, `hello akita, you're at /v1/v2/hello/akita`);
  }

  {
    const res = await axios({
      url: "http://localhost:9999/v1/v2/login",
      method: "POST",
      data: {
        username: "akita",
        password: "akita",
      },
    });
    t.deepEqual(res.data, {
      username: "akita",
      password: "akita",
      path: `/v1/v2/login`,
    });
  }

  t.pass();
});

test("test middlewares", async (t) => {
  {
    const res = await axios({
      url: "http://localhost:9999/v1/",
      method: "GET",
    });
    t.is(res.headers["token-v1"], `onlyForV1`);
    t.is(res.headers["token-v2"], undefined);
  }
  {
    const res = await axios({
      url: "http://localhost:9999/v1/v2/hello/akita",
      method: "GET",
    });
    t.is(res.headers["token-v1"], `onlyForV1`);
    t.is(res.headers["token-v2"], `onlyForV2`);
  }
  t.pass();
});

test("test static resource", async (t) => {
  const res = await axios({
    url: "http://localhost:9999/assets/index.js",
    method: "GET",
  });
  t.is(res.headers["content-type"], `application/javascript`);
  t.is(res.data, `console.log('hello world');`);
  t.pass();
});

test("test template render", async (t) => {
  const res = await axios({
    url: "http://localhost:9999/template/",
    method: "GET",
  });
  t.is(res.headers["content-type"], `text/html`);
  t.is(res.data, `<p>hello akita</p>`);
  t.pass();
});

test("test panic recover ", async (t) => {
  try {
    await axios({
      url: "http://localhost:9999/error/",
      method: "GET",
    });
  } catch (e) {
    t.is(e.response.status, 500);
    t.is(e.response.data, "Internal Server Error");
  }

  const res = await axios({
    url: "http://localhost:9999",
    method: "GET",
  });
  t.is(res.status, 200);
  t.is(res.data, "Hello Workd!");

  t.pass();
});
```
