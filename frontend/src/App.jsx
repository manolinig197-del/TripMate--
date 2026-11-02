
import { useEffect, useState } from "react";
import "./App.css";

const API = "http://127.0.0.1:8000";

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
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [itineraryDays, setItineraryDays] = useState([]);
  const [itineraryLoading, setItineraryLoading] = useState(false);
  // -------------------------------
  // LOAD DESTINATIONS
  // --------------------------------

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

  // --------------------------------
  // SIGNUP AND LOGIN
  // --------------------------------

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

  // --------------------------------
  // LOGOUT
  // --------------------------------

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

  // --------------------------------
  // SEARCH AND FILTER DESTINATIONS
  // --------------------------------

  const filteredDestinations = destinations.filter((place) => {
    const matchesSearch = place.name
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesCategory =
      category === "All" || place.category === category;

    return matchesSearch && matchesCategory;
  });

  // --------------------------------
  // FETCH MY TRIPS
  // --------------------------------

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
  // --------------------------------
// OPEN AND LOAD ITINERARY
// --------------------------------

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

  // --------------------------------
  // CREATE AND SAVE TRIP
  // --------------------------------

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
      startDate,
      endDate,
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
        throw new Error(data.detail || "Unable to create trip.");
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
// --------------------------------
// SAVE ITINERARY
// --------------------------------

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
// --------------------------------
// ITINERARY EDITING FUNCTIONS
// --------------------------------

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
// --------------------------------
// LOAD ADMIN DASHBOARD DATA
// --------------------------------

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

    if (!statsResponse.ok || !usersResponse.ok || !tripsResponse.ok) {
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
  // --------------------------------
  // OPEN HOME PAGE
  // --------------------------------

  function goHome() {
    setPage("home");
    setSelectedPlace(null);
    setTripFormOpen(false);
    setMessage("");
  }

  // --------------------------------
  // FRONTEND
  // --------------------------------

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
            <button onClick={loadMyTrips}>
              My Trips
            </button>
            
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
                        {trip.startDate}
                      </p>

                      <p>
                        <strong>End date:</strong>{" "}
                        {trip.endDate}
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

                    </div>

                  </article>

                ))}

              </div>

            )}

          </section>
        )}
{/* ITINERARY PAGE */}
{page === "itinerary" && selectedTrip && (
  <section className="itinerary-page">
    <h1>Plan Your Trip to {selectedTrip.destination}</h1>

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
          <div className="activity-card" key={activityIndex}>
            <input
              type="time"
              value={activity.time}
              onChange={(e) =>
                updateActivity(dayIndex, activityIndex, "time", e.target.value)
              }
              placeholder="Time"
            />

            <input
              type="text"
              value={activity.activity}
              onChange={(e) =>
                updateActivity(dayIndex, activityIndex, "activity", e.target.value)
              }
              placeholder="Activity (e.g. Visit a beach)"
            />

            <textarea
              value={activity.notes}
              onChange={(e) =>
                updateActivity(dayIndex, activityIndex, "notes", e.target.value)
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

    <button onClick={saveItinerary} disabled={itineraryLoading}>
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

    <button onClick={goHome} className="back-button">
      ← Back to Home
    </button>

    {adminLoading ? (
      <p>Loading dashboard...</p>
    ) : (
      <>
        <div className="admin-tabs">
          <button onClick={() => setAdminSection("overview")}>
            Overview
          </button>
          <button onClick={() => setAdminSection("users")}>
            Users
          </button>
          <button onClick={() => setAdminSection("trips")}>
            Trips
          </button>
        </div>

        {adminSection === "overview" && (
          <div className="admin-stats">

            <div className="destination-card">
              <h3>Total Users</h3>
              <h2>{adminStats?.total_users ?? adminUsers.length}</h2>
            </div>

            <div className="destination-card">
              <h3>Total Trips</h3>
              <h2>{adminStats?.total_trips ?? adminTrips.length}</h2>
            </div>

            <div className="destination-card">
              <h3>Total Destinations</h3>
              <h2>{adminStats?.total_destinations ?? 15}</h2>
            </div>

          </div>
        )}

        {adminSection === "users" && (
          <div>
            <h2>Registered Users</h2>

            {adminUsers.map((item) => (
              <div className="destination-card" key={item.id || item._id}>
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
              <div className="destination-card" key={trip.id || trip._id}>
                <h3>{trip.destination}</h3>
                <p>Start Date: {trip.start_date || "Not specified"}</p>
                <p>End Date: {trip.end_date || "Not specified"}</p>
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
