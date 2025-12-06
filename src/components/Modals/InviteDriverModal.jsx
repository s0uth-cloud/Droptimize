import { useState, useEffect } from "react";
import {
  Modal,
  Box,
  Button,
  Typography,
  Stack,
  TextField,
  Alert,
  Tabs,
  Tab,
  Paper,
  IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import QrCode2Icon from "@mui/icons-material/QrCode2";
import EmailIcon from "@mui/icons-material/Email";
import QRCode from "react-qr-code";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig";

export default function InviteDriverModal({ open, handleClose, branchId }) {
  const [activeTab, setActiveTab] = useState(0);
  const [email, setEmail] = useState("");
  const [emails, setEmails] = useState([]);
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [branchCode, setBranchCode] = useState("");
  const [branchName, setBranchName] = useState("");
  const [copied, setCopied] = useState(false);

  // Fetch branch details when modal opens or branchId changes
  useEffect(() => {
    if (open && branchId) {
      const fetchBranchDetails = async () => {
        try {
          const branchRef = doc(db, "branches", branchId);
          const branchSnap = await getDoc(branchRef);
          if (branchSnap.exists()) {
            const data = branchSnap.data();
            setBranchCode(branchId);
            setBranchName(data.name || data.branchName || branchId);
          } else {
            // If branch doesn't exist in branches collection, use branchId directly
            setBranchCode(branchId);
            setBranchName(branchId);
          }
        } catch (err) {
          console.error("Error fetching branch:", err);
          // Fallback to using branchId directly
          setBranchCode(branchId);
          setBranchName(branchId);
        }
      };
      fetchBranchDetails();
    }
  }, [open, branchId]);

  const handleAddEmail = () => {
    if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      if (!emails.includes(email)) {
        setEmails([...emails, email]);
        setEmail("");
        setError("");
      } else {
        setError("Email already added");
      }
    } else {
      setError("Please enter a valid email address");
    }
  };

  const handleRemoveEmail = (emailToRemove) => {
    setEmails(emails.filter((e) => e !== emailToRemove));
  };

  const handleSendInvites = async () => {
    if (emails.length === 0) {
      setError("Please add at least one email address");
      return;
    }

    setSending(true);
    setError("");
    setSuccess("");

    try {
      // In a real implementation, you would call a Cloud Function or backend API
      // to send emails. For now, we'll simulate it.
      
      // Simulated API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      setSuccess(`Invitation sent to ${emails.length} driver(s)!`);
      setEmails([]);
      
      // Close modal after 2 seconds
      setTimeout(() => {
        handleModalClose();
      }, 2000);
    } catch (err) {
      console.error("Error sending invites:", err);
      setError("Failed to send invitations. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(branchCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleModalClose = () => {
    setEmail("");
    setEmails([]);
    setError("");
    setSuccess("");
    setActiveTab(0);
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
          maxWidth: 600,
          maxHeight: "90vh",
          overflow: "auto",
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h5" fontWeight="bold" color="#00b2e1">
            Invite Drivers
          </Typography>
          <IconButton onClick={handleModalClose}>
            <CloseIcon />
          </IconButton>
        </Stack>

        {branchName && (
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2">
              <strong>Branch:</strong> {branchName}
            </Typography>
            <Typography variant="body2">
              <strong>Join Code:</strong> {branchCode}
            </Typography>
          </Alert>
        )}

        <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)} sx={{ mb: 3 }}>
          <Tab icon={<EmailIcon />} label="Email Invite" />
          <Tab icon={<QrCode2Icon />} label="QR Code" />
        </Tabs>

        {/* Email Invite Tab */}
        {activeTab === 0 && (
          <Box>
            <Typography variant="body1" mb={2}>
              Send email invitations to drivers with the branch join code.
            </Typography>

            <Stack direction="row" spacing={1} mb={2}>
              <TextField
                fullWidth
                label="Driver Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleAddEmail()}
                type="email"
                size="small"
              />
              <Button
                variant="contained"
                onClick={handleAddEmail}
                sx={{ bgcolor: "#00b2e1", minWidth: 100 }}
              >
                Add
              </Button>
            </Stack>

            {emails.length > 0 && (
              <Paper sx={{ p: 2, mb: 2, maxHeight: 200, overflow: "auto" }}>
                <Typography variant="body2" fontWeight="bold" mb={1}>
                  Recipients ({emails.length}):
                </Typography>
                <Stack spacing={1}>
                  {emails.map((e, idx) => (
                    <Stack key={idx} direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2">{e}</Typography>
                      <IconButton size="small" onClick={() => handleRemoveEmail(e)}>
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  ))}
                </Stack>
              </Paper>
            )}

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {success && (
              <Alert severity="success" sx={{ mb: 2 }}>
                {success}
              </Alert>
            )}

            <Button
              fullWidth
              variant="contained"
              onClick={handleSendInvites}
              disabled={sending || emails.length === 0}
              sx={{
                bgcolor: "#29bf12",
                "&:hover": { bgcolor: "#24a810" },
                py: 1.5,
              }}
            >
              {sending ? "Sending..." : `Send Invitation${emails.length > 1 ? "s" : ""}`}
            </Button>

            <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: "block" }}>
              Note: Invited drivers will receive an email with instructions and the branch join code.
            </Typography>
          </Box>
        )}

        {/* QR Code Tab */}
        {activeTab === 1 && (
          <Box sx={{ textAlign: "center" }}>
            <Typography variant="body1" mb={3}>
              Drivers can scan this QR code to join your branch instantly.
            </Typography>

            <Box
              sx={{
                display: "inline-block",
                p: 3,
                bgcolor: "#fff",
                borderRadius: 2,
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              }}
            >
              <QRCode value={branchCode} size={250} level="H" />
            </Box>

            <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>
              Join Code: {branchCode}
            </Typography>

            <Button
              variant="outlined"
              startIcon={<ContentCopyIcon />}
              onClick={handleCopyCode}
              sx={{ mt: 2 }}
            >
              {copied ? "Copied!" : "Copy Code"}
            </Button>

            <Typography variant="caption" color="text.secondary" sx={{ mt: 3, display: "block" }}>
              Drivers can also manually enter this code in the app during account setup.
            </Typography>
          </Box>
        )}
      </Box>
    </Modal>
  );
}
