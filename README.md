# Digital Museums - A Full-Stack Web Application

This project is a comprehensive web portal designed for museum enthusiasts. It provides a platform for users to discover museums, access detailed information, and manage their own personalized collections of places they wish to visit or have already explored.

**Live Demo:** [**https://dijitalmuzeler.onrender.com**](https://dijitalmuzeler.onrender.com)

---

## Key Features

* **User Authentication:** Secure user registration and login system using session-based authentication.
* **Museum Discovery:** Browse a dynamic list of museums fetched from the database.
* **Detailed Views:** Click on any museum to see its full description, images, and other details.
* **Personalized Lists:**
    * **Wishlist:** Add museums you plan to visit in the future.
    * **Visited List:** Keep a record of the museums you have already explored.
* **Interactive Profile Page:** An intuitive user profile page to view and manage both lists, with features to seamlessly move items between the wishlist and visited list, or remove them entirely.

---

## Technology Stack

This project was built from scratch to demonstrate core web development skills.

* **Backend:**
    * Node.js
    * Express.js (for routing and API endpoints)
    * `express-session` & `connect-mongo` (for managing user sessions)

* **Frontend:**
    * HTML5
    * CSS3
    * Vanilla JavaScript (DOM Manipulation, Fetch API for asynchronous requests)

* **Database:**
    * MongoDB (NoSQL Database)
    * Mongoose (Object Data Modeling - ODM)

* **Deployment:**
    * Render

---

## Setup and Local Installation

To run this project on your local machine, follow these steps:

1.  **Clone the repository:**
    ```sh
    git clone [https://github.com/deniztkl/Web-Project.git](https://github.com/deniztkl/Web-Project.git)
    ```
2.  **Navigate to the project directory:**
    ```sh
    cd Web-Project
    ```
3.  **Install the dependencies:**
    ```sh
    npm install
    ```
4.  **Create a `.env` file** in the root directory and add the following environment variables:
    ```
    MONGO_URI="your_mongodb_connection_string"
    SESSION_SECRET="your_strong_session_secret"
    ```
5.  **Start the server:**
    ```sh
    node server.js
    ```
6.  Open your browser and go to `http://localhost:3000`.
