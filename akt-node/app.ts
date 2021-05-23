import akt, { AktContext } from "./classVersion";
// import akt, { AktContext } from "./funcVersion";

const app = akt();

app.get("/", (ctx: AktContext) => {
  ctx.HTML(200, "<h1>Hello Workd!</h1>");
});

app.post("/login", (ctx: AktContext) => {
  ctx.JSON(200, {
    username: ctx.postForm("username"),
    password: ctx.postForm("password"),
  });
});

app.get("/hello/:name", (ctx: AktContext) => {
  ctx.string(200, `hello ${ctx.param("name")}`);
});

app.get("/hello/b/c", (ctx: AktContext) => {
  ctx.string(200, ` you're at ${ctx.path}`);
});

app.get("/hi/:name", (ctx: AktContext) => {
  ctx.string(200, `hi ${ctx.param("name")}`);
});

app.get("/assets/*filepath", (ctx: AktContext) => {
  ctx.string(200, ` filepath is ${ctx.param("filepath")}`);
});

app.run("9999", () => {
  console.log("app is running in http://localhost:9999/");
  process.stdin.write("data", () => {});
});
