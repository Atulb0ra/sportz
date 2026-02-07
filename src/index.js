import express from "express";

const app = express();
const port = 8080;

app.use(express.json());

app.get('/', (req,res) => {
    res.send("Hello from the server!");
});

app.listen(port, () => {
    console.log(`The server is running on port ${port}`);
});