// import akt, { AktContext } from "./classVersion";
import akt, { AktContext } from "./funcVersion";

const app = akt();

// 添加get
app.get("/", (ctx: AktContext) => {
  ctx.HTML(200, "<h1>Hello Workd!</h1>");
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
app.get("/assets/*filepath", (ctx: AktContext) => {
  ctx.string(200, ` filepath is ${ctx.param("filepath")}`);
});

// 支持分组
const v1 = app.group("/v1");

v1.get("/", (ctx) => {
  ctx.HTML(200, `<h1>you are at ${ctx.path}</h1>`);
});

v1.get("/hello", (ctx) => {
  ctx.string(200, `hello ${ctx.query("name")}, you are at ${ctx.path}`);
});

const v2 = v1.group("/v2");

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

app.run("9999", () => {
  console.log("app is running in http://localhost:9999/");
});
