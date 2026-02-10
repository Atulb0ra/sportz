import express from "express";
import { matchRouter } from "./routes/matches.js";
import http from 'http';
import { attachWebSocketServer } from "./ws/server.js";
import {securityMiddleware} from './arcjet.js';

const PORT = Number(process.env.PORT || 8080);
const HOST = process.env.HOST || '0.0.0.0'

const app = express();
const server = http.createServer(app);

app.use(express.json());

app.get('/', (req,res) => {
    res.send("Hello from the server!");
});

app.use(securityMiddleware());

app.use('/matches', matchRouter);

const {broadcastMatchCreated} = attachWebSocketServer(server);
app.locals.broadcastMatchCreated = broadcastMatchCreated; // app locals are global object accessible from any request

server.listen(PORT, HOST, () => {
    const baseUrl = HOST==='0.0.0.0' ? `http://localhost:${PORT}`: `http://${HOST}:${PORT}`;
    console.log(`The server is running on  ${baseUrl}`);
    console.log(`WebSocket server is listening on ${baseUrl.replace('http', 'ws')}/ws`);
    
});