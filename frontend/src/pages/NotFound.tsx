import { Link } from "react-router-dom";

const NotFound = () => {
  return (
    <div className="flex flex-col items-center mt-10">
      <h2 className="text-3xl font-bold">404 - Page Not Found</h2>
      <p className="mt-4 text-gray-600">Oops! The page you are looking for does not exist.</p>
      <Link to="/" className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700">
        Go to Home
      </Link>
    </div>
  );
};

export default NotFound;
