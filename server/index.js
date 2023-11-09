const express = require('express');
const app = express();
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

const rooms = {};
//connected user
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  //join room event, if room not exit, create a new room
  socket.on('join_room', (room) => {
    if (!rooms[room]) {
      rooms[room] = [];
    }
    //push the user and the choice to the room array
    rooms[room].push({ id: socket.id, choice: undefined });
    //User join the room
    socket.join(room);

    //Check the number of user
    if (rooms[room].length === 2) {
      //Create a new users array with only user ID
      const users = rooms[room].map(user => user.id);
      //That room emit a event which is room ready, and pass the users data(ID)
      io.to(room).emit('room_ready', users);
    }
  });

  //Listen for choose number event emit from frontend
  //Object contain number and room number
  socket.on('choose_number', ({ number, room }) => {
    //Checking room exist
    if (rooms[room]) {
    //Find the specific user who is making the choice in that room.
      const user = rooms[room].find(user => user.id === socket.id);
      //Store the result to user.choice
      user.choice = parseInt(number, 10);
      //Checks if all user choices in the room not equals to undefined
      if (rooms[room].every(user => user.choice !== undefined)) {
        //Create a chocies array contain all choices
        const choices = rooms[room].map(user => user.choice);
        if (choices[0] === choices[1]) {
            //If match, pull out the choice[0] to client
          io.to(room).emit('match_result', choices[0]);
        } else {
            //If not match, pull out the all choices to client
          io.to(room).emit('no_match_result', choices);
        }

        // Clear choices for the next round
        rooms[room].forEach(user => (user.choice = undefined));
      }
    }
  });

  socket.on('disconnect', () => {
    for (const room in rooms) {
        //Remove the current user(socket.id) form the list when trigger disconnect
      rooms[room] = rooms[room].filter(u => u.id !== socket.id);
      if (rooms[room].length === 0) {
        delete rooms[room];
      }
    }
  });
});

server.listen(3001, () => {
  console.log('SERVER IS RUNNING');
});
