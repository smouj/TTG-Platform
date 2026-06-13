const WebSocket = require("ws");
const http = require("http");

function login(email, password) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({email, password});
    const req = http.request({
      hostname: "localhost", port: 3000, path: "/api/auth/login",
      method: "POST",
      headers: { "Content-Type": "application/json", "Content-Length": data.length }
    }, res => {
      let body = "";
      res.on("data", c => body += c);
      res.on("end", () => resolve(JSON.parse(body)));
    });
    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

async function main() {
  console.log("Logging in...");
  const p1 = await login("demo@tradingtazosgame.com", "demo1234");
  const p2 = await login("dev@tradingtazosgame.com", "devpass123");
  
  if (p1.error || p2.error) { console.log("FAIL login:", p1.error || p2.error); process.exit(1); }
  console.log("P1:", p1.user.name, "| P2:", p2.user.name);
  
  let matched = 0;
  
  const ws1 = new WebSocket("ws://localhost:3001?token=" + p1.token);
  const ws2 = new WebSocket("ws://localhost:3001?token=" + p2.token);
  
  ws1.on("open", () => {
    console.log("WS1 connected");
    ws1.send(JSON.stringify({type:"join_queue", payload:{mode:"ranked"}}));
  });
  ws1.on("message", d => {
    const msg = JSON.parse(d.toString());
    if (msg.type === "match_found") { matched++; if(matched>=2) done(); }
  });
  ws1.on("close", (c) => console.log("WS1 closed:", c));
  
  ws2.on("open", () => {
    console.log("WS2 connected");
    setTimeout(() => ws2.send(JSON.stringify({type:"join_queue", payload:{mode:"ranked"}})), 300);
  });
  ws2.on("message", d => {
    const msg = JSON.parse(d.toString());
    if (msg.type === "match_found") { matched++; if(matched>=2) done(); }
  });
  ws2.on("close", (c) => console.log("WS2 closed:", c));
  
  function done() {
    console.log("\n✅ PvP MATCHMAKING CONFIRMED");
    ws1.close(); ws2.close();
    process.exit(0);
  }
  
  setTimeout(() => { console.log("\nTIMEOUT"); process.exit(1); }, 8000);
}

main();
