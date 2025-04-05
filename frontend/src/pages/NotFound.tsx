import { Link } from "react-router-dom";

// Functional component for displaying a 404 page when a user navigates to a non-existent route
const NotFound = () => {
  return (
    <div className="container text-center mt-5 bg-light">
      {/* Display the main error message with a prominent red color */}
      <h2 className="display-4 fw-bold text-danger">404 - Page Not Found</h2>

      {/* Inform the user that the page they are looking for doesn't exist */}
      <p className="mt-3 text-muted">
        Oops! The page you are looking for does not exist.
      </p>

      {/* Provide a button to take the user back to the home page */}
      <Link to="/" className="btn btn-primary mt-4 px-4 py-2">
        Go to Home
      </Link>
    </div>
  );
};

export default NotFound;
