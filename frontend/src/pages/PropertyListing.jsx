
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../App.css";

const API_URL = "http://127.0.0.1:8000";
const MAX_IMAGES = 10;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB per image

const categories = [
  ["studio", "Studio"],
  ["1_bhk", "1 BHK"],
  ["2_bhk", "2 BHK"],
  ["sharing_room", "Sharing Room"],
  ["master_bedroom", "Master Bedroom"],
  ["bedspace_gents", "Bedspace - Gents"],
  ["bedspace_ladies", "Bedspace - Ladies"],
  ["partition_single", "Partition - Single"],
  ["partition_couple", "Partition - Couple"],
];

function PropertyListing() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    agent_name: "",
    title: "",
    description: "",
    category: "studio",
    location: "",
    monthly_rent: "",
  });

  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Create thumbnail URLs and release them when files change or the page unmounts.
  const [imagePreviews, setImagePreviews] = useState([]);

  useEffect(() => {
    const previews = images.map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }));

    setImagePreviews(previews);

    return () => {
      previews.forEach(({ url }) => URL.revokeObjectURL(url));
    };
  }, [images]);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  }

  // Users can add photos in separate selections.
  function handleImages(event) {
    const selected = Array.from(event.target.files || []);
    const input = event.target;

    setError("");
    setSuccess("");

    setImages((previous) => {
      const combined = [...previous];

      for (const file of selected) {
        const alreadySelected = combined.some(
          (item) =>
            item.name === file.name &&
            item.size === file.size &&
            item.lastModified === file.lastModified
        );

        if (alreadySelected) {
          continue;
        }

        if (!file.type.startsWith("image/")) {
          setError(`${file.name} is not an image.`);
          continue;
        }

        if (file.size > MAX_IMAGE_SIZE) {
          setError(`${file.name} exceeds the 5 MB image limit.`);
          continue;
        }

        if (combined.length >= MAX_IMAGES) {
          setError(`You can upload up to ${MAX_IMAGES} photos.`);
          break;
        }

        combined.push(file);
      }

      return combined;
    });

    // Reset the input so the same file can be chosen again if needed.
    input.value = "";
  }

  function removeImage(indexToRemove) {
    setImages((previous) =>
      previous.filter((_, index) => index !== indexToRemove)
    );
    setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!form.agent_name.trim()) {
      setError("Please enter the agent name.");
      return;
    }

    if (!form.title.trim() || !form.location.trim()) {
      setError("Please enter the property title and location.");
      return;
    }

    if (!form.description.trim()) {
      setError("Please enter the property description.");
      return;
    }

    if (!form.monthly_rent || Number(form.monthly_rent) <= 0) {
      setError("Please enter a valid monthly rent.");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();

      Object.entries(form).forEach(([key, value]) => {
        formData.append(key, value);
      });

      // Keep the first photo in the existing image field for compatibility.
      if (images.length > 0) {
        formData.append("image", images[0]);
      }

      // Send every selected photo for the property gallery.
      images.forEach((image) => {
        formData.append("images", image);
      });

      const response = await fetch(
        `${API_URL}/api/properties/submit/`,
        {
          method: "POST",
          body: formData,
          credentials: "include",
        }
      );

      const responseText = await response.text();
      let data = {};

      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch {
        throw new Error(
          `The server returned an unexpected response (HTTP ${response.status}). Check the Django terminal.`
        );
      }

      if (!response.ok) {
        const details =
          data.detail ||
          data.error ||
          Object.values(data).flat().join(" ");

        throw new Error(details || "Unable to submit the property.");
      }

      setSuccess(
        "Property submitted successfully! It will appear after admin approval."
      );

      setForm({
        agent_name: "",
        title: "",
        description: "",
        category: "studio",
        location: "",
        monthly_rent: "",
      });

      setImages([]);
      event.target.reset();
    } catch (err) {
      setError(
        err.message ||
          "Could not submit your property. Please check the backend."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app">
      <header className="navbar">
        <a className="logo" href="/">
          Room<span>Souq</span>
        </a>

        <button
          type="button"
          className="login-button"
          onClick={() => navigate("/")}
        >
          Back to Home
        </button>
      </header>

      <main>
        <section className="list-cta" style={{ margin: "32px auto" }}>
          <div>
            <span className="section-label">LIST YOUR PROPERTY</span>
            <h2>Find the right tenant for your space.</h2>
            <p>
              Submit your property details and photos. Our team will review
              your listing before publishing it.
            </p>
          </div>
        </section>

        <section
          style={{
            maxWidth: 760,
            margin: "0 auto 60px",
            padding: 20,
          }}
        >
          <form onSubmit={handleSubmit}>
            <div style={{ display: "grid", gap: 18 }}>
              <label>
                Agent Name *
                <input
                  name="agent_name"
                  value={form.agent_name}
                  onChange={handleChange}
                  placeholder="Enter agent name"
                  maxLength={100}
                  required
                />
              </label>

              <label>
                Property title *
                <input
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="e.g. Studio Apartment in Dubai"
                  required
                  maxLength={200}
                />
              </label>

              <label>
                Room type *
                <select
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  required
                >
                  {categories.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Location *
                <input
                  name="location"
                  value={form.location}
                  onChange={handleChange}
                  placeholder="Area, city"
                  required
                  maxLength={200}
                />
              </label>

              <label>
                Monthly rent (₹) *
                <input
                  name="monthly_rent"
                  type="number"
                  min="1"
                  step="0.01"
                  value={form.monthly_rent}
                  onChange={handleChange}
                  placeholder="e.g. 12000"
                  required
                />
              </label>

              <label>
                Property description *
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Describe the room, amenities, facilities and house rules."
                  rows={5}
                  required
                />
              </label>

              <div>
                <label htmlFor="property-photos">
                  Property photos (up to {MAX_IMAGES}, 5 MB each)
                </label>

                <input
                  id="property-photos"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImages}
                  disabled={loading || images.length >= MAX_IMAGES}
                />

                <p>
                  {images.length} of {MAX_IMAGES} photos selected.
                  You can choose more photos each time you open the file picker.
                </p>
              </div>

              {imagePreviews.length > 0 && (
                <div>
                  <h3>Photo previews</h3>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fill, minmax(130px, 1fr))",
                      gap: 12,
                    }}
                  >
                    {imagePreviews.map(({ file, url }, index) => (
                      <div
                        key={`${file.name}-${file.lastModified}-${index}`}
                        style={{
                          minWidth: 0,
                          border: "1px solid #555",
                          borderRadius: 8,
                          padding: 8,
                        }}
                      >
                        <img
                          src={url}
                          alt={file.name}
                          style={{
                            width: "100%",
                            height: 110,
                            objectFit: "cover",
                            borderRadius: 6,
                          }}
                        />

                        <p
                          style={{
                            overflowWrap: "anywhere",
                            fontSize: 12,
                          }}
                        >
                          {file.name}
                        </p>

                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          disabled={loading}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {error && (
                <p role="alert" style={{ color: "red" }}>
                  {error}
                </p>
              )}

              {success && (
                <p role="status" style={{ color: "green" }}>
                  {success}
                </p>
              )}

              <button type="submit" disabled={loading}>
                {loading
                  ? "Submitting..."
                  : "Submit Property for Approval"}
              </button>
            </div>
          </form>
        </section>
      </main>

      <footer className="footer">
        <a className="logo" href="/">
          Room<span>Souq</span>
        </a>
        <p>Making it easier to find a place to call home.</p>
      </footer>
    </div>
  );
}

export default PropertyListing;
