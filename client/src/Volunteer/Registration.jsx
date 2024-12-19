import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../Registration.css";

const Registration = () => {
  const [page, setPage] = useState(1); // Track the current page
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    gender: "",
    age: "",
    ethnicity: "",
    ualbanyEmail: "",
    personalEmail: "",
    phoneNumber: "",
    ualbanyId: "",
    academicStanding: "",
    major: "",
    minor: "",
    semester: "",
    year: "",
    course: "",
    organization: "",
    supervisorEmail: "",
  });

  const [isPageValid, setIsPageValid] = useState(false); // Validation for the current page
  const navigate = useNavigate(); // React Router navigation

  // Fetch logged-in user data and prefill fields
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_SERVER_URL}/auth/logged_in`, {
          credentials: "include",
        });
        const userData = await response.json();

        if (userData.loggedIn) {
          setFormData((prev) => ({
            ...prev,
            firstName: userData.user.first_name || "",
            lastName: userData.user.last_name || "",
            personalEmail: userData.user.email || "",
          }));
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
  }, []);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const nextPage = () => {
    if (isPageValid) {
      setPage((prev) => Math.min(prev + 1, 4));
    } else {
      alert("Please fill out all required fields before proceeding.");
    }
  };

  const prevPage = () => setPage((prev) => Math.max(prev - 1, 1));

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    try {
      // Check if the user is already registered for the selected class
      const checkEnrollmentResponse = await fetch(
        `${process.env.REACT_APP_MYSQL_SERVER_URL}/api/volunteer-classes/check-enrollment`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            volunteer_email: formData.personalEmail,
            course_name: formData.course,
            semester: formData.semester,
          }),
        }
      );
  
      const checkEnrollmentData = await checkEnrollmentResponse.json();
  
      if (checkEnrollmentData.isEnrolled) {
        alert("You are already registered for this course.");
        return;
      }
  
      // Prepare data for API submission
      const payload = {
        volunteer_email: formData.personalEmail,
        first_name: formData.firstName,
        last_name: formData.lastName,
        semester: formData.semester,
        year: formData.year,
        course_name: formData.course,
        organization: formData.organization,
        supervisor_email: formData.supervisorEmail,
        status: "Pending Supervisor Approval", // Initial status for supervisor approval
      };
  
      // Submit the registration request
      const response = await fetch(
        `${process.env.REACT_APP_MYSQL_SERVER_URL}/api/registration-requests`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );
  
      if (!response.ok) {
        throw new Error("Failed to submit registration request.");
      }
  
      alert(
        "Your registration request has been submitted. It is pending approval from your supervisor."
      );
      navigate("/Profile"); // Redirect to the Profile page
    } catch (error) {
      console.error("Error submitting registration request:", error);
      alert("An error occurred during registration. Please try again.");
    }
  };  
  
  // Validate fields on the current page
  useEffect(() => {
    const validatePage = () => {
      const requiredFields = {
        1: ["firstName", "lastName", "gender", "age", "ethnicity"],
        2: ["ualbanyEmail", "personalEmail", "phoneNumber"],
        3: ["ualbanyId", "academicStanding", "major"],
        4: ["semester", "year", "course", "organization", "supervisorEmail"],
      };

      const currentPageFields = requiredFields[page];
      const isValid = currentPageFields.every((field) => formData[field]?.trim() !== "");
      setIsPageValid(isValid);
    };

    validatePage();
  }, [page, formData]);

  return (
    <div className="form-container">
      <form onSubmit={handleSubmit}>
        {page === 1 && (
          <div className="form-page">
            <h2>Personal Information</h2>
            <div className="form-group">
              <label>First Name</label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Last Name</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Gender</label>
              <input
                type="text"
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Age</label>
              <input
                type="number"
                name="age"
                value={formData.age}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Ethnicity</label>
              <select
                name="ethnicity"
                value={formData.ethnicity}
                onChange={handleInputChange}
                required
              >
                <option value="">Select Ethnicity</option>
                <option value="American Indian/Alaskan">American Indian/Alaskan</option>
                <option value="Black—Not Hispanic">Black—Not Hispanic</option>
                <option value="White—Not Hispanic">White—Not Hispanic</option>
                <option value="Asian or Pacific Islander">Asian or Pacific Islander</option>
                <option value="Hispanic">Hispanic</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>
          </div>
        )}

        {page === 2 && (
          <div className="form-page">
            <h2>Contact Information</h2>
            <div className="form-group">
              <label>UAlbany Email</label>
              <input
                type="email"
                name="ualbanyEmail"
                value={formData.ualbanyEmail}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Personal Email</label>
              <input
                type="email"
                name="personalEmail"
                value={formData.personalEmail}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Phone Number</label>
              <input
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>
        )}

        {page === 3 && (
          <div className="form-page">
            <h2>Student Information</h2>
            <div className="form-group">
              <label>UAlbany ID</label>
              <input
                type="text"
                name="ualbanyId"
                value={formData.ualbanyId}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Academic Standing</label>
              <select
                name="academicStanding"
                value={formData.academicStanding}
                onChange={handleInputChange}
                required
              >
                <option value="">Select Academic Standing</option>
                <option value="Freshman">Freshman</option>
                <option value="Sophomore">Sophomore</option>
                <option value="Junior">Junior</option>
                <option value="Senior">Senior</option>
                <option value="Non-Matriculated">Non-Matriculated</option>
              </select>
            </div>
            <div className="form-group">
              <label>Major</label>
              <input
                type="text"
                name="major"
                value={formData.major}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Minor</label>
              <input
                type="text"
                name="minor"
                value={formData.minor}
                onChange={handleInputChange}
              />
            </div>
          </div>
        )}

        {page === 4 && (
          <div className="form-page">
            <h2>Registration Details</h2>
            <div className="form-group">
              <label>Semester</label>
              <select
                name="semester"
                value={formData.semester}
                onChange={handleInputChange}
                required
              >
                <option value="">Select Semester</option>
                <option value="Fall">Fall</option>
                <option value="Spring">Spring</option>
                <option value="Summer">Summer</option>
              </select>
            </div>
            <div className="form-group">
              <label>Year</label>
              <input
                type="number"
                name="year"
                value={formData.year}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Course</label>
              <select
                name="course"
                value={formData.course}
                onChange={handleInputChange}
                required
              >
                <option value="">Select Course</option>
                <option value="RSSW190">RSSW 190</option>
                <option value="RSSW291">RSSW 291</option>
                <option value="RSSW290">RSSW 290</option>
                <option value="RSSW390">RSSW 390</option>
              </select>
            </div>
            <div className="form-group">
              <label>Organization Where Volunteering</label>
              <input
                type="text"
                name="organization"
                value={formData.organization}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Supervisors Email</label>
              <input
                type="text"
                name="supervisorEmail"
                value={formData.supervisorEmail}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>
        )}

        <div className="form-navigation">
          {page > 1 && <button type="button" onClick={prevPage}>Previous</button>}
          {page < 4 && (
            <button
              type="button"
              onClick={() => nextPage()}
              disabled={!isPageValid}
            >
              Next
            </button>
          )}
          {page === 4 && <button type="submit">Submit</button>}
        </div>
      </form>
    </div>
  );
};

export default Registration;
