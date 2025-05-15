CPSP Volunteer Management System
A full-stack web application for managing volunteer class registrations, tracking approved service hours, and managing user roles for volunteers, supervisors, and administrators.

Table of Contents
Overview
Features
Technologies Used
Installation
Environment Variables
Available API Routes
Database Schema
Running the Project
Future Improvements
Overview
The CPSP Volunteer Management System allows:

Students to register for volunteer classes.
Supervisors to approve submitted volunteer hours.
Admins to manage volunteer requests and view analytics.
Integration with MySQL for database management and Express for the backend API.
Features
Volunteer Registration: Students can register for different volunteering classes.
Log of Hours: View approved service hours with the ability to filter by class and export to PDF.
Supervisor Management: Supervisors can verify and approve or reject logged hours.
Admin Tools: Admins can manage registration requests and user roles.
Secure Authentication: Integration with Google OAuth for user authentication.
Responsive API: RESTful backend API built using Express and MySQL.
Technologies Used
Backend:
Node.js: JavaScript runtime.
Express: Web framework for Node.js.
MySQL: Relational database for storing volunteer data.
mysql2: Promise-based MySQL driver.
dotenv: Environment variable management.
cookie-parser: Cookie handling middleware.
Frontend:
React: For user interface and component-driven architecture.
Chart.js: Graphs for visualizing volunteer progress.
HTML/CSS: For styling and layout.

# Community Service Management Platform

This platform enables students to log community service hours, supervisors to verify them, and administrators to oversee and report submissions. Built with React for the frontend and SQL for the backend, the platform is deployed on Google Cloud Platform.

---

## 🚀 Getting Started

### 1. Start the Development Server

To run the application locally, follow these steps:

```bash
cd client       # Navigate to the React client directory
npm run build   # Builds the production-ready React app
npm start       # Launches the development server


