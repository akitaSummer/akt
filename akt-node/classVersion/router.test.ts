import { Router, parsePattern } from "./router";
import test from "ava";

const router = new Router();

test.before("init", (t) => {
  router.addRoute("GET", "/", null);
  router.addRoute("GET", "/hello/:name", null);
  router.addRoute("GET", "/hello/b/c", null);
  router.addRoute("GET", "/hi/:name", null);
});

test("test parse pattern", (t) => {
  t.deepEqual(parsePattern("/p/:name"), ["p", ":name"]);
  t.deepEqual(parsePattern("/p/*"), ["p", "*"]);
  t.deepEqual(parsePattern("/p/*name/*"), ["p", "*name"]);
  t.pass();
});

test("test get route", (t) => {
  const { node, params } = router.getRouter("GET", "/hello/akita");
  t.true(node !== null);
  t.is(node.pattern, "/hello/:name");
  t.is(params.get("name"), "akita");
  t.pass();
});
