import http from "http";

class Akt {
  private server: http.Server;
  private router: Map<string, http.RequestListener>;

  constructor(requestListener?: http.RequestListener) {
    this.server = http.createServer(requestListener);
    this.router = new Map();
    this.server.on(
      "request",
      (requset: http.IncomingMessage, response: http.ServerResponse) => {
        const handler = this.router.get(`${requset.method}-${requset.url}`);
        if (handler) {
          handler(requset, response);
        } else {
          console.log(`404 NOT FOUND: ${requset.url}`);
          response.statusCode = 404;
          response.statusMessage = `404 NOT FOUND: ${requset.url}`;
          response.end();
        }
      }
    );
  }

  private addRoute = (
    method: string,
    pattern: string,
    handler: http.RequestListener
  ) => {
    this.router.set(`${method}-${pattern}`, handler);
  };

  get = (pattern: string, handler: http.RequestListener) => {
    this.addRoute("GET", pattern, handler);
  };
  post = (pattern: string, handler: http.RequestListener) => {
    this.addRoute("POST", pattern, handler);
  };

  getServer = () => {
    return this.server;
  };

  run = (addr: string, listeningListener?: () => void) => {
    return this.server.listen(addr, listeningListener);
  };
}

const akt = (requestListener?: http.RequestListener) =>
  new Akt(requestListener);

export default akt;
