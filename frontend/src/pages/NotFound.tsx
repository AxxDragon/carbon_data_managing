import { Link } from "react-router-dom";

const NotFound = () => {
  return (
    <div className="container text-center mt-5 bg-light">
      <h2 className="display-4 fw-bold text-danger">404 - Page Not Found</h2>
      <p className="mt-3 text-muted">Oops! The page you are looking for does not exist.</p>
      <Link to="/" className="btn btn-primary mt-4 px-4 py-2">
        Go to Home
      </Link>
    </div>
  );
};

export default NotFound;
