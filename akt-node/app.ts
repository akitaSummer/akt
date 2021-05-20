import akt from "./src";

const app = akt();

app.get("/", (req, res) => {
  let message = "";
  res.statusCode = 200;
  Object.keys(req.headers).forEach((header) => {
    message += `Header[${header}] = ${req.headers[header]} \n`;
  });
  res.end(message);
});

app.get("/hello", (req, res) => {
  res.statusCode = 200;
  res.statusMessage = "hello world!";
  res.end();
});

app.run("9999", () => {
  console.log("app is running in http://localhost:9999/");
});
