import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert,
  CircularProgress,
  Box,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import InfoIcon from "@mui/icons-material/Info";
import { runAllMigrations } from "../../utils/migrationApi";

export default function BranchCodeMigrationDialog({ open, onClose }) {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState("");

  const handleRunMigration = async () => {
    setLoading(true);
    setError("");
    setResults(null);

    try {
      const migrationResults = await runAllMigrations();
      setResults(migrationResults);

      if (!migrationResults.success) {
        setError("Some migrations failed. Please review the results.");
      }
    } catch (err) {
      setError(err.message || "Migration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setLoading(false);
    setResults(null);
    setError("");
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: "bold", color: "#00b2e1" }}>
        Fix Branch Codes Migration
      </DialogTitle>

      <DialogContent sx={{ mt: 2 }}>
        {!results ? (
          <>
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">
                This will migrate existing branch accounts to use human-readable branch codes
                if they don't already have them. This is needed to:
              </Typography>
              <List dense sx={{ mt: 1 }}>
                <ListItem disableGutters>
                  <ListItemText primary="✓ Generate proper branch codes for QR codes" />
                </ListItem>
                <ListItem disableGutters>
                  <ListItemText primary="✓ Ensure drivers can join branches using branch codes" />
                </ListItem>
                <ListItem disableGutters>
                  <ListItemText primary="✓ Fix admin accounts missing branch references" />
                </ListItem>
              </List>
            </Alert>

            <Alert severity="warning">
              <Typography variant="body2">
                <strong>Note:</strong> This operation may take a few minutes depending on the
                number of branches. Do not close this dialog during the process.
              </Typography>
            </Alert>
          </>
        ) : (
          <Box>
            <Typography variant="h6" sx={{ mb: 2, color: "#00b2e1", fontWeight: "bold" }}>
              Migration Results:
            </Typography>

            {results.results.map((result, index) => (
              <Box key={index} sx={{ mb: 2, p: 2, backgroundColor: "#f5f5f5", borderRadius: 1 }}>
                <Box display="flex" alignItems="center" mb={1}>
                  {result.success ? (
                    <CheckCircleIcon sx={{ color: "#4caf50", mr: 1 }} />
                  ) : (
                    <ErrorIcon sx={{ color: "#f44336", mr: 1 }} />
                  )}
                  <Typography variant="body1" sx={{ fontWeight: "bold" }}>
                    {result.name}
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ color: "#666", pl: 4 }}>
                  {result.message}
                </Typography>

                {result.data?.branchesProcessed && (
                  <Typography variant="caption" sx={{ display: "block", pl: 4, mt: 1 }}>
                    Processed: {result.data.branchesProcessed} branches
                  </Typography>
                )}

                {result.data?.adminsFixed !== undefined && (
                  <Typography variant="caption" sx={{ display: "block", pl: 4, mt: 0.5 }}>
                    Fixed: {result.data.adminsFixed} admin accounts
                  </Typography>
                )}
              </Box>
            ))}

            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}

            {results.success && (
              <Alert severity="success" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  <strong>Migration completed successfully!</strong> Branch codes are now properly
                  configured. When you take a screenshot of the QR code in the sidebar, drivers
                  will be able to scan it to join your branch.
                </Typography>
              </Alert>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={handleClose} disabled={loading}>
          {results ? "Close" : "Cancel"}
        </Button>
        {!results && (
          <Button
            onClick={handleRunMigration}
            disabled={loading}
            variant="contained"
            sx={{ backgroundColor: "#00b2e1" }}
          >
            {loading ? <CircularProgress size={24} /> : "Run Migration"}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
