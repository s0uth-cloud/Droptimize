import { useState } from "react";
import {
  Modal,
  Box,
  Button,
  Typography,
  Stack,
  Alert,
  CircularProgress,
  Paper,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { serverTimestamp } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { addParcel } from "../../services";

// Field name normalization mapping - flexible field matching
// These fields map to what is displayed in ParcelDetailsModal
const FIELD_MAPPINGS = {
  // Recipient fields (displayed in modal)
  recipient: ["recipient", "name", "customer", "receiver", "recipientname", "customer_name", "clientname", "customername", "to", "toname"],
  recipientContact: ["recipientcontact", "contact", "phone", "mobile", "phonenumber", "phone_number", "contactnumber", "tel", "telephone", "cellphone", "mobilenumber"],
  
  // Address fields (displayed in modal)
  street: ["street", "address", "streetaddress", "address1", "line1", "addr", "streetname", "houseaddress", "buildingaddress"],
  barangay: ["barangay", "brgy", "village", "district", "subdivision", "neighborhood"],
  municipality: ["municipality", "city", "town", "citymunicipality", "city_municipality", "citytown"],
  province: ["province", "state", "prov"],
  region: ["region", "area", "regionalarea"],
  
  // Parcel info fields (displayed in modal)
  weight: ["weight", "kg", "kilograms", "mass", "packageweight", "parcelweight", "wt", "weightkg"],
  message: ["message", "note", "notes", "remarks", "instructions", "comments", "specialinstructions", "deliveryinstructions", "memo"],
  reference: ["reference", "ref", "tracking", "trackingnumber", "parcelid", "packageid", "id", "orderid", "ordernumber", "referencenumber", "trackingid"],
  
  // Address parsing helper (not displayed directly but used to populate address fields)
  fulladdress: ["fulladdress", "completeaddress", "address2", "addressline", "addressfull"],
};

// Geocoding function with flexible address handling
async function geocodeAddress({ street, barangay, municipality, province, region }) {
  // Build address from available components
  const parts = [street, barangay, municipality, province, region].filter(part => part && part.trim()).join(", ");
  
  if (!parts.trim()) {
    console.warn("No address parts provided for geocoding");
    return null;
  }
  
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(parts)}&countrycodes=ph`;
  try {
    const res = await fetch(url, { headers: { "User-Agent": "DroptimizeApp/1.0" } });
    const data = await res.json();
    if (data.length > 0 && data[0].lat && data[0].lon) {
      const latitude = parseFloat(data[0].lat);
      const longitude = parseFloat(data[0].lon);
      
      if (isNaN(latitude) || isNaN(longitude)) {
        console.warn("Invalid coordinates from geocoding");
        return null;
      }
      
      return { latitude, longitude };
    }
  } catch (err) {
    console.error("❌ Geocoding failed:", err);
  }
  return null;
}

// Normalize field name to match our schema
function normalizeFieldName(fieldName) {
  const normalized = fieldName.toLowerCase().trim().replace(/[_\s-]/g, "");
  
  for (const [standardField, variations] of Object.entries(FIELD_MAPPINGS)) {
    if (variations.includes(normalized)) {
      return standardField;
    }
  }
  
  return fieldName; // Return original if no match found
}

// Philippine regions for matching
const PH_REGIONS = [
  "NCR", "CAR", "Region I", "Region II", "Region III", "Region IV-A", "Region IV-B", 
  "Region V", "Region VI", "Region VII", "Region VIII", "Region IX", "Region X", 
  "Region XI", "Region XII", "Region XIII", "BARMM", "Ilocos Region", "Cagayan Valley",
  "Central Luzon", "CALABARZON", "MIMAROPA", "Bicol Region", "Western Visayas",
  "Central Visayas", "Eastern Visayas", "Zamboanga Peninsula", "Northern Mindanao",
  "Davao Region", "SOCCSKSARGEN", "Caraga"
];

// Parse and separate address components
function parseAddressComponents(row) {
  // Check if we have a combined address field that should be separated
  // This includes both explicit "fulladdress" and cases where "address" was used but contains full address
  let fullAddress = row.fulladdress || "";
  
  // If street exists but looks like a full address (has commas), treat it as full address
  if (!fullAddress && row.street && row.street.includes(",")) {
    fullAddress = row.street;
    row.street = ""; // Will be reparsed
  }
  
  if (fullAddress && (!row.street || !row.barangay || !row.municipality)) {
    // Split by comma or semicolon
    const parts = fullAddress.split(/[,;]/).map(p => p.trim()).filter(p => p);
    
    // Try to identify and extract region
    if (!row.region) {
      for (let i = 0; i < parts.length; i++) {
        const upperPart = parts[i].toUpperCase();
        const matchedRegion = PH_REGIONS.find(r => upperPart === r.toUpperCase() || upperPart.includes(r.toUpperCase()));
        if (matchedRegion) {
          row.region = matchedRegion;
          parts.splice(i, 1); // Remove from parts
          break;
        }
      }
    }
    
    // Try to identify province (usually appears before city/municipality)
    if (!row.province && parts.length > 2) {
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        // Skip if it looks like a city/municipality
        if (/(city|municipality|town)$/i.test(part)) continue;
        // Skip if it looks like a barangay
        if (/^(brgy\.?|barangay)\s+/i.test(part)) continue;
        // Check if it might be a province (typically longer names, not street numbers)
        if (part.length > 4 && !/^\d/.test(part) && !/(st\.?|street|ave|avenue|road|blvd|boulevard)/i.test(part)) {
          // Could be province if we also have a city indicator after it
          if (i < parts.length - 1 && /(city|municipality|town)/i.test(parts.slice(i + 1).join(" "))) {
            row.province = part;
            parts.splice(i, 1);
            break;
          }
        }
      }
    }
    
    // Try to identify city/municipality (usually has "City", "Municipality", or is near the end)
    if (!row.municipality && parts.length > 0) {
      for (let i = parts.length - 1; i >= 0; i--) {
        const part = parts[i];
        if (/(city|municipality|town)/i.test(part)) {
          row.municipality = part;
          parts.splice(i, 1);
          break;
        }
      }
      // If still not found and we have parts, take the last one (usually city/municipality)
      if (!row.municipality && parts.length > 1) {
        row.municipality = parts.pop();
      }
    }
    
    // Try to identify barangay (usually has "Brgy", "Barangay" prefix)
    if (!row.barangay && parts.length > 0) {
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        if (/^(brgy\.?|barangay)\s+/i.test(part)) {
          row.barangay = part.replace(/^(brgy\.?|barangay)\s+/i, "").trim();
          parts.splice(i, 1);
          break;
        }
      }
      // If no explicit barangay marker and we have multiple parts, take one
      if (!row.barangay && parts.length > 1) {
        row.barangay = parts.pop();
      }
    }
    
    // Remaining parts are likely street address
    if (!row.street && parts.length > 0) {
      row.street = parts.join(", ");
    }
  }
  
  // Clean up fields
  if (row.barangay) {
    row.barangay = row.barangay.replace(/^(brgy\.?|barangay)\s+/i, "").trim();
  }
  
  if (row.municipality) {
    row.municipality = row.municipality.trim();
  }
  
  if (row.street) {
    row.street = row.street.trim();
  }
  
  if (row.province) {
    row.province = row.province.trim();
  }
  
  if (row.region) {
    row.region = row.region.trim();
  }
  
  // If region is NCR and province is also NCR or "Metro Manila", normalize it
  if (row.region && row.region.toUpperCase() === "NCR") {
    if (row.province && (row.province.toUpperCase() === "NCR" || row.province.toUpperCase().includes("METRO MANILA"))) {
      row.province = ""; // Clear province for NCR
    }
  }
  
  return row;
}

// Parse CSV content
function parseCSV(csvText) {
  const lines = csvText.split("\n").filter(line => line.trim());
  if (lines.length < 2) {
    throw new Error("CSV file must contain at least a header row and one data row");
  }

  // Parse header
  const headers = lines[0].split(",").map(h => normalizeFieldName(h.trim()));

  // Parse rows - only extract fields that are used in ParcelDetailsModal
  const rows = [];
  const allowedFields = new Set([
    'recipient', 'recipientContact', 'street', 'barangay', 
    'municipality', 'province', 'region', 'weight', 'message', 
    'reference', 'fulladdress'
  ]);
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map(v => v.trim().replace(/^"|"$/g, ""));
    const row = {};
    
    // Only include fields that are in our allowed list
    headers.forEach((header, index) => {
      if (allowedFields.has(header)) {
        row[header] = values[index] || "";
      }
    });
    
    // Parse and separate address components
    const parsedRow = parseAddressComponents(row);
    rows.push(parsedRow);
  }

  return rows;
}

export default function CSVImportModal({ open, handleClose, onSuccess }) {
  const [file, setFile] = useState(null);
  const [parsedData, setParsedData] = useState([]);
  const [importing, setImporting] = useState(false);
  const [preview, setPreview] = useState(false);
  const [errors, setErrors] = useState([]);
  const [successCount, setSuccessCount] = useState(0);

  const handleFileSelect = async (event) => {
    const selectedFile = event.target.files[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith(".csv")) {
      setErrors(["Please select a valid CSV file"]);
      return;
    }

    setFile(selectedFile);
    setErrors([]);

    // Read and parse the file
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csvText = e.target.result;
        const rows = parseCSV(csvText);
        
        // Relaxed validation - only check for essential fields
        const validationErrors = [];
        rows.forEach((row, index) => {
          // Core requirements: recipient name, contact, and reference number
          if (!row.recipient || !row.recipient.trim()) {
            validationErrors.push(`Row ${index + 1}: Missing recipient name`);
          }
          if (!row.recipientContact || !row.recipientContact.trim()) {
            validationErrors.push(`Row ${index + 1}: Missing contact information`);
          }
          if (!row.reference || !row.reference.trim()) {
            validationErrors.push(`Row ${index + 1}: Missing reference/tracking number`);
          }
          
          // At least one location field should be present for geocoding
          const hasLocation = row.region || row.province || row.municipality || row.barangay || row.street;
          if (!hasLocation) {
            validationErrors.push(`Row ${index + 1}: At least one location field (region, province, municipality, barangay, or street) is required`);
          }
          
          // Weight validation
          if (!row.weight || isNaN(parseFloat(row.weight))) {
            validationErrors.push(`Row ${index + 1}: Missing or invalid weight (must be a number)`);
          }
        });

        if (validationErrors.length > 0) {
          setErrors(validationErrors);
        } else {
          setParsedData(rows);
          setPreview(true);
        }
      } catch (error) {
        setErrors([`Failed to parse CSV: ${error.message}`]);
      }
    };
    reader.readAsText(selectedFile);
  };

  const handleImport = async () => {
    if (parsedData.length === 0) return;

    setImporting(true);
    setErrors([]);
    setSuccessCount(0);

    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) {
      setErrors(["No user logged in"]);
      setImporting(false);
      return;
    }

    let imported = 0;
    const importErrors = [];

    for (const [index, row] of parsedData.entries()) {
      try {
        // Attempt to geocode the address with multiple fallback strategies
        let destination = null;
        
        // Try full address first
        if (row.street || row.barangay || row.municipality || row.province || row.region) {
          destination = await geocodeAddress({
            street: row.street,
            barangay: row.barangay,
            municipality: row.municipality,
            province: row.province,
            region: row.region,
          });
        }

        // Fallback: Try without street
        if (!destination && (row.barangay || row.municipality || row.province)) {
          destination = await geocodeAddress({
            barangay: row.barangay,
            municipality: row.municipality,
            province: row.province,
          });
        }

        // Fallback: Try with just municipality and province
        if (!destination && row.municipality) {
          destination = await geocodeAddress({
            municipality: row.municipality,
            province: row.province,
          });
        }
        
        // Fallback: Try with just municipality
        if (!destination && row.municipality) {
          destination = await geocodeAddress({
            municipality: row.municipality,
          });
        }

        // Only include fields that are displayed in ParcelDetailsModal
        const parcelData = {
          // Recipient Information (displayed in modal)
          recipient: row.recipient,
          recipientContact: row.recipientContact || "",
          
          // Address Information (displayed in modal)
          street: row.street || "",
          barangay: row.barangay || "",
          municipality: row.municipality || "",
          province: row.province || "",
          region: row.region || "",
          
          // Parcel Information (displayed in modal)
          weight: parseFloat(row.weight || 0),
          message: row.message || "",
          reference: row.reference || "",
          
          // System fields (displayed in modal)
          status: "Pending",
          dateAdded: serverTimestamp(),
          
          // System fields (used by map/routing, not displayed in modal but required for functionality)
          destination: destination,
        };

        await addParcel(parcelData, user.uid);
        imported++;
        setSuccessCount(imported);

        // Small delay to avoid rate limiting
        await new Promise(r => setTimeout(r, 200));
      } catch (error) {
        console.error(`Error importing row ${index + 1}:`, error);
        importErrors.push(`Row ${index + 1}: ${error.message}`);
      }
    }

    setImporting(false);

    if (importErrors.length > 0) {
      setErrors(importErrors);
    }

    if (imported > 0) {
      onSuccess?.();
      if (imported === parsedData.length) {
        // All imported successfully
        setTimeout(() => {
          handleModalClose();
        }, 2000);
      }
    }
  };

  const handleModalClose = () => {
    setFile(null);
    setParsedData([]);
    setPreview(false);
    setErrors([]);
    setSuccessCount(0);
    handleClose();
  };

  return (
    <Modal open={open} onClose={handleModalClose}>
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          bgcolor: "white",
          borderRadius: 3,
          boxShadow: 24,
          p: 4,
          width: "90%",
          maxWidth: 900,
          maxHeight: "90vh",
          overflow: "auto",
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h5" fontWeight="bold" color="#00b2e1">
            Import Parcels from CSV
          </Typography>
          <IconButton onClick={handleModalClose}>
            <CloseIcon />
          </IconButton>
        </Stack>

        {/* Instructions */}
        {!preview && (
          <Paper sx={{ p: 2, mb: 3, bgcolor: "#f5f5f5" }}>
            <Typography variant="body2" mb={1} fontWeight="bold">
              CSV Format Requirements:
            </Typography>
            <Typography variant="body2" component="div">
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                <li>First row must contain column headers</li>
                <li><strong>Required:</strong> Recipient name, contact number, weight, and at least one location field</li>
                <li><strong>Location:</strong> Include region, province, municipality/city, barangay, or street</li>
                <li><strong>Optional:</strong> Message/notes, reference/tracking number</li>
                <li><strong>Flexible naming:</strong> Column names can vary (e.g., "Name" or "Recipient", "Phone" or "Contact")</li>
                <li><strong>Note:</strong> Extra columns will be ignored - only necessary fields are imported</li>
              </ul>
            </Typography>
          </Paper>
        )}

        {/* Error Messages */}
        {errors.length > 0 && (
          <Alert severity="error" sx={{ mb: 2 }}>
            <Typography variant="body2" fontWeight="bold" mb={1}>
              {errors.length} error(s) found:
            </Typography>
            {errors.slice(0, 5).map((error, idx) => (
              <Typography key={idx} variant="body2">
                • {error}
              </Typography>
            ))}
            {errors.length > 5 && (
              <Typography variant="body2" sx={{ mt: 1, fontStyle: "italic" }}>
                ...and {errors.length - 5} more errors
              </Typography>
            )}
          </Alert>
        )}

        {/* Success Message */}
        {successCount > 0 && (
          <Alert severity="success" sx={{ mb: 2 }} icon={<CheckCircleIcon />}>
            Successfully imported {successCount} of {parsedData.length} parcels
          </Alert>
        )}

        {/* File Upload */}
        {!preview && (
          <Box sx={{ textAlign: "center", py: 4 }}>
            <input
              accept=".csv"
              style={{ display: "none" }}
              id="csv-file-input"
              type="file"
              onChange={handleFileSelect}
            />
            <label htmlFor="csv-file-input">
              <Button
                variant="contained"
                component="span"
                startIcon={<UploadFileIcon />}
                sx={{
                  bgcolor: "#00b2e1",
                  "&:hover": { bgcolor: "#0090b8" },
                  px: 4,
                  py: 1.5,
                }}
              >
                Select CSV File
              </Button>
            </label>
            {file && (
              <Typography variant="body2" sx={{ mt: 2, color: "#666" }}>
                Selected: {file.name}
              </Typography>
            )}
          </Box>
        )}

        {/* Preview Table */}
        {preview && !importing && successCount === 0 && (
          <>
            <Stack direction="row" spacing={1} alignItems="center" mb={2}>
              <Typography variant="body1" fontWeight="bold">
                Review before importing: {parsedData.length} parcels
              </Typography>
              <Chip label={`${parsedData.length} rows`} color="primary" size="small" />
            </Stack>

            <Alert severity="info" sx={{ mb: 2 }}>
              Please carefully review all parcel details below before importing. Scroll through the table to verify all information is correct.
            </Alert>

            <TableContainer component={Paper} sx={{ mb: 3, maxHeight: 500 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell><strong>#</strong></TableCell>
                    <TableCell><strong>Reference</strong></TableCell>
                    <TableCell><strong>Recipient</strong></TableCell>
                    <TableCell><strong>Contact</strong></TableCell>
                    <TableCell><strong>Region</strong></TableCell>
                    <TableCell><strong>Province</strong></TableCell>
                    <TableCell><strong>Municipality</strong></TableCell>
                    <TableCell><strong>Barangay</strong></TableCell>
                    <TableCell><strong>Street</strong></TableCell>
                    <TableCell><strong>Weight (kg)</strong></TableCell>
                    <TableCell><strong>Message</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {parsedData.map((row, idx) => (
                    <TableRow key={idx} hover>
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell>{row.reference || "-"}</TableCell>
                      <TableCell sx={{ fontWeight: "bold" }}>{row.recipient}</TableCell>
                      <TableCell>{row.recipientContact}</TableCell>
                      <TableCell>{row.region}</TableCell>
                      <TableCell>{row.province}</TableCell>
                      <TableCell>{row.municipality}</TableCell>
                      <TableCell>{row.barangay}</TableCell>
                      <TableCell>{row.street || "-"}</TableCell>
                      <TableCell>{row.weight}</TableCell>
                      <TableCell sx={{ maxWidth: 150, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {row.message || "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Stack direction="row" spacing={2} justifyContent="space-between" alignItems="center">
              <Typography variant="body2" color="text.secondary">
                Total parcels to import: <strong>{parsedData.length}</strong>
              </Typography>
              <Stack direction="row" spacing={2}>
                <Button onClick={handleModalClose} variant="outlined">
                  Cancel
                </Button>
                <Button
                  onClick={handleImport}
                  variant="contained"
                  sx={{ bgcolor: "#29bf12", "&:hover": { bgcolor: "#24a810" } }}
                  startIcon={<CheckCircleIcon />}
                >
                  Import {parsedData.length} Parcels
                </Button>
              </Stack>
            </Stack>
          </>
        )}

        {/* Importing Progress */}
        {importing && (
          <Box sx={{ textAlign: "center", py: 4 }}>
            <CircularProgress size={60} sx={{ color: "#00b2e1" }} />
            <Typography variant="h6" sx={{ mt: 2 }}>
              Importing parcels...
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {successCount} of {parsedData.length} completed
            </Typography>
          </Box>
        )}
      </Box>
    </Modal>
  );
}
