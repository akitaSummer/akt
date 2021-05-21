import akt, { AktContext } from "./src";

const app = akt();

app.get("/", (ctx: AktContext) => {
  ctx.HTML(200, "<h1>Hello Workd!</h1>");
});

app.get("/hello", (ctx: AktContext) => {
  ctx.string(200, `hello ${ctx.query("name")}, you're at ${ctx.path}\n`);
});

app.post("/login", (ctx: AktContext) => {
  ctx.JSON(200, {
    username: ctx.postForm("username"),
    password: ctx.postForm("password"),
  });
});

app.run("9999", () => {
  console.log("app is running in http://localhost:9999/");
});
