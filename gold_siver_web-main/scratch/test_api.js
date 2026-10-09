const fetch = require('node-fetch');

const PROXY_URL = "https://api.allorigins.win/raw?url=";
const targetUrl = "http://app.cnfol.com/dataapi/index.php/kuaixundata/qukuailiandata?num1=0&num2=20&strlen=25&cstrlen=200&callback=cb";

async function test() {
  try {
    const res = await fetch(`${PROXY_URL}${encodeURIComponent(targetUrl)}`);
    console.log("Status:", res.status);
    const text = await res.text();
    console.log("Response text start:", text.substring(0, 100));
    
    const start = text.indexOf("(");
    const end = text.lastIndexOf(")");
    if (start !== -1 && end !== -1 && end > start) {
      const json = JSON.parse(text.substring(start + 1, end));
      console.log("JSON items count:", json.length);
      console.log("First item title:", json[0].Title);
    } else {
      console.log("Could not find JSONP callback wrapper");
    }
  } catch (err) {
    console.error("Error:", err);
  }
}

test();
