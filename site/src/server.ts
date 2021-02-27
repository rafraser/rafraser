import express from "express"

const app = express()
app.use(express.static("static-build", { extensions:['html'] }))

app.listen(8080, () => {
  console.log("Server has started")
})