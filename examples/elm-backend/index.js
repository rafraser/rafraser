const { Elm } = require("./dist/elm.js");

const secretKey = "helloworld";
const app = Elm.Main.init({
    flags: secretKey
});
app.ports.log.subscribe(console.log);