import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';

const socket = io.connect('http://localhost:3001');

function App() {
  const [numberInput, setNumberInput] = useState('');
  const [result, setResult] = useState('');
  const [room, setRoom] = useState('');
  const [waiting, setWaiting] = useState(false);
  const [otherNumber, setOtherNumber] = useState(null);


  const handleInputChange = (e) => {
    setNumberInput(e.target.value);
  };

  const handleChooseNumber = () => {
    if (numberInput.trim() !== '' && room !== '') {
      //Pass the number and the room to server
      socket.emit('choose_number', { number: numberInput, room });
      setWaiting(true);
    }
  };

  const handleRoomChange = (e) => {
    setRoom(e.target.value);
  };


  //This will trigger when the numberInput changed
  useEffect(() => {
    //Event listener "match_result", wait for the emit
    socket.on('match_result', (matchedNumber) => {
      setResult(`You got Matched. The result is ${matchedNumber}`);
      setWaiting(false);
    });

    socket.on('no_match_result', (choices) => {
      //Set the other number as the number in the array and find the num not same as the input put
      setOtherNumber(choices.find(num => num !== parseInt(numberInput)));
      setResult(`Sorry, no match found. Your choice: ${numberInput}, Other's choice: ${choices.find(num => num !== parseInt(numberInput))}`);
      setWaiting(false);
    });

    return () => {
      socket.off('match_result');
      socket.off('no_match_result');
    };
  }, [numberInput]);


  const handleJoinRoom = () => {
    if (room !== '') {
      socket.emit('join_room', room);
    }
  };

  return (
    <div className="App">
     <h1>User: Enter a Number</h1>
      <input
        type="number"
        value={numberInput}
        onChange={handleInputChange}
        placeholder="Enter a number"
      />
      <input
        type="text"
        value={room}
        onChange={handleRoomChange}
        placeholder="Enter Room Number"
      />
      <button onClick={handleJoinRoom}>Join Room</button>
      <button onClick={handleChooseNumber}>Choose Number</button>
      {waiting && <p>Waiting for the other user to choose a number.</p>}
      {result && <p>{result}</p>}
    </div>
  );
}

export default App;
