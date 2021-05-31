// import akt, { AktContext } from "./classVersion";
import akt, { AktContext } from "./funcVersion";

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

app.run("9999", () => {
  console.log("app is running in http://localhost:9999/");
});
