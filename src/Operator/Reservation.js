import React, { useState, useEffect, useContext } from "react";
import { collection, query, where, getDocs, doc, getDoc, setDoc, deleteDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { db, auth } from "../config/firebase";
import { MDBCol, MDBContainer, MDBRow, MDBCard, MDBCardText, MDBCardBody, MDBCardImage, MDBListGroup, MDBListGroupItem } from "mdb-react-ui-kit";
import UserContext from "../UserContext";
import OperatorReserve from "./operatorReserve";

const Reservation = () => {

    const { user } = useContext(UserContext);
    const [reservationRequests, setReservationRequests] = useState([]);
    const [historyLog, setHistoryLog] = useState([]);
    const [selectedReservation, setSelectedReservation] = useState(null);
    const [userNames, setUserNames] = useState({});
    const [selectedSlotIndex, setSelectedSlotIndex] = useState(null);
    const [currentSetIndex, setCurrentSetIndex] = useState(0);
    const [slotSets, setSlotSets] = useState([]);

    const fetchReservations = async (managementName) => {
        console.log("Fetching reservations for managementName:", managementName);
        const q = query(collection(db, "reservations"), where("managementName", "==", managementName));
        try {
            const querySnapshot = await getDocs(q);
            const reservationPromises = querySnapshot.docs.map(async (reservationDoc) => {
                const slotId = reservationDoc.data().slotId;
                const userEmail = reservationDoc.data().userEmail;

                // Fetch the floor name from the slotData sub-document
                const slotDocRef = doc(db, "slot", managementName, "slotData", `slot_${slotId}`);
                const slotDocSnapshot = await getDoc(slotDocRef);

                // Fetch user data
                const userQuery = query(collection(db, "user"), where("email", "==", userEmail));
                const userSnapshot = await getDocs(userQuery);
                const userData = userSnapshot.docs[0]?.data();

                setUserNames((prevUserNames) => ({
                    ...prevUserNames,
                    [userEmail]: userData?.name || "N/A",
                }));

                return {
                    id: reservationDoc.id,
                    name: reservationDoc.data().name,
                    userName: userData?.name || "N/A", // Add the userName property
                    plateNumber: userData?.carPlateNumber || "N/A",
                    slot: typeof slotId === "string" ? slotId.slice(1) : "N/A",
                    slotId: slotId,
                    timeOfRequest: new Date(reservationDoc.data().timestamp.seconds * 1000).toLocaleTimeString("en-US", { hour12: true, hour: "numeric", minute: "numeric" }),
                };
            });
            const reservations = await Promise.all(reservationPromises);
            console.log("Fetched reservations:", reservations);
            setReservationRequests(reservations);
        } catch (error) {
            console.error("Error fetching reservations:", error);
        }
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser && user?.managementName) {
                console.log("User authenticated. Fetching reservations...");
                fetchReservations(user.managementName);
            } else {
                console.log("User not authenticated or managementName is null.");
                setReservationRequests([]);
            }
        });

        return () => unsubscribe();
    }, [user?.managementName]);

    useEffect(() => {
        localStorage.setItem("reservationRequests", JSON.stringify(reservationRequests));
    }, [reservationRequests]);

    useEffect(() => {
        const storedHistoryLog = JSON.parse(localStorage.getItem("historyLog"));
        if (storedHistoryLog) {
            setHistoryLog(storedHistoryLog);
        }
    }, []);

    const getContinuousSlotNumber = (currentSetIndex, index) => {
        let previousSlots = 0;
        for (let i = 0; i < currentSetIndex; i++) {
            previousSlots += slotSets[i].slots.length;
        }
        return previousSlots + index + 1;
    };

    const handleReservation = async (accepted, reservationRequest, index) => {
        const { id, userName, plateNumber, slotId, timeOfRequest } = reservationRequest;
        const status = accepted ? "Accepted" : "Declined";

        // Create a log entry for the history
        const logEntry = {
            status,
            name: userName,
            plateNumber,
            slotId,
            timeOfRequest,
        };

        // Update the history log in state and local storage
        setHistoryLog([logEntry, ...historyLog]);
        localStorage.setItem("historyLog", JSON.stringify([logEntry, ...historyLog]));

        if (accepted) {
            const previousSlot = getContinuousSlotNumber(currentSetIndex, index);
            const uniqueSlotId = `${index}`;
            const userDetails = {
                name: userName,
                plateNumber,
                slotId,
            };

            const slotDocRef = doc(db, "res", user.managementName, "resData", `slot_${slotId}`);

            try {
                // Set user details in slotData and mark the slot as occupied
                await setDoc(
                    slotDocRef,
                    {
                        userDetails,
                        slotId,
                        status: "Occupied",
                        timestamp: new Date(),
                    },
                    { merge: true }
                );

                // Remove the reservation from the 'reservations' collection
                const reservationDocRef = doc(db, "reservations", id);
                await deleteDoc(reservationDocRef);

                console.log(`Reservation accepted for slot ${slotId} and moved to slotData.`);
                alert(`Reservation accepted for ${userName} at slot ${slotId}`);
            } catch (error) {
                console.error("Error accepting reservation and updating slotData:", error);
                alert("Failed to accept the reservation. Please try again.");
            }
        } else {
            // Code for declining the reservation
            try {
                // Update the reservation status to 'Declined' in Firebase
                const reservationDocRef = doc(db, "reservations", id);
                await setDoc(reservationDocRef, { status: "Declined" }, { merge: true });

                console.log(`Reservation declined for ${userName}.`);
                alert(`Reservation declined for ${userName}.`);
            } catch (error) {
                console.error("Error updating reservation status:", error);
                alert("Failed to update the reservation status. Please try again.");
            }
        }

        // Remove the reservation from the list in state (for both accept and decline)
        const updatedRequests = reservationRequests.filter((_, i) => i !== index);
        setReservationRequests(updatedRequests);

        // Update local storage only for accepted reservations
        if (accepted) {
            localStorage.setItem("reservationRequests", JSON.stringify(updatedRequests));
        }

        // Update the selected reservation state if needed
        setSelectedReservation({
            status,
            name: userName,
            plateNumber,
            slotId,
            timeOfRequest,
        });
    };

    const HistoryLog = () => (
        <div className="history-log mt-4" style={{ maxHeight: "550px", overflow: "scroll", marginLeft: "20px", backgroundColor: "white"}}>
            {historyLog.map((logEntry, index) => (
                <div className={`alert ${logEntry.status === "Accepted" ? "alert-success" : "alert-danger"} mt-2`} key={index}>
                    <strong>{logEntry.status}:</strong> {logEntry.name} requested a reservation on {logEntry.slotId}. Plate Number: {logEntry.plateNumber}, Slot: {logEntry.slotId}
                </div>
            ))}
        </div>
    );

    const ReservationRequest = ({ request, index }) => (
        <div className="reservation-request mb-4 border p-3 rounded bg-light" key={request.plateNumber}>
            <h4 className="mb-0">Name: {request.userName}</h4>
            <p className="text-muted mb-2">Time of Request: {request.timeOfRequest}</p>
            <p>Plate Number: {request.plateNumber}</p>
            <p>Slot Number: {request.slotId}</p>
            <div className="d-flex flex-column align-items-center mt-2">
                <button className="btn btn-success" onClick={() => handleReservation(true, request, index)}>
                    Accept Reservation
                </button>
                <button className="btn btn-danger mt-2" onClick={() => handleReservation(false, request, index)}>
                    Decline Reservation
                </button>
            </div>
        </div>
    );

    return (
        <section
            style={{
                backgroundSize: "cover",
                backgroundRepeat: "no-repeat",
                minHeight: "100vh",
                backgroundColor: "white", // Set a background color in case the image is not fully loaded
            }}
        >
            <div>
                <nav className="navbar navbar-expand-lg navbar-dark" style={{ backgroundColor: "#003851" }}>
                    <div className="container">
                        <a className="navbar-brand" style={{padding: 20}}>
                       
                        </a>
                    </div>
                </nav>

                <MDBContainer className="py-4">
                    <MDBRow>
                        <MDBCol lg="4">
                            <OperatorReserve />
                        </MDBCol>
                        <MDBCol lg="4">
                <div className="container mt-5 d-flex flex-column align-items-center justify-content-center">
                    <h3 className="text-center mb-4" style={{ color: "black" }}>
                        Parking Reservation Management
                    </h3>
                    <div className="reservation-requests d-flex flex-column align-items-center mb-4" style={{ width: "600px", height: "60vh", overflowY: "scroll", padding: "10px", marginLeft: "20px", background: "white" }}>
                        {reservationRequests.length === 0 ? (
                            <p>No reservation</p>
                        ) : (
                            reservationRequests.map((request, index) => (
                                <ReservationRequest
                                    request={request}
                                    index={index}
                                    key={index}
                                    slotIndex={request.slotId} // Pass the slotId as slotIndex
                                />
                            ))
                        )}
                        
                    </div>
                    
                

                </div>
                </MDBCol>
                
                <MDBCol lg="4">
                <h3 className="text-center mb-3" style={{ color: "black", marginTop: "50px" }}>
                        Accepted/Declined Reservations
                    </h3>
                    <nav className="navbar navbar-expand-lg navbar-dark" style={{ backgroundColor: "white" }}>
                    <HistoryLog />
                    </nav>
                    </MDBCol>
                    </MDBRow>

                </MDBContainer>
            </div>
        </section>
    );
};

export default Reservation;
