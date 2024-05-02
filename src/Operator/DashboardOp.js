import React, { useState, useEffect, useContext } from 'react';
import { db } from '../config/firebase';
import { collection, getDocs, doc, getDoc, setDoc, deleteDoc, query, where } from 'firebase/firestore';
import './DashboardOp.css';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import UserContext from '../UserContext';

function DashboardOp() {
    const [pendingAccounts, setPendingAccounts] = useState([]);
    const [establishments, setEstablishments] = useState([]);
    const [summaryCardsData, setSummaryCardsData] = useState([]);
    const [parkingSeeker, setParkingSeeker] = useState([]);
    const [agent, setAgent] = useState([]);
    const [activeCard, setActiveCard] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [userFound, setUserFound] = useState(true);
    const [userDetails, setUserDetails] = useState({});
    const [userPlateNumber, setUserPlateNumber] = useState("");
    const { user } = useContext(UserContext);
    const [errorMessage, setErrorMessage] = useState("");
    const [slotSets, setSlotSets] = useState([]);
    const [currentSetIndex, setCurrentSetIndex] = useState(0);
    const [totalParkingSpaces, setTotalParkingSpaces] = useState(0);
    const [floorOptions, setFloorOptions] = useState([]);
    

    const fetchTotalParkingSpaces = async () => {
        if (user && user.managementName) {
            const establishmentsRef = collection(db, "establishments");
            const q = query(establishmentsRef, where("managementName", "==", user.managementName));
            const querySnapshot = await getDocs(q);
            let totalSpaces = 0;
            querySnapshot.forEach(doc => {
                const data = doc.data();
                if (data.totalSlots) {
                    totalSpaces += parseInt(data.totalSlots, 10);
                }
            });
            setTotalParkingSpaces(totalSpaces);
            console.log("Total number of Spaces", totalSpaces);
        }
    };

    useEffect(() => {
        fetchTotalParkingSpaces();
    }, [user]);  
    
    const fetchFloors = async () => {
        if (user && user.managementName) {
            const establishmentsRef = collection(db, "establishments");
            const q = query(establishmentsRef, where("managementName", "==", user.managementName));
            const querySnapshot = await getDocs(q);
            let allFloors = [];
            let totalSlots = 0;
    
            querySnapshot.forEach(doc => {
                const data = doc.data();
                if (data.floorDetails) {
                    data.floorDetails.forEach(floorDetail => {
                        const parkingLots = parseInt(floorDetail.parkingLots, 10);
                        if (!isNaN(parkingLots) && parkingLots > 0) {
                            allFloors.push({
                                ...floorDetail,
                                slots: new Array(parkingLots).fill({ occupied: false })
                            });
                        } else {
                            console.error('Invalid parking lots number:', floorDetail.parkingLots);
                        }
                    });
                }
            });
            console.log("Fetched Floors:", allFloors);
            setFloorOptions(allFloors);
            setTotalParkingSpaces(totalSlots);
        }
    };
    
    useEffect(() => {
        console.log("Slot Sets Updated:", slotSets);
    }, [slotSets]);

    useEffect(() => {
        const initializedSlots = floorOptions.map(floor => ({
            ...floor,
            slots: new Array(parseInt(floor.parkingLots, 10)).fill({occupied: false})
        }));
        setSlotSets(initializedSlots);
        console.log("Initialized slot sets:", initializedSlots);
    }, [floorOptions]);
    
    useEffect(() => {
        fetchFloors();
    }, [user]); // Refetch when the user object changes
    

    const handleAddToSlot = async (carPlateNumber, slotIndex) => {
        if (!carPlateNumber) {
            setErrorMessage("Please enter a plate number.");
            return;
        }
    
        if (!userFound) {
            const confirmAssign = window.confirm("No record found. Do you want to proceed?");
            if (!confirmAssign) {
                return;
            }
        }
    
        if (!slotSets.length) {
            setErrorMessage("No slot sets available.");
            return;
        }
    
        if (currentSetIndex < 0 || currentSetIndex >= slotSets.length) {
            setErrorMessage("Invalid slot set selected.");
            return;
        }
    
        const floor = slotSets[currentSetIndex];
        if (!floor || !floor.slots || slotIndex < 0 || slotIndex >= floor.slots.length || isNaN(slotIndex)) {
            setErrorMessage(`Slot index ${slotIndex} is out of bounds or invalid.`);
            return;
        }
    
        // Ensure floorTitle is valid
        const floorTitle = floor.title;
        if (!floorTitle) {
            console.error("Floor title is undefined", { floor });
            setErrorMessage("Floor title is missing.");
            return;
        }
    
        const slotId = slotIndex + 1;  // Ensure slotId is a valid number
        if (isNaN(slotId)) {
            console.error("Computed slotId is NaN", { slotIndex });
            setErrorMessage("Invalid slot ID computed.");
            return;
        }
    
        const timeIn = new Date().toISOString(); 
    
        const updatedSlot = {
            occupied: true,
            userDetails: {
                ...userDetails,
                email: userDetails?.email || "",
                contactNumber: userDetails?.contactNumber || "",
                carPlateNumber: userDetails?.carPlateNumber || carPlateNumber,
                slotId: slotIndex,
                agent: `${user.firstName || ''} ${user.lastName || ''}`,
                floorTitle,
                timeIn,
            }
        };
    
        floor.slots[slotIndex] = updatedSlot;
        setSlotSets([...slotSets]); 
    
        try {
            console.log('Attempting to write to path:', 'establishments', user.managementName, 'floors', floorTitle, 'slots', slotId.toString());
            const slotDocRef = doc(db, 'establishments', user.managementName, 'floors', floorTitle, 'slots', slotId.toString());
            await setDoc(slotDocRef, updatedSlot, { merge: true });
            console.log(`Slot ${slotId} assigned and updated in Firebase for floor ${floorTitle}.`);
            setErrorMessage("");
        } catch (error) {
            console.error("Failed to update slot in Firebase:", error);
            setErrorMessage("Failed to update slot in Firebase.");
        }
    };
    
    const searchInFirebase = async (searchInput) => {
        try {
            const collectionRef = collection(db, 'user');
            const q = query(collectionRef, where('carPlateNumber', '==', searchInput));
            const querySnapshot = await getDocs(q);
    
            const user = querySnapshot.docs.find(doc => doc.data().carPlateNumber === searchInput);
    
            if (user) {
                console.log('Found user:', user.data());
                setUserPlateNumber(user.data().carPlateNumber);
                setUserDetails(user.data());
                setUserFound(true);
            } else {
                console.log('User not found.');
                setUserDetails({});
                setUserPlateNumber(searchInput);
                setUserFound(false);
            }
        } catch (error) {
            console.error('Error:', error);
        }
    };

    useEffect(() => {
        const fetchParkingUsers = async () => {
            const querySnapshot = await getDocs(collection(db, "user"));
            setParkingSeeker(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        };
        fetchParkingUsers();
        const fetchAgents = async () => {
            const querySnapshot = await getDocs(collection(db, "agents"));
            setAgent(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        };
        fetchAgents();
        const fetchEstablishments = async () => {
            const querySnapshot = await getDocs(collection(db, "establishments"));
            setEstablishments(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        };
        fetchEstablishments();
        const fetchPendingAccounts = async () => {
            const querySnapshot = await getDocs(query(collection(db, "pendingEstablishments")));
            setPendingAccounts(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        };
        fetchPendingAccounts();
    }, []);

    useEffect(() => {
        setSummaryCardsData([
            { title: 'Total Parking Spaces', value: `3 Total Parking Spaces`, imgSrc: 'pending.png', cardType: 'total' },
            { title: 'Occupied Spaces', value: `1 Occupied Spaces`, imgSrc: 'pending.png', cardType: 'occupied' },
            { title: 'Available Spaces', value: `2 Available Spaces`, imgSrc: 'check.png', cardType: 'available' },
            { title: 'Reserve Spaces', value: `0 Reserve Spaces`, imgSrc: 'check.png', cardType: 'reserve' },
            { title: 'Add Vehicle', imgSrc: 'check.png', cardType: 'agents' }
        ]);
    }, [pendingAccounts, establishments, parkingSeeker, agent]);

    const handleCardClick = (cardType) => {
        console.log(`Card clicked: ${cardType}`);
        setActiveCard(activeCard === cardType ? '' : cardType);
    };

    const renderFormBasedOnCardType = () => {
        let data = [];
        let headers = [];
        switch (activeCard) {
            case 'occupied':
                data = pendingAccounts || []; // Ensure data is an array
                headers = ["Email", "Contact Number", "Plate Number", "Slot Number"];
                return (
                    <table className="table align-middle mb-0 table-striped table-hover" style={{ maxWidth: '100%'}}> 
                    <thead className="bg-light">
                        <tr>
                        <th>Name</th>
                        <th>Contact Number</th>
                        <th>Plate Number</th>
                        <th>Position</th>
                        <th>Slot Number</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                        <td>
                            <div className="d-flex align-items-center">
                            <img
                                src="https://mdbootstrap.com/img/new/avatars/8.jpg"
                                alt=""
                                style={{ width: '45px', height: '45px' }}
                                className="rounded-circle"
                                />
                            <div className="ms-3">
                                <p className="fw-bold mb-1">gg</p>
                                <p className="text-muted mb-0">gg@gmail.com</p>
                            </div>
                            </div>
                        </td>
                        <td>
                            <p className="fw-normal mb-1">Software engineer</p>
                            <p className="text-muted mb-0">IT department</p>
                        </td>
                        <td>Senior</td>
                        <td>
                            <span className="badge badge-success rounded-pill d-inline" style={{color: '#39FF14'}}>Active</span>
                        </td>
                        <td>Senior</td>
                        <td>
                            <span className="badge badge-success rounded-pill d-inline" style={{color: '#39FF14'}}>Active</span>
                        </td>
                        <td>
                            <button type="button" className="btn btn-link btn-sm btn-rounded">
                            Edit
                            </button>
                        </td>
                        </tr>
                    </tbody>
                    </table>
                );
                break;
            case 'available':
                data = establishments || []; // Ensure data is an array
                headers = ["Location", "Slot Number"];
                break;
            case 'reserve':
                data = parkingSeeker || []; // Ensure data is an array
                headers = ["Email", "Plate Number", "Location", "Slot Number", "Date"];
                break;
            case 'agents':
                return <AddVehicleForm onSearch={searchInFirebase} floorOptions={floorOptions || []} handleAddToSlot={handleAddToSlot} />;
            default:
                return null;
        }
        return (
<div style={{ 
    overflowY: 'auto', 
    maxHeight: '50%', 
    maxWidth: '90%', 
    justifyContent: 'center', 
    margin: 'auto', 
    borderRadius: '2%', 
    borderRadius: 10,
    borderStyle: 'solid', // Set border style to solid
    borderColor: '#39FF14',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', // Box shadow for depth
   
    // Custom scrollbar design
  // Set the width of the scrollbar

  scrollbarColor: '#39FF14 #f8f9fa', // Set the color of the scrollbar thumb and track
    WebkitOverflowScrolling: 'touch', // Enable smooth scrolling on iOS
    '&::-webkit-scrollbar': {
        width: '20px', // Set the width of the scrollbar
        height: '20px', // Set the height of the scrollbar
    },
    '&::-webkit-scrollbar-thumb': {
        backgroundColor: '#98FB98', // Set the color of the scrollbar thumb
        borderRadius: '15px', // Set a larger border radius for a softer appearance
    },
    '&::-webkit-scrollbar-track': {
        backgroundColor: '#f8f9fa', // Set the color of the scrollbar track
        borderRadius: '15px', // Set a larger border radius for a softer appearance
    },
}}>
    <section className="intro">
        <div className="bg-image h-100" style={{ backgroundColor: '#132B4B' }}>
            <div className="mask d-flex align-items-center h-100">
                <div className="container">
                    <div className="row justify-content-center">
                        <div className="col-12">
                            <div >
                                <div className="card-body">
                                    <div className="table-responsive">
                                        <table className="table table-borderless mb-0">
                                            <thead>
                                                <tr>
                                                    <th cope="col" style={{ width: '10%', padding: '10px'}}>
                                                        <div className="form-check" >
                                                            <input className="form-check-input" type="checkbox" value="" id="flexCheckDefault" />
                                                        </div>
                                                    </th>
                                                    {headers.map((header, index) => (
                                                        <th scope="col" key={index}>{header.toUpperCase()}</th>
                                                    ))}
                                                    <th scope="col">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {data.map((item, index) => (
                                                    <tr key={index}>
                                                        <th scope="row">
                                                            <div className="form-check">
                                                                <input className="form-check-input" type="checkbox" value="" id={`flexCheckDefault${index}`} checked={item.checked} />
                                                            </div>
                                                        </th>
                                                        {headers.map((header, subIndex) => (
                                                            <td key={`${index}-${subIndex}`}>{item[header.toLowerCase().replace(/ /g, '')]}</td>
                                                        ))}
                                                        <td>
                                                            <button type="button" className="btn btn-danger btn-sm px-3" onClick={() => handleDecline(item.id)}>
                                                                <i className="fas fa-times">X</i>
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>
</div>

        );
    };

    
    const handleApprove = async (accountId) => {
        const accountRef = doc(db, "pendingEstablishments", accountId);
        const accountSnapshot = await getDoc(accountRef);
        const accountData = accountSnapshot.data();
      
    
        await setDoc(doc(db, "establishments", accountId), {
          ...accountData,
          createdAt: new Date(),
          isApproved: true
        });
      
        await deleteDoc(accountRef);
      
        setPendingAccounts(pendingAccounts.filter(account => account.id !== accountId));
      };

      const handleDecline = async (accountId) => {
      }
      
       
    return (
        <div>
        <div className="admin-dashboard">
            <div className="sidebar">
                <div className="admin-container">
                    <img 
                        src="customer.jpg"
                        alt="Admin"
                        className="admin-pic" 
                        style={{ width: '30px', marginRight: '5px', marginLeft: '-50px' }} 
                    />
                    {/* Display the user's email if available */}
                    <h1 style={{fontFamily:'Helvetica', fontSize: 16}}>Welcome {user?.firstName || 'No name found'}</h1>
                </div>
                <div class="wrapper">
    <div class="side">
        <h2>Menu</h2>
        <ul>
            <li><a href="DashboardOp"><i class="fas fa-home"></i>Home</a></li>
            <li><a href='Reservation'><i class="fas fa-user"></i>Manage Reservation</a></li>
            <li><a href='OperatorDashboard'><i class="fas fa-address-card"></i>Records</a></li>
            <li><a href="OperatorProfile"><i class="fas fa-blog"></i>Profile</a></li>
            <li><a href="/"><i className="fas fa-sign-out-alt" style={{ color: 'red' }}></i>Logout</a></li>
        </ul> 
    </div>
    </div>
      </div>
      <div className="main-content">
                <div className="summary-cards">
                    {summaryCardsData.map(card => (
                        <div key={card.title} className={`card card-${card.cardType}`} onClick={() => handleCardClick(card.cardType)}>
                            <img src={card.imgSrc} alt={card.title} className="card-image" />
                            <div className="card-content">
                                <div className="card-title">{card.title}</div>
                                <div className="card-value">{card.value}</div>
                            </div>
                        </div>
                    ))}
                </div>
                {renderFormBasedOnCardType()}
      </div>
    </div>       
    </div>
    );
}

function AddVehicleForm({ onSearch, floorOptions, handleAddToSlot }) {
    const [plateNumber, setPlateNumber] = useState('');
    const [selectedFloor, setSelectedFloor] = useState('');
    const [slotOptions, setSlotOptions] = useState([]);
    const [selectedSlot, setSelectedSlot] = useState('');

    useEffect(() => {
        console.log("Floor options updated:", floorOptions);
        if (floorOptions.length > 0) {
            setSelectedFloor(floorOptions[0].floorName); // Set default selected floor
        }
    }, [floorOptions]);

    useEffect(() => {
        if (selectedFloor) {
            const floor = floorOptions.find(f => f.floorName === selectedFloor);
            if (floor && !isNaN(parseInt(floor.parkingLots, 10))) {
                const slots = Array.from({ length: parseInt(floor.parkingLots, 10) }, (_, i) => i + 1);
                setSlotOptions(slots);
            } else {
                console.log("Invalid or missing data for floor:", selectedFloor);
                setSlotOptions([]);
            }
        }
    }, [selectedFloor, floorOptions]);

    const handleSearch = () => {
        if (plateNumber) {
            onSearch(plateNumber);
        } else {
            alert("Please enter a plate number to search.");
        }
    };

    const handleFloorChange = (e) => {
        setSelectedFloor(e.target.value);
    };

    const handleSlotSelection = (e) => {
        setSelectedSlot(e.target.value);
    };

    const handleSubmit = () => {
        if (!plateNumber) {
            alert("Please enter a plate number to search.");
            return;
        }
        let slotIndex = parseInt(selectedSlot) - 1; // Convert to zero-based index
        if (slotIndex < 0 || slotIndex >= slotOptions.length) {
            alert("Please select a valid slot.");
            return;
        }
        handleAddToSlot(plateNumber, slotIndex);
    };

    return (
<Form style={{ 
    border: '1px solid #ccc', // Add a border around the form
    padding: '20px', // Add some padding to the form
    borderRadius: '5px', // Add border radius for a softer appearance
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', // Add a box shadow for depth
    margin: 10
}}>
    <Row className="mb-3">
        <Form.Group as={Col} controlId="formGridEmail">
            <Form.Control type="email" placeholder="Enter email" />
        </Form.Group>
        <Form.Group as={Col} controlId="formGridPlateNumber">
            <Form.Control
                type="text"
                placeholder="Plate Number"
                value={plateNumber}
                onChange={(e) => setPlateNumber(e.target.value)}
            />
        </Form.Group>
    </Row>
    <Form.Group className="mb-3" controlId="formGridContactNumber">
        <Form.Control placeholder="Contact Number" />
    </Form.Group>
    <Row className="mb-3">
        <Form.Group as={Col} controlId="formGridTimeIn">
            <Form.Control placeholder="Time In" />
        </Form.Group>
        <Form.Group as={Col} controlId="formGridFloor">
            <Form.Select defaultValue="Choose..." onChange={handleFloorChange}>
                <option>Choose...</option>
                {floorOptions.map((floor, index) => (
                    <option key={index} value={floor.floorName}>{floor.floorName}</option>
                ))}
            </Form.Select>
        </Form.Group>
        <Form.Group as={Col} controlId="formGridSlotNumber">
            <Form.Select defaultValue="Select Slot" onChange={handleSlotSelection}>
                <option value="">Select Slot...</option>
                {slotOptions.map((slot, index) => (
                    <option key={index} value={slot}>{slot}</option>
                ))}
            </Form.Select>
        </Form.Group>
    </Row>
    <Button variant="primary" onClick={handleSubmit} style={{ backgroundColor: '#132B4B', color: '#fff', border: 'none', marginRight: '10px' }}>Assign Slot</Button>
    <Button variant="secondary" onClick={handleSearch}>Search</Button> 
</Form>
    );
}



export default DashboardOp;