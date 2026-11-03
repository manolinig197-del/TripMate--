import { useEffect, useState } from "react";
import "./App.css";

const API = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

const destinationImages = {
  Hyderabad:
    "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=800",
  Goa:
    "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=800",
  Manali:
    "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=800",
  Jaipur:
    "https://images.unsplash.com/photo-1599661046827-dacff0c0f09a?w=800",
  Kerala:
    "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=800",
  Munnar:
    "https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800",
  Ooty:
    "https://images.unsplash.com/photo-1593693411515-c20261bcad6e?w=800",
  Darjeeling:
    "https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800",
  Agra:
    "https://images.unsplash.com/photo-1564507592333-c60657eea523?w=800",
  Udaipur:
    "https://images.unsplash.com/photo-1595658658481-d53d3f999875?w=800",
  Andaman:
    "https://images.unsplash.com/photo-1519046904884-53103b34b206?w=800",
  Rishikesh:
    "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=800",
  Pondicherry:
    "https://images.unsplash.com/photo-1582972236019-ea4af5ffe587?w=800",
  Srinagar:
    "https://images.unsplash.com/photo-1595815771614-ade9d652a65d?w=800",
  Mysore:
    "https://images.unsplash.com/photo-1600112356915-089abb8fc71a?w=800",
};

