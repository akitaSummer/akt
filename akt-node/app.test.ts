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
