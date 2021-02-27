import express from "express"

const PORT = 8080

const app = express()
app.use(express.static("static-build", { extensions:['html'] }))

app.listen(PORT, () => {
  console.log(`Express server has started on port ${process.env.EXPRESS_PORT}`)
})