function App() {
  const [page, setPage] = useState("home");

  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("tripmateUser") || "null");
    } catch {
      return null;
    }
  });

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [destinations, setDestinations] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  const [selectedPlace, setSelectedPlace] = useState(null);
  const [tripFormOpen, setTripFormOpen] = useState(false);

  const [myTrips, setMyTrips] = useState([]);
  const [tripsLoading, setTripsLoading] = useState(false);

  const [adminStats, setAdminStats] = useState(null);
  const [adminUsers, setAdminUsers] = useState([]);
  const [adminTrips, setAdminTrips] = useState([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminSection, setAdminSection] = useState("overview");
  const [adminSearch, setAdminSearch] = useState("");
  const [myBookings, setMyBookings] = useState([]);
  const [adminBookings, setAdminBookings] = useState([]);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingType, setBookingType] = useState("");

  const [selectedTrip, setSelectedTrip] = useState(null);
  const [itineraryDays, setItineraryDays] = useState([]);
  const [itineraryLoading, setItineraryLoading] = useState(false);

  // LOAD DESTINATIONS
  useEffect(() => {
    async function loadDestinations() {
      try {
        const response = await fetch(`${API}/destinations`);

        if (!response.ok) {
          throw new Error("Unable to load destinations.");
        }

        const data = await response.json();
        setDestinations(data.destinations || []);
      } catch (error) {
        setMessage(error.message);
      }
    }

    loadDestinations();
  }, []);

  // SIGNUP AND LOGIN
  async function handleSubmit(e) {
    e.preventDefault();

    setLoading(true);
    setMessage("");

    const endpoint =
      page === "signup" ? "/auth/signup" : "/auth/login";

    const body =
      page === "signup"
        ? { name, email, password }
        : { email, password };

    try {
      const response = await fetch(`${API}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Something went wrong.");
      }

      localStorage.setItem("tripmateToken", data.token);
      localStorage.setItem(
        "tripmateUser",
        JSON.stringify(data.user)
      );

      setUser(data.user);
      setPage("home");
      setName("");
      setEmail("");
      setPassword("");

      setMessage(
        page === "signup"
          ? "Account created successfully!"
          : "Welcome back!"
      );
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  // LOGOUT
  function logout() {
    localStorage.removeItem("tripmateToken");
    localStorage.removeItem("tripmateUser");

    setUser(null);
    setMyTrips([]);
    setSelectedPlace(null);
    setTripFormOpen(false);
    setPage("home");

    setMessage("You have logged out.");
  }

  // SEARCH AND FILTER DESTINATIONS
  const filteredDestinations = destinations.filter((place) => {
    const matchesSearch = place.name
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesCategory =
      category === "All" || place.category === category;

    return matchesSearch && matchesCategory;
  });

  // FETCH MY TRIPS
  async function loadMyTrips() {
    const token = localStorage.getItem("tripmateToken");

    if (!token) {
      setMessage("Please login to view your trips.");
      setPage("login");
      return;
    }

    setTripsLoading(true);
    setMessage("");

    try {
      const response = await fetch(`${API}/trips`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Unable to load your trips.");
      }

      setMyTrips(data.trips || []);
      setPage("myTrips");
      setSelectedPlace(null);
      setTripFormOpen(false);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setTripsLoading(false);
    }
  }

  // OPEN AND LOAD ITINERARY
  async function openItinerary(trip) {
    const token = localStorage.getItem("tripmateToken");

    setSelectedTrip(trip);
    setItineraryLoading(true);
    setMessage("");

    try {
      const response = await fetch(
        `${API}/trips/${trip.id}/itinerary`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Unable to load itinerary.");
      }

      setItineraryDays(
        data.itinerary.length > 0
          ? data.itinerary
          : [
              {
                day: 1,
                activities: [
                  { time: "", activity: "", notes: "" },
                ],
              },
            ]
      );

      setPage("itinerary");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setItineraryLoading(false);
    }
  }

  // CREATE AND SAVE TRIP
  async function handleCreateTrip(e) {
    e.preventDefault();

    setMessage("");

    const formData = new FormData(e.target);

    const startDate = formData.get("startDate");
    const endDate = formData.get("endDate");

    if (endDate <= startDate) {
      setMessage("End date must be after start date.");
      return;
    }

    const trip = {
      destination: selectedPlace.name,
      start_date: startDate,
      end_date: endDate,
      travellers: Number(formData.get("travellers")),
      budget: Number(formData.get("budget")),
    };

    const token = localStorage.getItem("tripmateToken");

    if (!token) {
      setMessage("Please login before creating a trip.");
      setPage("login");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API}/trips`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(trip),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof data.detail === "string"
            ? data.detail
            : JSON.stringify(
                data.detail || "Unable to create trip."
              )
        );
      }

      setMessage("Your trip has been saved successfully!");
      setTripFormOpen(false);

      await loadMyTrips();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  // SAVE ITINERARY
  async function saveItinerary() {
    const token = localStorage.getItem("tripmateToken");

    setItineraryLoading(true);
    setMessage("");

    try {
      const response = await fetch(
        `${API}/trips/${selectedTrip.id}/itinerary`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            days: itineraryDays,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Unable to save itinerary.");
      }

      setMessage("Your itinerary has been saved successfully!");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setItineraryLoading(false);
    }
  }

  // ITINERARY EDITING FUNCTIONS
  function updateActivity(dayIndex, activityIndex, field, value) {
    setItineraryDays((prev) =>
      prev.map((day, dIndex) =>
        dIndex === dayIndex
          ? {
              ...day,
              activities: day.activities.map((activity, aIndex) =>
                aIndex === activityIndex
                  ? { ...activity, [field]: value }
                  : activity
              ),
            }
          : day
      )
    );
  }

  function addItineraryDay() {
    setItineraryDays((prev) => [
      ...prev,
      {
        day: prev.length + 1,
        activities: [{ time: "", activity: "", notes: "" }],
      },
    ]);
  }

  function addActivity(dayIndex) {
    setItineraryDays((prev) =>
      prev.map((day, index) =>
        index === dayIndex
          ? {
              ...day,
              activities: [
                ...day.activities,
                { time: "", activity: "", notes: "" },
              ],
            }
          : day
      )
    );
  }
  async function updateBookingStatus(bookingId, status) {
  const token = localStorage.getItem("tripmateToken");
  const adminMessage = prompt(
    `Enter a message for ${status.toLowerCase()}:`
  ) || "";

  try {
    const response = await fetch(
      `${API}/admin/bookings/${bookingId}/status`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status,
          admin_message: adminMessage,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || "Unable to update booking.");
    }

    setMessage(`Booking ${status.toLowerCase()} successfully!`);
    await loadAdminData();
  } catch (error) {
    setMessage(error.message);
  }
}

  // LOAD ADMIN DASHBOARD DATA
  async function loadAdminData() {
    const token = localStorage.getItem("tripmateToken");

    setAdminLoading(true);
    setMessage("");

    try {
      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const [statsResponse, usersResponse, tripsResponse] =
        await Promise.all([
          fetch(`${API}/admin/dashboard`, { headers }),
          fetch(`${API}/admin/users`, { headers }),
          fetch(`${API}/admin/trips`, { headers }),
        ]);

      if (
        !statsResponse.ok ||
        !usersResponse.ok ||
        !tripsResponse.ok
      ) {
        throw new Error("Unable to load admin dashboard data.");
      }

      const statsData = await statsResponse.json();
      const usersData = await usersResponse.json();
      const tripsData = await tripsResponse.json();

      setAdminStats(statsData);
      setAdminUsers(usersData.users || usersData);
      setAdminTrips(tripsData.trips || tripsData);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setAdminLoading(false);
    }
  }
