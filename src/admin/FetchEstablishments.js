import React, { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { collection, getDocs } from 'firebase/firestore';
import './AdminPage.css';

const FetchEstablishments = () => {
  const [establishments, setEstablishments] = useState([]);

  useEffect(() => {
    const fetchEstablishments = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "establishments"));
        const establishmentsList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setEstablishments(establishmentsList);
      } catch (error) {
        console.error("Error fetching establishments:", error);
        
      }
    };

    fetchEstablishments();
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
    
      </div>
      <div className="main-content">
      <h1 className="pending" style={{marginTop: '5%', textAlign: 'center', fontWeight: 'bold',}}>Establishments Accounts</h1>
        <div className="project-list" style={{overflowY: 'scroll',marginTop: '5%', height: '25%', width: '70%'}}>
         
          {establishments.length > 0 ? (
            <ul>
              {establishments.map((establishment, index) => (
                <React.Fragment key={establishment.id}>
                  <li className="w3-bar">
                    <span className="w3-bar-item w3-button w3-white w3-xlarge w3-right"></span>
                    <img
                      src={establishment.profileImageUrl || '/default-avatar.png'}
                      alt={establishment.managementName}
                      className="w3-bar-item w3-circle"
                      style={{ width: '85px' }}
                    />
                    <div className="w3-bar-item">
                      <span className="w3-large">
                        Establishment: {'\t'}
                        {establishment.managementName}</span>
                      <br />
                      <span className="w3-span-sub">
                        Parking Location: {'\t'}
                        {establishment.companyAddress}</span>
                      <br />
                      <span className="w3-span-sub">
                        Approved on:{'\t'}
                        {establishment.createdAt?.seconds
                          ? new Date(establishment.createdAt.seconds * 1000).toLocaleDateString()
                          : 'Date not available'}
                      </span>
                    </div>
                  </li>
                  {index < establishments.length - 1 && <hr />} { }
                </React.Fragment>
              ))}
            </ul>
          ) : (
            <p>No establishments found.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default FetchEstablishments;