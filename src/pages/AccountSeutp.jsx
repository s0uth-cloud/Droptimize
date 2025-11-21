import { useEffect, useState } from "react";
import { Stack, Typography, TextField, Select, MenuItem, Box, Divider, InputAdornment, Paper, Button, FormControl, InputLabel, FormHelperText } from "@mui/material";
import { TimePicker } from "@mui/x-date-pickers";
import PersonIcon from "@mui/icons-material/Person";
import BusinessIcon from "@mui/icons-material/Business";
import { useNavigate } from "react-router-dom";
import { auth, db } from "/src/firebaseConfig";
import { doc, setDoc, addDoc, collection, serverTimestamp } from "firebase/firestore";
import SuccessMessage from "../components/AccountSetup/SuccessMessage.jsx";
import { responsiveFontSizes, responsiveDimensions } from "../theme/responsiveTheme.js";
import axios from "axios";

export default function AccountSetup() {
  useEffect(() => {
    document.title = "Account Setup";
  }, []);

  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: "",
    role: "admin",
    email: "",
    contactNumber: "",
    countryCode: "+63",
    branchName: "",
    branchAddress: "",
    operatingRegion: "",
    operatingProvince: "",
    operatingCity: "",
    openingTime: null,
    closingTime: null,
  });

  const [userId, setUserId] = useState("");
  const [errors, setErrors] = useState({});
  const [isValid, setIsValid] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // PSGC API data
  const [regions, setRegions] = useState([]);
  const [provinces, setProvinces] = useState([]);
  const [cities, setCities] = useState([]);

  // Fetch Firebase user info on mount
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          setUserId(user.uid);
          setFormData((prev) => ({
            ...prev,
            fullName: user.displayName || "",
            email: user.email || "",
          }));
        }
      } catch (err) {
        console.error("Failed to get Firebase user:", err);
      }
    };
    fetchUser();
  }, []);

  // Fetch regions on mount
  useEffect(() => {
    axios.get("https://psgc.gitlab.io/api/regions/")
      .then((res) => setRegions(res.data))
      .catch((err) => console.error("Failed to fetch regions:", err));
  }, []);

  // Fetch provinces when region changes
  useEffect(() => {
    if (formData.operatingRegion) {
      axios.get(`https://psgc.gitlab.io/api/regions/${formData.operatingRegion}/provinces/`)
        .then((res) => setProvinces(res.data))
        .catch((err) => console.error("Failed to fetch provinces:", err));
      
      // Reset dependent fields
      setFormData((prev) => ({
        ...prev,
        operatingProvince: "",
        operatingCity: "",
      }));
      setCities([]);
    } else {
      setProvinces([]);
      setCities([]);
    }
  }, [formData.operatingRegion]);

  // Fetch cities when province changes
  useEffect(() => {
    if (formData.operatingProvince) {
      axios.get(`https://psgc.gitlab.io/api/provinces/${formData.operatingProvince}/cities-municipalities/`)
        .then((res) => setCities(res.data))
        .catch((err) => console.error("Failed to fetch cities:", err));
      
      // Reset city field
      setFormData((prev) => ({
        ...prev,
        operatingCity: "",
      }));
    } else {
      setCities([]);
    }
  }, [formData.operatingProvince]);

  // Validate form
  useEffect(() => {
    const newErrors = {};
    if (!formData.contactNumber?.trim()) {
      newErrors.contactNumber = "Contact number is required";
    } else if (!/^\d{10}$/.test(formData.contactNumber)) {
      newErrors.contactNumber = "Must be 10 digits (e.g. 9123456789)";
    }

    if (!formData.branchName?.trim()) newErrors.branchName = "Branch name is required";
    if (!formData.branchAddress?.trim()) newErrors.branchAddress = "Branch address is required";
    if (!formData.operatingRegion) newErrors.operatingRegion = "Region is required";
    if (!formData.operatingProvince) newErrors.operatingProvince = "Province is required";
    if (!formData.operatingCity) newErrors.operatingCity = "City/Municipality is required";
    if (!formData.openingTime || !formData.closingTime) {
      newErrors.operatingHours = "Both opening and closing times are required";
    }

    setErrors(newErrors);
    setIsValid(Object.keys(newErrors).length === 0);
  }, [formData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!isValid || !userId) return;
    console.log("valid")
    try {
      // Find the names for the selected codes
      const regionObj = regions.find((r) => r.code === formData.operatingRegion);
      const provinceObj = provinces.find((p) => p.code === formData.operatingProvince);
      const cityObj = cities.find((c) => c.code === formData.operatingCity);

      const operatingArea = [
        cityObj?.name,
        provinceObj?.name,
        regionObj?.name
      ].filter(Boolean).join(", ");

      const branchRef = await addDoc(collection(db, "branches"), {
        adminId: userId,
        branchName: formData.branchName,
        branchAddress: formData.branchAddress,
        operatingArea: operatingArea,
        operatingRegionCode: formData.operatingRegion,
        operatingRegionName: regionObj?.name || "",
        operatingProvinceCode: formData.operatingProvince,
        operatingProvinceName: provinceObj?.name || "",
        operatingCityCode: formData.operatingCity,
        operatingCityName: cityObj?.name || "",
        openingTime: formData.openingTime?.format("HH:mm") || "",
        closingTime: formData.closingTime?.format("HH:mm") || "",
        createdAt: serverTimestamp(),
      });
      console.log("Branch")
      await setDoc(doc(db, "users", userId), {
        fullName: formData.fullName,
        email: formData.email,
        contactNumber: formData.contactNumber,
        role: "admin",
        branchId: branchRef.id,
        createdAt: serverTimestamp(),
      }, { merge: true });

      console.log("user")
      setSubmitted(true);
      setTimeout(() => navigate("/dashboard"), 3000);
    } catch (error) {
      console.error("Error creating Firestore document:", error);
    }
  };

  return (
    <>
      {submitted && <SuccessMessage open />}
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh" sx={{ px: 2, py: 4 }}>
        <Paper sx={{ 
          p: { xs: 4, md: 5, lg: 5, xl: 6, xxl: 7 }, 
          width: "100%",
          maxWidth: responsiveDimensions.formWidth, 
          borderRadius: "1rem", 
          boxShadow: 3 
        }}>
          <Stack spacing={{ xs: 3, md: 3.5, lg: 4, xxl: 4.5 }}>
            <Typography
              variant="h4"
              align="center"
              sx={{
                fontFamily: "LEMON MILK",
                fontWeight: "bold",
                color: "#00b2e1",
                fontSize: responsiveFontSizes.h4,
              }}
            >
              Account Setup
            </Typography>

            {/* Basic Info */}
            <Paper
              elevation={0}
              sx={{ p: { xs: 2.5, md: 3, xxl: 3.5 }, borderRadius: 2, backgroundColor: "#f9f9f9" }}
            >
              <Box display="flex" alignItems="center" mb={2}>
                <PersonIcon sx={{ color: "#00b2e1", mr: 1 }} />
                <Typography
                  variant="h6"
                  sx={{
                    fontFamily: "LEMON MILK",
                    fontWeight: "bold",
                    color: "#00b2e1",
                    fontSize: responsiveFontSizes.h6,
                  }}
                >
                  Basic Information
                </Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
              <Stack spacing={{ xs: 2, md: 2.5, xxl: 3 }}>
                <TextField
                  label="Full Name"
                  value={formData.fullName}
                  disabled
                  fullWidth
                  variant="outlined"
                />
                <TextField
                  label="Email"
                  value={formData.email}
                  disabled
                  fullWidth
                  variant="outlined"
                />
                <TextField
                  name="contactNumber"
                  label="Contact Number"
                  value={formData.contactNumber}
                  onChange={handleChange}
                  fullWidth
                  variant="outlined"
                  error={!!errors.contactNumber}
                  helperText={errors.contactNumber}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <Select
                            value={formData.countryCode}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                countryCode: e.target.value,
                              }))
                            }
                            variant="standard"
                            disableUnderline
                            sx={{ mr: 1, fontSize: "0.9rem" }}
                          >
                            <MenuItem value="+63">🇵🇭 +63</MenuItem>
                            <MenuItem value="+1">🇺🇸 +1</MenuItem>
                            <MenuItem value="+44">🇬🇧 +44</MenuItem>
                          </Select>
                        </InputAdornment>
                      ),
                    }
                  }}
                />
              </Stack>
            </Paper>

            {/* Branch Info */}
            <Paper
              elevation={0}
              sx={{ p: { xs: 2.5, md: 3, xxl: 3.5 }, borderRadius: 2, backgroundColor: "#f9f9f9" }}
            >
              <Box display="flex" alignItems="center" mb={2}>
                <BusinessIcon sx={{ color: "#00b2e1", mr: 1 }} />
                <Typography
                  variant="h6"
                  sx={{
                    fontFamily: "LEMON MILK",
                    fontWeight: "bold",
                    color: "#00b2e1",
                    fontSize: responsiveFontSizes.h6,
                  }}
                >
                  Branch Information
                </Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
              <Stack spacing={{ xs: 2, md: 2.5, xxl: 3 }}>
                <TextField
                  name="branchName"
                  label="Branch Name"
                  value={formData.branchName}
                  onChange={handleChange}
                  fullWidth
                  variant="outlined"
                  error={!!errors.branchName}
                  helperText={errors.branchName}
                />
                <TextField
                  name="branchAddress"
                  label="Branch Address"
                  value={formData.branchAddress}
                  onChange={handleChange}
                  fullWidth
                  variant="outlined"
                  error={!!errors.branchAddress}
                  helperText={errors.branchAddress}
                />
                
                {/* Operating Area - Cascading Dropdowns */}
                <FormControl fullWidth variant="outlined" error={!!errors.operatingRegion}>
                  <InputLabel>Region</InputLabel>
                  <Select
                    name="operatingRegion"
                    value={formData.operatingRegion}
                    onChange={handleChange}
                    label="Region"
                  >
                    {regions.map((region) => (
                      <MenuItem key={region.code} value={region.code}>
                        {region.name}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.operatingRegion && (
                    <FormHelperText>{errors.operatingRegion}</FormHelperText>
                  )}
                </FormControl>

                <FormControl 
                  fullWidth 
                  variant="outlined" 
                  error={!!errors.operatingProvince}
                  disabled={!formData.operatingRegion}
                >
                  <InputLabel>Province</InputLabel>
                  <Select
                    name="operatingProvince"
                    value={formData.operatingProvince}
                    onChange={handleChange}
                    label="Province"
                  >
                    {provinces.map((province) => (
                      <MenuItem key={province.code} value={province.code}>
                        {province.name}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.operatingProvince && (
                    <FormHelperText>{errors.operatingProvince}</FormHelperText>
                  )}
                </FormControl>

                <FormControl 
                  fullWidth 
                  variant="outlined" 
                  error={!!errors.operatingCity}
                  disabled={!formData.operatingProvince}
                >
                  <InputLabel>City / Municipality</InputLabel>
                  <Select
                    name="operatingCity"
                    value={formData.operatingCity}
                    onChange={handleChange}
                    label="City / Municipality"
                  >
                    {cities.map((city) => (
                      <MenuItem key={city.code} value={city.code}>
                        {city.name}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.operatingCity && (
                    <FormHelperText>{errors.operatingCity}</FormHelperText>
                  )}
                </FormControl>

                <Box display="flex" gap={2}>
                  <TimePicker
                    label="Opening Time"
                    value={formData.openingTime || null}
                    onChange={(val) =>
                      setFormData((prev) => ({ ...prev, openingTime: val }))
                    }
                    slotProps={{
                      textField: { variant: "outlined", fullWidth: true },
                    }}
                  />
                  <TimePicker
                    label="Closing Time"
                    value={formData.closingTime || null}
                    onChange={(val) =>
                      setFormData((prev) => ({ ...prev, closingTime: val }))
                    }
                    slotProps={{
                      textField: { variant: "outlined", fullWidth: true },
                    }}
                  />
                </Box>
                {errors.operatingHours && (
                  <Typography variant="caption" color="error">
                    {errors.operatingHours}
                  </Typography>
                )}
              </Stack>
            </Paper>

            <Box mt={2} display="flex" justifyContent="space-between">
              <Button
                onClick={() => navigate("/")}
                sx={{
                  fontFamily: "LEMON MILK",
                  borderRadius: "10px",
                  padding: "10px 20px",
                }}
              >
                Cancel
              </Button>

              <Button
                onClick={handleSubmit}
                disabled={!isValid || submitted}
                sx={{
                  backgroundColor: "#00b2e1",
                  color: "white",
                  fontFamily: "LEMON MILK",
                  borderRadius: "10px",
                  padding: "10px 20px",
                  "&:hover": {
                    backgroundColor: "#0099c7",
                  },
                }}
              >
                {submitted ? "Saving..." : "Submit"}
              </Button>
            </Box>
          </Stack>
        </Paper>
      </Box>
    </>
  );
}
