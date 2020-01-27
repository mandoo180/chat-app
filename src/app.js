const PORT = process.env.PORT;
const path = require('path');
const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const Filter = require('bad-words');
const { generateMessage } = require('./utils/messages');
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const publicDirectoryPath = path.join(__dirname, '../public');

app.use(express.static(publicDirectoryPath));

io.on('connection', socket => {
  socket.on('join', (options, callback) => {
    const { error, user } = addUser({ id: socket.id, ...options });

    if (error) {
      return callback({ error });
    }

    socket.join(user.room);

    socket.emit('messageUpdated', generateMessage('Admin', `Welcome to ${user.room}.`));
    socket.broadcast.to(user.room).emit('messageUpdated', generateMessage('Admin', `${user.username} has joined!`));
    io.to(user.room).emit('roomData', {
      room: user.room,
      users: getUsersInRoom(user.room)
    });

    callback({ user });

    // socket.emit io.emit socket.broadcast.emit
    // io.to.emit, socket.broadcase.to.emit
  });

  socket.on('sendMessage', (message, callback) => {
    const user = getUser(socket.id);
    const filter = new Filter();
    if (filter.isProfane(message)) {
      return callback({ error: 'Profanity is not allowed.' });
    }

    if (!user) {
      return callback({ error: 'Something went wrong.' });
    }

    io.to(user.room).emit('messageUpdated', generateMessage(user.username, message));
    callback({ success: 'Delivered!' });
  });

  socket.on('sendLocation', ({ latitude, longitude }, callback) => {
    const user = getUser(socket.id);
    if (!latitude || !longitude || !user) {
      return callback({ error: 'Something went wrong...' });
    }

    io.to(user.room).emit('locationMessage', generateMessage(user.username, `https://google.com/maps?q=${latitude},${longitude}`));

    callback({ success: 'Shared Location!' });
  });

  socket.on('disconnect', () => {
    const user = removeUser(socket.id);

    if (user) {
      io.to(user.room).emit('messageUpdated', generateMessage('Admin', `${user.username} has left this room.`));
      io.to(user.room).emit('roomData', {
        room: user.room,
        users: getUsersInRoom(user.room)
      });
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});
