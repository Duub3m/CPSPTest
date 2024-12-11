import React, { useState } from "react";

import "./Form.css";

const Registration = () => {
  const [page, setPage] = useState(1);
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
  });

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const nextPage = () => setPage((prev) => Math.min(prev + 1, 4));
  const prevPage = () => setPage((prev) => Math.max(prev - 1, 1));

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Form Submitted:", formData);
    alert("Form Submitted!");
  };

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
                <option value="RSSW 190">RSSW 190</option>
                <option value="RSSW 291">RSSW 291</option>
                <option value="RSSW 290">RSSW 290</option>
                <option value="RSSW 390">RSSW 390</option>
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
          </div>
        )}

        <div className="form-navigation">
          {page > 1 && <button type="button" onClick={prevPage}>Previous</button>}
          {page < 4 && <button type="button" onClick={nextPage}>Next</button>}
          {page === 4 && <button type="submit">Submit</button>}
        </div>
      </form>
    </div>
  );
};

export default Registration;