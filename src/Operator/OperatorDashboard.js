import { useState, useEffect, useContext } from 'react';
import Table from 'react-bootstrap/Table';
import Card from 'react-bootstrap/Card';
import Container from 'react-bootstrap/Container';
import Form from 'react-bootstrap/Form';
import { DropdownButton, Dropdown } from 'react-bootstrap';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { FaUserCircle } from "react-icons/fa";
import { faCar, faCoins, faUser, faFileInvoiceDollar } from '@fortawesome/free-solid-svg-icons';
import {db} from "../config/firebase"
import {doc, getDoc, collection, query, where, getDocs} from 'firebase/firestore';
import UserContext from '../UserContext';
import OperatorReserve from './operatorReserve';
import {
  MDBCol,
  MDBContainer,
  MDBRow,
  MDBCard,
  MDBCardText,
  MDBCardBody,
  MDBCardImage,
  MDBBtn,
  MDBTypography,
} from 'mdb-react-ui-kit';
function OperatorDashboard() {
  const { user } = useContext(UserContext);
  const [agentFirst, setAgentFirstName] = useState(user.firstName || "");
  const [agentLastName, setAgentLastName] = useState(user.lastName || "");
  const agentFullName = `${agentFirst} ${agentLastName}`;
  const [data, setData] = useState([]);

  const [totalUsers, setTotalUsers] = useState(0);
  
  const navigate = useNavigate();
  const location = useLocation();

  const [parkingPay, setParkingPay] = useState(0);
  const [numberOfParkingLots, setNumberOfParkingLots] = useState(0);
  const [totalSlots, setTotalSlots] = useState(0); 
  const [parkingLogs, setParkingLogs] = useState([]);
  const totalRevenues = totalUsers * parkingPay;
  const styles = {
    welcomeMessage: {
      position: "absolute",
      top: "10px",
      right: "10px",
      margin: "0",
      color: "#fff",
      fontFamily: "Rockwell, sans-serif",
      textShadow: "2px 2px 4px rgba(0, 0, 0, 0.5)",
    },
    icon: {
      marginRight: "5px",
    },
  };

  useEffect(() => {
    
    const fetchEstablishmentData = async () => {
      try {
        
        const q = query(collection(db, 'establishments'), where('managementName', '==', user.managementName));
        const querySnapshot = await getDocs(q);
  
        console.log(`Found ${querySnapshot.docs.length} documents`); 
  
        if (!querySnapshot.empty) {
          const establishmentData = querySnapshot.docs[0].data(); 
          console.log('Establishment Data:', establishmentData); 
          setParkingPay(establishmentData.parkingPay);
          setTotalSlots(establishmentData.totalSlots);
        } else {
          console.log('No matching establishment found!');
        }
      } catch (error) {
        console.error('Error fetching establishment data:', error);
      }
    };
  
    if (user && user.managementName) {
      fetchEstablishmentData();
    }
  }, [user]);

  useEffect(() => {
    const fetchParkingLogs = async () => {
      try {
        
        const currentUserManagementName = user.managementName;
        const logsCollectionRef = collection(db, 'logs');
        
        const q = query(logsCollectionRef, where("managementName", "==", currentUserManagementName));
  
        const querySnapshot = await getDocs(q);
        const logs = [];
        querySnapshot.forEach((doc) => {
          logs.push({ id: doc.id, ...doc.data() });
        });
        setParkingLogs(logs);  
        const totalUser = logs.length;
        setTotalUsers(totalUser);
      } catch (error) {
        console.error("Error fetching parking logs: ", error);
      }
    };

  
   
    if (user && user.managementName) {
      fetchParkingLogs();
    }
  }, [user, db]);

  
  
  return (
    <div className="gradient-custom-2" style={{ backgroundColor: 'white' }}>
    <nav className="navbar navbar-expand-lg navbar-dark" style={{ backgroundColor: "#003851" }}>
      <div className="container">
        <a className="navbar-brand" style={{padding: 20}}>
    
        </a>
        
        <p style={styles.welcomeMessage}>
          <DropdownButton
            alignRight
            variant="outline-light"
            title={<FaUserCircle style={styles.icon} />}
            id="dropdown-menu"
          >
             <Dropdown.Item href="ViewSpace"><img
                      src="slot1.jpeg"
                      alt="Operator Parking Slot Logo"
                      style={{ width: '20px', marginRight: '10px'}}
                    />Dashboard</Dropdown.Item>
            <Dropdown.Item href="OperatorDashboard"><img
                      src="dashboard.jpg"
                      alt="Operator Dashboard Logo"
                      style={{ width: '20px', marginRight: '10px'}}
                    />Records</Dropdown.Item>
            <Dropdown.Divider />
            <Dropdown.Item href="/"><img
                      src="logout.png"
                      alt="Operator Logout Logo"
                      style={{ width: '20px', marginRight: '10px'}}
                    />Logout</Dropdown.Item>
          </DropdownButton>
        </p>
      </div>
    </nav>
    <MDBContainer className="py-4">
  <MDBRow>
    <MDBCol lg="4">
      <OperatorReserve />
    </MDBCol>
    <MDBCol lg="8">

      <div className="container text-center" style={{ marginTop: '30px', fontFamily: 'Courier New', fontSize: '30px'}}>
      </div>
      <div className="row mt-3 ">
        <div className="col-md-3">
          <Card> 
            <Card.Body>
              <Card.Title style={{fontFamily:'Courier New', textAlign:'center'}}> <FontAwesomeIcon icon={faCar} color="green"/> Parking Availability</Card.Title>
              <Card.Text style={{ textAlign: 'center', margin: '0 auto', fontFamily:'Copperplate', fontSize:'20px' }}>{totalSlots}</Card.Text>
            </Card.Body>
          </Card>
        </div>
        <div className="col-md-3">
          <Card>
            <Card.Body>
              <Card.Title style={{fontFamily:'Courier New', textAlign:'center'}}><FontAwesomeIcon icon={faCoins} color="red"/> Total Revenues</Card.Title>
              <Card.Text style={{ textAlign: 'center', margin: '0 auto', fontFamily:'Copperplate', fontSize:'20px' }}>{totalRevenues}</Card.Text>
            </Card.Body>
          </Card>
        </div>
        <div className="col-md-3">
          <Card>
            <Card.Body>
              <Card.Title style={{fontFamily:'Courier New', textAlign:'center'}}><FontAwesomeIcon icon={faUser} color="blue" /> Total Users today</Card.Title>
              <Card.Text style={{ textAlign: 'center', margin: '0 auto', fontFamily:'Copperplate', fontSize:'20px' }}>{totalUsers}</Card.Text>
            </Card.Body>
          </Card>
        </div>
        <div className="col-md-3">
          <Card>
            <Card.Body>
              <Card.Title style={{fontFamily:'Courier New', textAlign:'center'}}><FontAwesomeIcon icon={faFileInvoiceDollar} color="orange"/> Parking Payment</Card.Title>
              <Card.Text style={{ textAlign: 'center', margin: '0 auto', fontFamily:'Copperplate', fontSize:'20px' }}>{parkingPay}</Card.Text>
            </Card.Body>
          </Card>
        </div>  
      </div>
      <div style={{marginTop: '30px', textAlign: 'center', justifyContent: 'center',  width: '100%', fontFamily:'Garamond'}}>
          <Table responsive>
            <thead>
              <tr>
                <th>Name</th>
                <th>Vehicle</th>
                <th>Plate No</th>
                <th>Time In</th>
                <th>Time Out</th>
                <th>Payment Status</th>
              </tr>
            </thead>
            <tbody>
              {parkingLogs.map((log) => (
                <tr key={log.id}>
                  <td>{log.name}</td>
                  <td>{log.car}</td>
                  <td>{log.carPlateNumber}</td>
                  <td>{new Date(log.timeIn.seconds * 1000).toLocaleString()}</td>
                  <td>{new Date(log.timeIn.seconds * 1000).toLocaleString()}</td>
                  <td style={{ color: log.paymentStatusColor }}>{log.paymentStatus}</td>
                </tr>
              ))}
              
            </tbody>
            
          </Table>
          
          </div>
          </MDBCol>
          </MDBRow>

</MDBContainer>
          </div>

  );
}

export default OperatorDashboard;