// LOAD MY BOOKINGS
async function loadMyBookings() {
  const token = localStorage.getItem("tripmateToken");
  setBookingLoading(true);

  try {
    const response = await fetch(`${API}/bookings`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Unable to load your bookings.");
    }

    const data = await response.json();
    setMyBookings(data.bookings || []);
  } catch (error) {
    setMessage(error.message);
  } finally {
    setBookingLoading(false);
  }
}

// LOAD ALL BOOKINGS FOR ADMIN
async function loadAdminBookings() {
  const token = localStorage.getItem("tripmateToken");
  setBookingLoading(true);

  try {
    const response = await fetch(`${API}/admin/bookings`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Unable to load bookings.");
    }

    const data = await response.json();
    setAdminBookings(data.bookings || []);
  } catch (error) {
    setMessage(error.message);
  } finally {
    setBookingLoading(false);
  }
}
  // OPEN HOME PAGE
  function goHome() {
    setPage("home");
    setSelectedPlace(null);
    setTripFormOpen(false);
    setMessage("");
  }

  // FRONTEND
  return (
    <div className="app">
      {/* NAVBAR */}
      <header className="navbar">
        <h2 onClick={goHome}>
          TripMate ✈
        </h2>

        <nav>
          <button onClick={goHome}>
            Home
          </button>

          <button
            onClick={() => {
              goHome();

              setTimeout(() => {
                document
                  .getElementById("explore")
                  ?.scrollIntoView({ behavior: "smooth" });
              }, 100);
            }}
          >
            Explore
          </button>

          {user && (
  <>
    <button onClick={loadMyTrips}>
      My Trips
    </button>

    <button
      onClick={() => {
        setPage("myBookings");
        loadMyBookings();
      }}
    >
      My Bookings
    </button>
  </>
)}
          {user?.role === "admin" && (
            <button
              onClick={() => {
                setPage("admin");
                loadAdminData();
              }}
            >
              Admin Dashboard
            </button>
          )}

          {user ? (
            <>
              <span>Hi, {user.name}</span>

              <button onClick={logout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setPage("login")}>
                Login
              </button>

              <button onClick={() => setPage("signup")}>
                Sign Up
              </button>
            </>
          )}
        </nav>
      </header>

      <main>
        {/* HOME PAGE */}
        {page === "home" && !selectedPlace && (
          <>
            <section className="hero">
              <div className="hero-content">
                <span className="hero-tag">
                  YOUR JOURNEY BEGINS HERE
                </span>

                <h1>
                  Discover places.
                  <br />
                  Create memories.
                </h1>

                <p>
                  Find your next adventure with TripMate.
                  Explore beautiful destinations and plan
                  your perfect getaway.
                </p>

                <button
                  onClick={() =>
                    document
                      .getElementById("explore")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                >
                  Explore Destinations →
                </button>
              </div>
            </section>

            {/* DESTINATIONS */}
            <section className="destinations" id="explore">
              <div className="section-heading">
                <span>EXPLORE THE WORLD</span>

                <h2>Popular Destinations</h2>

                <p>
                  Find the perfect place for your next adventure.
                </p>
              </div>

              {/* SEARCH AND FILTER */}
              <div className="destination-tools">
                <input
                  type="text"
                  placeholder="Search destinations..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />

                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="All">All Categories</option>
                  <option value="Beach">Beach</option>
                  <option value="City">City</option>
                  <option value="Adventure">Adventure</option>
                  <option value="Heritage">Heritage</option>
                  <option value="Nature">Nature</option>
                </select>
              </div>

              {/* DESTINATION CARDS */}
              <div className="destination-grid">
                {filteredDestinations.map((place) => (
                  <article
                    className="destination-card"
                    key={place.id}
                  >
                    <img
                      src={
                        place.image ||
                        destinationImages[place.name]
                      }
                      alt={place.name}
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />

                    <div className="destination-info">
                      <span className="category-tag">
                        {place.category}
                      </span>

                      <h3>{place.name}</h3>

                      <p>{place.description}</p>

                      <div className="destination-bottom">
                        <strong>
                          ₹{Number(place.price).toLocaleString("en-IN")}
                        </strong>

                        <button
                          onClick={() => {
                            setSelectedPlace(place);
                            setTripFormOpen(false);
                            setMessage("");
                          }}
                        >
                          View Details →
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              {filteredDestinations.length === 0 && (
                <p className="empty-message">
                  No destinations found.
                </p>
              )}
            </section>
          </>
        )}

        {/* DESTINATION DETAILS */}
        {page === "home" && selectedPlace && (
          <section className="place-details">
            <button
              className="back-button"
              onClick={() => {
                setSelectedPlace(null);
                setTripFormOpen(false);
              }}
            >
              ← Back to destinations
            </button>

            <img
              src={
                selectedPlace.image ||
                destinationImages[selectedPlace.name]
              }
              alt={selectedPlace.name}
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />

            <span className="category-tag">
              {selectedPlace.category}
            </span>

            <h1>
              {selectedPlace.name}, {selectedPlace.country}
            </h1>

            <p>{selectedPlace.description}</p>

            <h2>
              Starting from ₹
              {Number(selectedPlace.price).toLocaleString("en-IN")}
            </h2>

            {!tripFormOpen ? (
              <button
                className="book-button"
                onClick={() => {
                  if (!user) {
                    setMessage("Please login to plan your trip.");
                    setPage("login");
                    return;
                  }

                  setTripFormOpen(true);
                  setMessage("");
                }}
              >
                Plan Your Trip
              </button>
            ) : (
              <form
                className="trip-form"
                onSubmit={handleCreateTrip}
              >
                <h2>
                  Plan your trip to {selectedPlace.name}
                </h2>

                <label>Travel Start Date</label>

                <input
                  type="date"
                  name="startDate"
                  min={new Date().toISOString().split("T")[0]}
                  required
                />

                <label>Travel End Date</label>

                <input
                  type="date"
                  name="endDate"
                  min={new Date().toISOString().split("T")[0]}
                  required
                />

                <label>Number of Travellers</label>

                <input
                  type="number"
                  name="travellers"
                  min="1"
                  defaultValue="1"
                  required
                />

                <label>Your Budget (₹)</label>

                <input
                  type="number"
                  name="budget"
                  min="1"
                  placeholder="Enter your budget"
                  required
                />

                <button
                  type="submit"
                  className="book-button"
                  disabled={loading}
                >
                  {loading ? "Saving Trip..." : "Create My Trip"}
                </button>

                <button
                  type="button"
                  className="back-button"
                  onClick={() => setTripFormOpen(false)}
                >
                  Cancel
                </button>

              </form>
            )}
            {/* BOOKING REQUEST SECTION */}
<div className="booking-section">
  <h2>Book Your Travel Services</h2>
  <p>Choose the services you need for your trip.</p>

  <form
    onSubmit={async (e) => {
      e.preventDefault();

      const token = localStorage.getItem("tripmateToken");
      const formData = new FormData(e.target);

      const bookingData = {
        booking_type: formData.get("booking_type"),
        service_name: formData.get("service_name"),
        destination: selectedPlace.name,
        start_date: formData.get("start_date"),
        end_date: formData.get("end_date"),
        travellers: Number(formData.get("travellers")),
        details: formData.get("details"),
      };

      try {
        const response = await fetch(`${API}/bookings`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(bookingData),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.detail || "Booking request failed.");
        }

        setMessage("Booking request submitted successfully!");
        e.target.reset();
      } catch (error) {
        setMessage(error.message);
      }
    }}
  >
    <label>Booking Type</label>
    <select
  name="booking_type"
  value={bookingType}
  onChange={(e) => {
    setBookingType(e.target.value);
  }}
  required
>
      <option value="">Select a service</option>
      <option value="Hotel">Hotel Booking</option>
      <option value="Transport">Transport Booking</option>
      <option value="Custom Itinerary">Custom Itinerary</option>
    </select>

    <label>Select Hotel or Transport</label>
<select name="service_name" required>
  <option value="">Choose an option</option>

  {bookingType === "Hotel" && (
    <>
      <option value="Grand Palace Hotel">Grand Palace Hotel</option>
      <option value="Ocean View Resort">Ocean View Resort</option>
      <option value="Sunshine Residency">Sunshine Residency</option>
      <option value="Luxury Stay Hotel">Luxury Stay Hotel</option>
    </>
  )}

  {bookingType === "Transport" && (
    <>
      <option value="Bus">Bus</option>
      <option value="Train">Train</option>
      <option value="Flight">Flight</option>
      <option value="Private Cab">Private Cab</option>
    </>
  )}

  {bookingType === "Custom Itinerary" && (
    <option value="Custom Travel Plan">Custom Travel Plan</option>
  )}
</select>

    <label>Start Date</label>
    <input type="date" name="start_date" required />

    <label>End Date</label>
    <input type="date" name="end_date" required />

    <label>Number of Travellers</label>
    <input type="number" name="travellers" min="1" defaultValue="1" required />

    <label>Additional Details</label>
    <textarea name="details" placeholder="Enter your requirements" />

    <button type="submit">Submit Booking Request</button>
  </form>
</div>
          </section>
        )}

        {/* MY TRIPS PAGE */}
        {page === "myTrips" && (
          <section className="destinations my-trips">
            <div className="section-heading">
              <span>YOUR TRAVEL PLANS</span>

              <h2>My Trips</h2>

              <p>
                All your saved travel plans in one place.
              </p>
            </div>

            <button
              className="back-button"
              onClick={goHome}
            >
              ← Back to Home
            </button>

            {tripsLoading ? (
              <p>Loading your trips...</p>
            ) : myTrips.length === 0 ? (
              <div className="empty-message">
                <h3>No trips created yet!</h3>

                <p>
                  Explore destinations and plan your first trip.
                </p>

                <button onClick={goHome}>
                  Explore Destinations
                </button>
              </div>
            ) : (
              <div className="destination-grid">
                {myTrips.map((trip) => (
                  <article
                    className="destination-card trip-card"
                    key={trip.id}
                  >
                    {destinationImages[trip.destination] && (
                      <img
                        src={destinationImages[trip.destination]}
                        alt={trip.destination}
                      />
                    )}

                    <div className="destination-info">
                      <span className="category-tag">
                        {trip.status}
                      </span>

                      <h3>{trip.destination}</h3>

                      <p>
                        <strong>Start date:</strong>{" "}
                        {trip.start_date}
                      </p>

                      <p>
                        <strong>End date:</strong>{" "}
                        {trip.end_date}
                      </p>

                      <p>
                        <strong>Travellers:</strong>{" "}
                        {trip.travellers}
                      </p>

                      <p>
                        <strong>Budget:</strong>{" "}
                        ₹{Number(trip.budget).toLocaleString("en-IN")}
                      </p>

                      <button
                        onClick={() => openItinerary(trip)}
                        disabled={itineraryLoading}
                      >
                        Plan / View Itinerary
                      </button>
                      {trip.itinerary?.length > 0 && (
  <div className="trip-itinerary-preview">
    <h4> Your Itinerary </h4>

    {trip.itinerary.map((day, dayIndex) => (
      <div key={dayIndex}>
        <strong>Day {day.day || dayIndex + 1}</strong>

        {day.activities?.map((activity, activityIndex) => (
          <p key={activityIndex}>
            {activity.time} — {activity.activity}
            
          </p>
        ))}
      </div>
    ))}
  </div>
)}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}
        {/* MY BOOKINGS PAGE */}

{/* MY BOOKINGS PAGE */}
{page === "myBookings" && (
  <section className="my-bookings-page">

    <div className="bookings-hero">
      <span className="bookings-subtitle">YOUR RESERVATIONS</span>
      <h1>My Bookings</h1>
      <p>Track all your hotel and transport booking requests.</p>

      <button className="booking-back-btn" onClick={goHome}>
        ← Back to Home
      </button>
    </div>

    {bookingLoading ? (
      <p className="booking-empty">Loading your bookings...</p>
    ) : myBookings.length === 0 ? (
      <div className="booking-empty">
        <h2>No bookings yet!</h2>
        <p>Your travel reservations will appear here.</p>
      </div>
    ) : (
      <div className="my-bookings-grid">
        {myBookings.map((booking) => (
          <article className="my-booking-card" key={booking.id}>

            <div
              className="booking-photo"
              style={{
                backgroundImage: `url(${
                  booking.booking_type === "Hotel"
                    ? "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600"
                    : booking.booking_type === "Transport"
                    ? "https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=600"
                    : "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600"
                })`
              }}
            >
              <span className="booking-photo-icon">
                {booking.booking_type === "Hotel" ? "🏨" :
                 booking.booking_type === "Transport" ? "🚆" : "🗺️"}
              </span>
            </div>

            <div className="booking-card-content">

              <div className="booking-card-heading">
                <div>
                  <h2>{booking.service_name}</h2>
                  <span className="booking-type-badge">
                    {booking.booking_type}
                  </span>
                </div>

                <span className={`booking-status ${booking.status?.toLowerCase()}`}>
                  {booking.status === "Pending" ? "◷" : 
                   booking.status === "Approved" ? "✓" : "✕"}
                  {" "}{booking.status}
                </span>
              </div>

              <div className="booking-details">
                <p>📍 <strong>Destination:</strong> {booking.destination}</p>
                <p>📅 <strong>Start Date:</strong> {booking.start_date}</p>
                <p>📅 <strong>End Date:</strong> {booking.end_date}</p>
                <p>👥 <strong>Travellers:</strong> {booking.travellers}</p>
              </div>

              <div className="booking-admin-message">
                💬 <strong>Admin Message:</strong>{" "}
                {booking.admin_message || "No message yet"}
              </div>
              {booking.status === "Pending" && (
  <div className="booking-actions">
    <button
      className="approve-btn"
      onClick={() => updateBookingStatus(booking.id, "Approved")}
    >
      Accept
    </button>

    <button
      className="reject-btn"
      onClick={() => updateBookingStatus(booking.id, "Rejected")}
    >
      Reject
    </button>
  </div>
)}
              {booking.status === "Pending" && (
  <div className="booking-actions">
    <button
      className="approve-btn"
      onClick={() => updateBookingStatus(booking.id, "Approved")}
    >
      Accept
    </button>

    <button
      className="reject-btn"
      onClick={() => updateBookingStatus(booking.id, "Rejected")}
    >
      Reject
    </button>
  </div>
)}

            </div>
          </article>
        ))}
      </div>
    )}
  </section>
)}

        {/* ITINERARY PAGE */}
        {page === "itinerary" && selectedTrip && (
          <section className="itinerary-page itinerary-section">
            <h1>
              Plan Your Trip to {selectedTrip.destination}
            </h1>

            <p>
              {selectedTrip.start_date} to {selectedTrip.end_date}
            </p>

            <button onClick={() => setPage("myTrips")}>
              Back to My Trips
            </button>

            {itineraryDays.map((day, dayIndex) => (
              <div className="itinerary-day" key={dayIndex}>
                <h2>Day {day.day}</h2>

                {day.activities.map((activity, activityIndex) => (
                  <div
                    className="activity-card"
                    key={activityIndex}
                  >
                    <input
                      type="time"
                      value={activity.time || ""}
                      onChange={(e) =>
                        updateActivity(
                          dayIndex,
                          activityIndex,
                          "time",
                          e.target.value
                        )
                      }
                    />

                    <select
                      value={activity.activity || ""}
                      onChange={(e) =>
                        updateActivity(
                          dayIndex,
                          activityIndex,
                          "activity",
                          e.target.value
                        )
                      }
                    >
                      <option value="">Select an activity</option>
                      <option value="Sightseeing">Sightseeing</option>
                      <option value="Trekking">Trekking</option>
                      <option value="Shopping">Shopping</option>
                      <option value="Adventure Activities">
                        Adventure Activities
                      </option>
                      <option value="Beach Activities">
                        Beach Activities
                      </option>
                      <option value="Food and Dining">
                        Food and Dining
                      </option>
                      <option value="Photography">Photography</option>
                      <option value="Relaxation">Relaxation</option>
                      <option value="Temple Visit">Temple Visit</option>
                      <option value="Local Exploration">
                        Local Exploration
                      </option>
                    </select>

                    <textarea
                      value={activity.notes || ""}
                      onChange={(e) =>
                        updateActivity(
                          dayIndex,
                          activityIndex,
                          "notes",
                          e.target.value
                        )
                      }
                      placeholder="Add notes..."
                    />
                  </div>
                ))}

                <button onClick={() => addActivity(dayIndex)}>
                  + Add Activity
                </button>
              </div>
            ))}

            <button onClick={addItineraryDay}>
              + Add Another Day
            </button>

            <button
              onClick={saveItinerary}
              disabled={itineraryLoading}
            >
              {itineraryLoading ? "Saving..." : "Save Itinerary"}
            </button>
          </section>
        )}

        {/* ADMIN DASHBOARD */}
        {page === "admin" && (
          <section className="destinations my-trips">
            <div className="section-heading">
              <span>TRIPMATE MANAGEMENT</span>
              <h2>Admin Dashboard</h2>
              <p>Manage users, trips and destinations.</p>
            </div>

            <button
              onClick={goHome}
              className="back-button"
            >
              ← Back to Home
            </button>

            {adminLoading ? (
              <p>Loading dashboard...</p>
            ) : (
              <>
                <div className="admin-tabs">
                  <button
                    onClick={() => setAdminSection("overview")}
                  >
                    Overview
                  </button>

                  <button
                    onClick={() => setAdminSection("users")}
                  >
                    Users
                  </button>

                  <button
                    onClick={() => setAdminSection("trips")}
                  >
                    Trips
                  </button>
                  <button
  onClick={() => {
    setAdminSection("bookings");
    loadAdminBookings();
  }}
>
  Bookings
</button>
                </div>

                {adminSection === "overview" && (
  <div className="admin-overview">

    <div className="admin-welcome">
      <h2>Welcome to TripMate Admin 👋</h2>
      <p>Here's an overview of your platform.</p>
    </div>

    <div className="admin-stats">

      <div className="admin-stat-card">
        <div className="stat-icon">👥</div>
        <h3>Total Users</h3>
        <h2>{adminStats?.total_users ?? adminUsers.length}</h2>
        <p>Registered users on TripMate</p>
      </div>

      <div className="admin-stat-card">
        <div className="stat-icon">✈️</div>
        <h3>Total Trips</h3>
        <h2>{adminStats?.total_trips ?? adminTrips.length}</h2>
        <p>Trips created by users</p>
      </div>

      <div className="admin-stat-card">
        <div className="stat-icon">📍</div>
        <h3>Total Destinations</h3>
        <h2>{adminStats?.total_destinations ?? 15}</h2>
        <p>Available travel destinations</p>
      </div>

    </div>
  </div>
)}

                {adminSection === "users" && (
                  <div>
                    <h2>Registered Users</h2>

                    {adminUsers.map((item) => (
                      <div
                        className="destination-card"
                        key={item.id || item._id}
                      >
                        <h3>{item.name}</h3>
                        <p>Email: {item.email}</p>
                        <p>Role: {item.role || "user"}</p>
                      </div>
                    ))}
                  </div>
                )}

                {adminSection === "trips" && (
                  <div>
                    <h2>All Trips</h2>

                    {adminTrips.map((trip) => (
                      <div
                        className="destination-card"
                        key={trip.id || trip._id}
                      >
                        <h3>{trip.destination}</h3>

                        <p>
                          Start Date: {trip.start_date || "Not specified"}
                        </p>

                        <p>
                          End Date: {trip.end_date || "Not specified"}
                        </p>

                        <p>Travellers: {trip.travellers}</p>
                        <p>Budget: ₹{trip.budget}</p>
                        <p>Status: {trip.status}</p>
                        <p>User ID: {trip.user_id}</p>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
            {adminSection === "bookings" && (
  <div>
    <h2>All Booking Requests</h2>

    {bookingLoading ? (
      <p>Loading bookings...</p>
    ) : adminBookings.length === 0 ? (
      <p>No booking requests yet.</p>
    ) : (
      <div className="destination-grid">
        {adminBookings.map((booking) => (
          <div className="destination-card" key={booking.id}>
            <h3>{booking.service_name}</h3>
            <p>Type: {booking.booking_type}</p>
            <p>Destination: {booking.destination}</p>
            <p>User: {booking.user_name}</p>
            <p>Email: {booking.user_email}</p>
            <p>Start Date: {booking.start_date}</p>
            <p>End Date: {booking.end_date}</p>
            <p>Travellers: {booking.travellers}</p>
            <p>Status: {booking.status}</p>
            <p>Details: {booking.details || "None"}</p>
            <p>Admin Message: {booking.admin_message || "None"}</p>
            <div className="booking-actions">
  <button
    onClick={async () => {
      const token = localStorage.getItem("tripmateToken");
      const adminMessage = prompt("Enter approval message:") || "";

      const response = await fetch(
        `${API}/admin/bookings/${booking.id}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            status: "Approved",
            admin_message: adminMessage,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setMessage("Booking approved successfully!");
        loadAdminBookings();
      } else {
        setMessage(data.detail || "Unable to approve booking.");
      }
    }}
  >
    Approve
  </button>

  <button
    onClick={async () => {
      const token = localStorage.getItem("tripmateToken");
      const adminMessage = prompt("Enter rejection reason:") || "";

      const response = await fetch(
        `${API}/admin/bookings/${booking.id}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            status: "Rejected",
            admin_message: adminMessage,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setMessage("Booking rejected.");
        loadAdminBookings();
      } else {
        setMessage(data.detail || "Unable to reject booking.");
      }
    }}
  >
    Reject
  </button>
</div>
          </div>
        ))}
      </div>
    )}
  </div>
)}
          </section>
        )}

        {/* LOGIN AND SIGNUP */}
        {(page === "login" || page === "signup") && (
          <section className="auth-section">
            <h2>
              {page === "signup"
                ? "Create Your Account"
                : "Welcome Back"}
            </h2>

            <form onSubmit={handleSubmit}>
              {page === "signup" && (
                <input
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              )}

              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <input
                type="password"
                placeholder="Password (minimum 8 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                required
              />

              <button type="submit" disabled={loading}>
                {loading
                  ? "Please wait..."
                  : page === "signup"
                    ? "Create Account"
                    : "Login"}
              </button>
            </form>

            <p>
              {page === "signup"
                ? "Already have an account?"
                : "Don't have an account?"}

              <button
                className="switch-button"
                onClick={() => {
                  setPage(
                    page === "signup" ? "login" : "signup"
                  );
                  setMessage("");
                }}
              >
                {page === "signup" ? " Login" : " Sign Up"}
              </button>
            </p>
          </section>
        )}

        {/* SUCCESS AND ERROR MESSAGES */}
        {message && (
          <p className="message">
            {message}
          </p>
        )}
      </main>

      {/* FOOTER */}
      <footer>
        <p>
          © 2026 TripMate. Explore. Discover. Travel.
        </p>
      </footer>
    </div>
  );
}
        
export default App;
