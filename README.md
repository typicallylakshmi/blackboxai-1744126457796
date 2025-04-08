
Built by https://www.blackbox.ai

---

```markdown
# Event Management System

## Project Overview
The Event Management System is a comprehensive platform designed to streamline various aspects of event organization. It provides features such as authentication, budgeting, vendor management, attendee registration, task tracking, and payments, all designed to enhance the efficiency of planning and executing events.

## Installation

To set up the Event Management System on your local machine, follow these steps:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/event-management-system.git
   cd event-management-system
   ```

2. **Install the dependencies:**
   Make sure you have [Node.js](https://nodejs.org/) installed. Then run:
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   Create a `.env` file in the root directory and define your database configuration:
   ```
   DB_HOST=your_db_host
   DB_PORT=your_db_port
   DB_NAME=your_db_name
   DB_USER=your_db_user
   DB_PASSWORD=your_db_password
   PORT=8000
   ```

## Usage

To run the application, use the following command:
```bash
npm start
```

For development, you may want to use:
```bash
npm run dev
```

Once the server is running, you can access the API at `http://localhost:8000`.

## Features

- User authentication and authorization using JWT.
- Task management with the ability to create, update, and delete tasks.
- Budget tracking, including expense recording and analytics.
- Vendor management, allowing the addition, update, and rating of vendors.
- Attendee registration and preference management.
- Support for AI-generated recommendations and chatbot queries.

## Dependencies

The project has several dependencies as specified in `package.json`:

- `bcryptjs`: For password hashing.
- `cors`: To enable Cross-Origin Resource Sharing.
- `dotenv`: For environment variable management.
- `express`: The web framework for building APIs.
- `express-validator`: For validating incoming request data.
- `jsonwebtoken`: For generating and verifying JSON Web Tokens.
- `nodemailer`: For sending emails.
- `pg`: PostgreSQL client for Node.js.
- `pg-promise`: A promise-based library to interact with PostgreSQL.

### Development Dependencies

- `nodemon`: For automatically restarting the server during development.

## Project Structure

Here’s the structure of the project:

```
event-management-system/
├── node_modules/          # Contains all npm packages
├── public/                # Static files served to the client
├── routes/                # Express route handlers
│   ├── auth.js            # Authentication routes
│   ├── attendees.js       # Attendee management routes
│   ├── budgets.js         # Budget management routes
│   ├── tasks.js           # Task management routes
│   └── vendors.js         # Vendor management routes
├── .env                   # Environment configuration
├── db.js                  # Database connection setup
├── package.json           # Project metadata and dependencies
├── package-lock.json      # Exact versions of dependencies
└── server.js              # Entry point of the application
```

## Conclusion

The Event Management System provides a robust platform for managing events efficiently. The project is designed for scalability and maintainability. Contributions are welcome, and feel free to submit issues or feature requests.

For a complete test plan, please refer to `test_plan.md`.
```