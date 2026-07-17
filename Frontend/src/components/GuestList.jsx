import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig';

const GuestList = () => {
  const [guests, setGuests] = useState([]);

  // This runs once when the component is first rendered
  useEffect(() => {
    const fetchGuests = async () => {
      try {
        const response = await api.get('/api/guests'); // Hits http://localhost:8000/guests
        setGuests(response.data);
      } catch (error) {
        console.error("Could not fetch guests", error);
      }
    };

    fetchGuests();
  }, []);

  return (
    <div>
      <h1>Shabat Guest List</h1>
      <ul>
        {guests.map((guest, index) => (
          <li key={index}>{guest.name}</li>
        ))}
      </ul>
    </div>
  );
};

export default GuestList;