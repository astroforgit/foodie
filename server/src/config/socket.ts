import config from '@/config/config';
import User from '@/schemas/UserSchema';
import UserPostgres from '@/models/User';
import { Application } from "express";
import { Server } from "http";

export default function (app: Application, server: Server) {
    const io = require('socket.io')(server, {
        cors: {
            origin: config.cors.origin || 'http://localhost:3000',
            methods: ["GET", "POST", "PATCH"],
            credentials: true
        }
    });

    app.set('io', io);

    io.on("connection", (socket: SocketIO.Socket) => {
        socket.on("userConnect", async (id) => {
            try {
                let user;
                if (config.db.type === 'postgres') {
                    user = await UserPostgres.findByPk(id);
                } else {
                    user = await User.findById(id);
                }

                if (user) {
                    const userId = config.db.type === 'postgres' ? user.id : user._id.toString();
                    socket.join(userId.toString());
                    console.log('Client connected.');
                }
            } catch (e) {
                console.log('Invalid user ID, cannot join Socket.');
            }
        });

        socket.on("userDisconnect", (userID) => {
            socket.leave(userID);
            console.log('Client Disconnected.');
        });

        socket.on("onFollowUser", (data) => {
            console.log(data);
        });

        socket.on("user-typing", ({ user, state }) => {
            io.to(user.id).emit("typing", state)
        })

        socket.on("disconnect", () => {
            console.log('Client disconnected');
        });
    });
}