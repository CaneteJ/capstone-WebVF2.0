import React, { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { collection, getDocs } from 'firebase/firestore';
import './AdminPage.css';

const FetchParkingUsers = () => {
  const [parkingSeeker, setParkingSeeker] = useState([]);

  useEffect(() => {
    const fetchParkingUsers = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'user'));
        const userList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setParkingSeeker(userList);
      } catch (error) {
        console.error('Error fetching parking seeker:', error);
        
      }
    };

    fetchParkingUsers();
  }, []);

  return (
    <div className="admin-dashboard">
      <div className="sidebar">
        <div className="admin-container">
          <img
            src="customer.jpg"
            alt="Admin"
            className="admin-pic"
            style={{ width: '50px', marginRight: '10px' }}
          />
          <span className="admin-text">Admin</span>
        </div>
        <nav>

        <div class="wrapper">
    <div class="side">
        <h2>Menu</h2>
        <ul>
            <li><a href="AdminPage"><i class="fas fa-home"></i>Home</a></li>
            <li><a href='FetchEstablishments'><i class="fas fa-user"></i>Establishment Account</a></li>
            <li><a href='FetchParkingUsers'><i class="fas fa-address-card"></i>Parking Seeker List</a></li>
            <li><a href='FetchAgents'><i class="fas fa-project-diagram"></i>Agents List</a></li>
            <li><a href="#"><i class="fas fa-blog"></i>Profile</a></li>
            <li><a href="/"><i className="fas fa-sign-out-alt" style={{ color: 'red' }}></i>Logout</a></li>
        </ul> 
    </div>
    </div>
    
        </nav>
      </div>
      <div className="main-content">
      <h1 className="pending"style={{marginTop: '5%', textAlign: 'center', fontWeight: 'bold',}}>Parking Seekers Accounts</h1>
      <div className="project-list" style={{ height: '300px', overflowY: 'scroll', marginTop: '5%', height: '50%'}}>
  {parkingSeeker.length > 0 ? (
    <ul className="user-list">
      {parkingSeeker.map((seeker, index) => (
        <React.Fragment key={seeker.id}>
          <li className="user-item">
            <img
              src={seeker.profileImageUrl || '/default-avatar.png'}
              alt={seeker.name}
              className="user-image"
            />
            <div className="user-details">
              <span className="user-name">{seeker.name}</span>
              <br />
              <span className="user-info">
                Address: {seeker.address} | Email: {seeker.email}
              </span>
            </div>
          </li>
          {index < parkingSeeker.length - 1 && <hr className="horizontal-line" />}
        </React.Fragment>
      ))}
    </ul>
  ) : (
    <p>No parking seekers found.</p>
  )}
        </div>
      </div>
    </div>
  );
};

export default FetchParkingUsers;