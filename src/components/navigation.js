import React, { useState, useEffect, useContext } from "react";
import { useLocation } from "react-router-dom";
import { DropdownButton, Dropdown, Button } from "react-bootstrap";
import { FaUserCircle } from "react-icons/fa";
import Card from "react-bootstrap/Card";

import { MDBCol, MDBContainer, MDBRow, MDBCard, MDBCardText, MDBCardBody, MDBCardImage, MDBListGroup, MDBListGroupItem, MDBBtn, MDBTypography } from "mdb-react-ui-kit";
import UserContext from "../UserContext";
import { useNavigate, Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faChartColumn, faAddressCard, faPlus, faCar, faUser, faCoins, faFileInvoiceDollar } from "@fortawesome/free-solid-svg-icons";
import { auth, db } from "../config/firebase";
import { updateDoc, doc, getDoc } from "firebase/firestore";
import { storage } from "../config/firebase";
import { ref, uploadBytes, getDownloadURL, listAll, list } from "firebase/storage";
import { v4 } from "uuid";

const Navigation = () => {
    const navigate = useNavigate();
    const { user } = useContext(UserContext);
    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState(user.managementName || "");
    const [managementName, setManagementName] = useState(user.managementName || "");
    const [address, setAddress] = useState(user.companyAddress || "");
    const [companyContact, setCompanyContact] = useState(user.contact || "");
    const [companyEmail, setCompanyEmail] = useState(user.email || "");
    const [profileImageUrl, setProfileImageUrl] = useState("");
    const [imageUpload, setImageUpload] = useState(null);

    const userDocRef = auth.currentUser ? doc(db, "establishments", auth.currentUser.uid) : null;
    const listItemStyle = {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "10px 15px",
        transition: "background-color 0.3s ease",
        cursor: "pointer",
        backgroundColor: "#FFFFFF",
        border: "none",
        boxShadow: "none",
    };
    const toggleEditing = () => {
        setIsEditing(!isEditing);
    };
    const imageSizeStyles = {
        width: "100%",
        height: "200px", // Set the desired height for all images
        objectFit: "cover",
        borderRadius: "10px", // Set the desired border radius
    };
    const updateUserData = async () => {
        try {
            if (auth.currentUser) {
                const userId = auth.currentUser.uid;
                const userDocRef = doc(db, "establishments", userId);

                const updatedData = {
                    managementName: name,
                    address: address,
                    contact: companyContact,
                    email: companyEmail,
                };

                await updateDoc(userDocRef, updatedData);

                console.log("User data updated/created successfully!");
            } else {
                console.error("User not authenticated");
            }
        } catch (error) {
            console.error("Error updating user data: ", error);
        }
    };
    const handleSaveProfile = () => {
        console.log(auth.currentUser);
        setIsEditing(false);
        updateUserData();
    };
    const uploadFile = () => {
        if (imageUpload && auth.currentUser) {
            const imageRef = ref(storage, `images/${imageUpload.name + v4()}`);
            uploadBytes(imageRef, imageUpload).then((snapshot) => {
                getDownloadURL(snapshot.ref).then((url) => {
                    setProfileImageUrl(url);
                    saveProfileImageUrl(url);
                });
            });
        }
    };
    const saveProfileImageUrl = async (url) => {
        if (userDocRef) {
            await updateDoc(userDocRef, {
                profileImageUrl: url,
            });
        }
    };
    const listItemHoverStyle = {
        backgroundColor: "#003851",
    };
    const handleButtonClick = () => {
        navigate("/TicketInfo");
    };

    const handleViewProfile = () => {
        navigate("/Profiles");
    };

    const handleAgentSchedule = () => {
        navigate("/AgentSchedule");
    };

    const handleRevenues = () => {
        navigate("/Tracks");
    };

    const handleRegister = () => {
        navigate("/AgentRegistration");
    };

    const handleFeed = () => {
        navigate("/Feedback");
    };

    const handleProfile = () => {
        navigate("/Profiles");
    };
    const customListItemStyle = {
        border: "none", // Remove border from list items
        backgroundColor: "#FFFFFF",
    };
    const handlelogin = () => {
        navigate("/");
    };
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
    return (
        <MDBCard style={{ marginTop: "45px", color: "#fff" }}>
            <MDBCardBody className="text-center">
                <p style={{ fontFamily: "Georgina", fontSize: "25px", color: "black", border: "white", fontWeight: "bold" }}>Administrator</p>
                {profileImageUrl ? <MDBCardImage src={profileImageUrl} alt="Operator Profile Logo" className="rounded-circle" style={{ width: "70px" }} fluid /> : <MDBCardImage src="default_placeholder.jpg" alt="Default Profile Logo" className="rounded-circle" style={{ width: "70px" }} fluid />}
                <p className="text-muted mb-1" style={{ fontFamily: "Georgina", marginTop: "15px", color: "black", fontWeight: "bold" }}>
                    {managementName}
                </p>
                <p className="text-muted mb-4" style={{ fontFamily: "Georgina", fontWeight: "bold" }}>
                    {address}
                </p>
            </MDBCardBody>

            <MDBCard className="mb-4 mb-lg-0" style={{ marginTop: "40px", boxShadow: "none", border: "none" }}>
                <MDBCardBody className="p-0">
                    <MDBListGroup
                        flush
                        className="rounded-3"
                        style={{
                            border: "none",
                            borderRadius: "none",
                            boxShadow: "none",
                        }}
                    >
                        <MDBListGroupItem style={{ ...listItemStyle, ...customListItemStyle }} hover className="d-flex justify-content-between align-items-center p-3" onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = listItemHoverStyle.backgroundColor)} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "inherit")}>
                            <MDBCardText onClick={() => handleAgentSchedule()} style={{ fontFamily: "Georgina", fontSize: "18px", color: "black" }}>
                                <img src="calendar.webp" alt="Calendar" style={{ width: "25px", marginRight: "30px" }} />
                                Agent Schedule
                            </MDBCardText>
                        </MDBListGroupItem>
                        <MDBListGroupItem style={{ ...listItemStyle, ...customListItemStyle }} hover className="d-flex justify-content-between align-items-center p-3" onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = listItemHoverStyle.backgroundColor)} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "inherit")}>
                            <MDBCardText onClick={() => handleRegister()} style={{ fontFamily: "Georgina", fontSize: "18px", color: "black" }}>
                                <img src="registerA.jpg" alt="User" style={{ width: "25px", marginRight: "30px" }} />
                                Register Ticket Operator
                            </MDBCardText>
                        </MDBListGroupItem>
                        <MDBListGroupItem style={{ ...listItemStyle, ...customListItemStyle }} hover className="d-flex justify-content-between align-items-center p-3" onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = listItemHoverStyle.backgroundColor)} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "inherit")}>
                            <MDBCardText onClick={() => handleViewProfile()} style={{ fontFamily: "Georgina", fontSize: "18px", color: "black" }}>
                                <img src="pofile.jpg" alt="Profile" style={{ width: "25px", marginRight: "30px" }} />
                                View Profile
                            </MDBCardText>
                        </MDBListGroupItem>
                        <MDBListGroupItem style={{ ...listItemStyle, ...customListItemStyle }} hover className="d-flex justify-content-between align-items-center p-3" onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = listItemHoverStyle.backgroundColor)} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "inherit")}>
                            <MDBCardText onClick={() => handleRevenues()} style={{ fontFamily: "Georgina", fontSize: "18px", color: "black" }}>
                                <img src="management.jpg" alt="Management" style={{ width: "25px", marginRight: "30px" }} />
                                Management Details
                            </MDBCardText>
                        </MDBListGroupItem>
                        <MDBListGroupItem style={{ ...listItemStyle, ...customListItemStyle }} hover className="d-flex justify-content-between align-items-center p-3" onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = listItemHoverStyle.backgroundColor)} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "inherit")}>
                            <MDBCardText onClick={() => handleFeed()} style={{ fontFamily: "Georgina", fontSize: "18px", color: "black" }}>
                                <img src="feedback.jpg" alt="Feedback" style={{ width: "25px", marginRight: "30px" }} />
                                Feedback
                            </MDBCardText>
                        </MDBListGroupItem>
                        <Button onClick={handlelogin} style={{ fontFamily: "Georgina", width: "80px", backgroundColor: "rgba(4, 55,55, 0.7)", marginLeft: "80px", marginTop: "75px", border: "none" }}>
                            pullout
                        </Button>
                    </MDBListGroup>
                </MDBCardBody>
            </MDBCard>
        </MDBCard>
    );
};

export default Navigation;
