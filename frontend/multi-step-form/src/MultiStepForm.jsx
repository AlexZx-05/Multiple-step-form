import React, { useState } from "react";
import "./MultiStepForm.css";
import zxcvbn from "zxcvbn";

export default function MultiStepForm() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    profilePhoto: "", // This is a File object if uploaded
    username: "",
    currentPassword: "",
    newPassword: "",
    profession: "",
    companyName: "",
    addressLine1: "",
    country: "",
    state: "",
    city: "",
    subscriptionPlan: "",
    newsletter: false,
  });

  const passwordScore = formData.newPassword
    ? zxcvbn(formData.newPassword).score
    : 0;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState(null);
  const [checkingUsername, setCheckingUsername] = useState(false);

  //validation

  const isStepValid = () => {
    if (step === 1) {
      return (
        formData.username.trim() !== "" &&
        formData.currentPassword.trim() !== "" &&
        formData.newPassword.trim() !== "" &&
        usernameAvailable === true
      );
    }

    if (step === 2) {
      if (
        ["entrepreneur", "employee"].includes(formData.profession.toLowerCase())
      ) {
        return (
          formData.profession.trim() !== "" &&
          formData.companyName.trim() !== "" &&
          formData.addressLine1.trim() !== ""
        );
      }
      return (
        formData.profession.trim() !== "" && formData.addressLine1.trim() !== ""
      );
    }

    if (step === 3) {
      return (
        formData.country.trim() !== "" &&
        formData.state.trim() !== "" &&
        formData.city.trim() !== "" &&
        formData.subscriptionPlan.trim() !== ""
      );
    }

    return true; // Step 4 has no input, so always valid
  };

  const handleChange = async (e) => {
    const { name, value, type, checked, files } = e.target;

    let newValue;

    // 🔽 Handle file input and generate preview URL if it's profilePhoto
    if (type === "file") {
      const file = files[0];
      newValue = file;

      setFormData((prev) => ({
        ...prev,
        [name]: file,
        ...(name === "profilePhoto" && {
          profilePhotoURL: URL.createObjectURL(file),
        }), // ✅ Preview URL
      }));
    } else if (type === "checkbox") {
      newValue = checked;
      setFormData((prev) => ({
        ...prev,
        [name]: checked,
      }));
    } else {
      newValue = value;
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }

    // 🔽 Async check for username availability
    if (name === "username") {
      setCheckingUsername(true);
      try {
        const res = await fetch("http://localhost:3000/api/check-username", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: newValue }),
        });
        const data = await res.json();
        setUsernameAvailable(data.available);
      } catch (err) {
        console.error(err);
        setUsernameAvailable(null);
      } finally {
        setCheckingUsername(false);
      }
    }
  };

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    // ✅ Add this validation BEFORE preparing FormData
    if (
      ["entrepreneur", "employee"].includes(
        formData.profession.toLowerCase()
      ) &&
      !formData.companyName.trim()
    ) {
      setSubmitError("Company name is required for the selected profession.");
      setIsSubmitting(false);
      return;
    }

    try {
      const payload = new FormData();

      Object.entries(formData).forEach(([key, value]) => {
        if (key === "profilePhoto") {
          if (value) {
            payload.append(key, value);
          }
        } else {
          payload.append(
            key,
            typeof value === "boolean" ? String(value) : value
          );
        }
      });

      const response = await fetch("http://localhost:3000/api/submit-form", {
        method: "POST",
        body: payload,
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.statusText}`);
      }

      const data = await response.json();
      setSubmitSuccess(true);
      alert("Form submitted successfully!");
      // You can reset formData or redirect here
    } catch (error) {
      setSubmitError(error.message || "Submission failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="form-container">
      <h2>Step {step}</h2>
      <form onSubmit={handleSubmit}>
        {step === 1 && (
          <div>
            <input
              type="file"
              name="profilePhoto"
              accept="image/png, image/jpeg"
              onChange={handleChange}
            />
            <br />

            <input
              type="text"
              name="username"
              placeholder="Username"
              value={formData.username}
              onChange={handleChange}
            />
            <br />

            {checkingUsername && <p>Checking username...</p>}
            {usernameAvailable === false && (
              <p style={{ color: "red" }}>Username is taken</p>
            )}
            {usernameAvailable === true && (
              <p style={{ color: "green" }}>Username is available</p>
            )}

            <input
              type="password"
              name="currentPassword"
              placeholder="Current Password"
              value={formData.currentPassword}
              onChange={handleChange}
            />
            <br />
            <input
              type="password"
              name="newPassword"
              placeholder="New Password"
              value={formData.newPassword}
              onChange={handleChange}
            />
            <br />
            {formData.newPassword && (
              <p>
                Strength:{" "}
                {["Very Weak", "Weak", "Fair", "Good", "Strong"][passwordScore]}
              </p>
            )}

            <br />
          </div>
        )}

        {step === 2 && (
          <div>
            <select
              name="profession"
              value={formData.profession}
              onChange={handleChange}
            >
              <option value="">Select Profession</option>
              <option value="student">Student</option>
              <option value="entrepreneur">Entrepreneur</option>
              <option value="employee">Employee</option>
              <option value="freelancer">Freelancer</option>
              <option value="unemployed">Unemployed</option>
            </select>

            <br />

            {/* Conditionally show company input only if profession is entrepreneur or employee */}
            {["entrepreneur", "employee"].includes(formData.profession) && (
              <div id="companyDetails">
                <label htmlFor="companyName">
                  Where do you work? Enter your company name:
                </label>
                <input
                  type="text"
                  id="companyName"
                  name="companyName"
                  placeholder="Company Name"
                  value={formData.companyName}
                  onChange={handleChange}
                />
              </div>
            )}

            <input
              type="text"
              name="addressLine1"
              placeholder="Address Line 1"
              value={formData.addressLine1}
              onChange={handleChange}
            />
            <br />
          </div>
        )}

        {step === 3 && (
          <div>
            <input
              type="text"
              name="country"
              placeholder="Country"
              value={formData.country}
              onChange={handleChange}
            />
            <br />
            <input
              type="text"
              name="state"
              placeholder="State"
              value={formData.state}
              onChange={handleChange}
            />
            <br />
            <input
              type="text"
              name="city"
              placeholder="City"
              value={formData.city}
              onChange={handleChange}
            />
            <br />
            <select
              name="subscriptionPlan"
              value={formData.subscriptionPlan}
              onChange={handleChange}
            >
              <option value="">Select Plan</option>
              <option value="free">Free</option>
              <option value="basic">Basic</option>
              <option value="premium">Premium</option>
            </select>
            <br />
            <label>
              <input
                type="checkbox"
                name="newsletter"
                checked={formData.newsletter}
                onChange={handleChange}
              />{" "}
              Subscribe to newsletter
            </label>
            <br />
          </div>
        )}

        {step === 4 && (
          <div>
            <h3>Summary</h3>

            {formData.profilePhotoURL && (
              <div>
                <strong>Profile Photo:</strong>
                <br />
                <img
                  src={formData.profilePhotoURL}
                  alt="Profile"
                  style={{
                    width: "100px",
                    height: "100px",
                    objectFit: "cover",
                    borderRadius: "50%",
                  }}
                />
              </div>
            )}

            <p>
              <strong>Username:</strong> {formData.username}
            </p>
            <p>
              <strong>Profession:</strong> {formData.profession}
            </p>
            <p>
              <strong>Company:</strong> {formData.companyName}
            </p>
            <p>
              <strong>Address:</strong> {formData.addressLine1}
            </p>
            <p>
              <strong>Location:</strong> {formData.city}, {formData.state},{" "}
              {formData.country}
            </p>
            <p>
              <strong>Plan:</strong> {formData.subscriptionPlan}
            </p>
            <p>
              <strong>Newsletter:</strong> {formData.newsletter ? "Yes" : "No"}
            </p>
          </div>
        )}

        {submitError && <p style={{ color: "red" }}>{submitError}</p>}
        {submitSuccess && (
          <p style={{ color: "green" }}>Submission successful!</p>
        )}

        <div style={{ marginTop: "20px" }}>
          {step > 1 && step <= 4 && (
            <button type="button" onClick={prevStep} disabled={isSubmitting}>
              Back
            </button>
          )}
          {step < 4 && (
            <button
              type="button"
              onClick={nextStep}
              disabled={isSubmitting || !isStepValid()}
            >
              Next
            </button>
          )}
          {step === 4 && (
            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
