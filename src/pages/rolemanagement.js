import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Checkbox,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  Snackbar,
  InputAdornment,
  Tooltip,
} from '@mui/material';
import {
  Add,
  Close,
  Edit,
  Visibility,
  Delete,
  Search as SearchIcon,
} from '@mui/icons-material';
import Swal from 'sweetalert2';
import { useAuth, api } from "../context/AuthContext";

const modules = [
  { key: "campaigns",       label: "Campaigns" },
  { key: "analytics",       label: "Analytics" },
  { key: "leads",           label: "Leads" },
  { key: "channels",        label: "Channels" },
  { key: "scheduler",       label: "Scheduler" },
  { key: "role_management", label: "Role Management" },
];

const actions = ["Create", "Read", "Update", "Delete"];

export default function RoleManagement() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "super_admin";

  const [roles, setRoles] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [mode, setMode] = useState("add"); // "add" | "edit" | "view"
  const [currentRole, setCurrentRole] = useState(null);

  const [form, setForm] = useState({
    role_name: "",
    role_key: "",
    permissions: {},
  });

  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  useEffect(() => {
    if (isSuperAdmin) fetchRoles();
  }, [isSuperAdmin]);

  const fetchRoles = async () => {
    try {
      const res = await api.get("/api/v1/admin/roles");
      console.log(res.data);
      
      // Handle the new payload structure
      let roleList = [];
      
      if (res.data?.data && typeof res.data.data === 'object') {
        // If response has a data property that contains roles object
        if (res.data.data.permissions) {
          // Single role object with permissions
          roleList = [{
            key: res.data.data.role_id || res.data.data.role_key || "admin",
            label: res.data.data.role_name || formatLabel(res.data.data.role_id),
            permissions: res.data.data.permissions || {}
          }];
        } else {
          // Multiple roles object where each key is a role
          roleList = Object.entries(res.data.data).map(([key, value]) => ({
            key: key,
            label: value.role_name || formatLabel(key),
            permissions: value.permissions || value || {}
          }));
        }
      } else if (res.data?.roles && typeof res.data.roles === 'object') {
        // Handle roles property
        roleList = Object.entries(res.data.roles).map(([key, value]) => ({
          key: key,
          label: value.role_name || formatLabel(key),
          permissions: value.permissions || value || {}
        }));
      } else if (Array.isArray(res.data)) {
        // Handle array response
        roleList = res.data.map(role => ({
          key: role.role_id || role.role_key || role.key,
          label: role.role_name || role.label || formatLabel(role.role_id),
          permissions: role.permissions || {}
        }));
      } else if (typeof res.data === 'object' && res.data !== null) {
        // Handle direct object response (like the payload you showed)
        if (res.data.permissions) {
          // Single role object
          roleList = [{
            key: res.data.role_id || res.data.role_key || "admin",
            label: res.data.role_name || formatLabel(res.data.role_id),
            permissions: res.data.permissions
          }];
        } else {
          // Try to extract roles from the object
          roleList = Object.entries(res.data)
            .filter(([key, value]) => value && typeof value === 'object' && (value.permissions || value.role_name))
            .map(([key, value]) => ({
              key: key,
              label: value.role_name || formatLabel(key),
              permissions: value.permissions || value
            }));
        }
      }
      
      setRoles(roleList);
    } catch (err) {
      console.error("Error fetching roles:", err);
      setSnackbar({ open: true, message: "Failed to load roles", severity: "error" });
    }
  };

  const formatLabel = (key) => key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, " ");

  const openAdd = () => {
    setMode("add");
    setCurrentRole(null);
    setForm({
      role_name: "",
      role_key: "",
      permissions: modules.reduce((acc, m) => {
        acc[m.key] = { Create: false, Read: false, Update: false, Delete: false };
        return acc;
      }, {}),
    });
    setDialogOpen(true);
  };

  const openEdit = (role) => {
    setMode("edit");
    setCurrentRole(role);
    setForm({
      role_name: role.label,
      role_key: role.key,
      permissions: { ...role.permissions },
    });
    setDialogOpen(true);
  };

  const openView = (role) => {
    setMode("view");
    setCurrentRole(role);
    setForm({
      role_name: role.label,
      role_key: role.key,
      permissions: { ...role.permissions },
    });
    setDialogOpen(true);
  };

  const handleClose = () => setDialogOpen(false);

  const handleNameChange = (e) => {
    const value = e.target.value;
    const newKey = value.trim().toLowerCase().replace(/\s+/g, "_");
    setForm((prev) => ({ ...prev, role_name: value, role_key: newKey }));
  };

  const togglePermission = (moduleKey, action) => {
    if (mode === "view") return;
    setForm((prev) => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [moduleKey]: {
          ...prev.permissions[moduleKey],
          [action]: !prev.permissions[moduleKey]?.[action],
        },
      },
    }));
  };

  const handleSave = async () => {
    if (mode !== "add" && mode !== "edit") return;
    if (!form.role_name.trim()) {
      setSnackbar({ open: true, message: "Role name is required", severity: "error" });
      return;
    }

    const payload = {
      role_name: form.role_name.trim(),
      role_key: form.role_key,
      permissions: form.permissions,
    };

    try {
      if (mode === "add") {
        await api.post("/api/v1/admin/roles", payload);
        setSnackbar({ open: true, message: "Role created successfully", severity: "success" });
      } else {
        await api.put(`/api/v1/admin/roles/${form.role_key}`, payload);
        setSnackbar({ open: true, message: "Role updated successfully", severity: "success" });
      }
      fetchRoles();
      handleClose();
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.response?.data?.detail || "Failed to save role",
        severity: "error",
      });
    }
  };

  const handleDelete = (role) => {
    Swal.fire({
      title: "Confirm Delete",
      text: `Delete role "${role.label}"? This action cannot be undone.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d32f2f",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await api.delete(`/api/v1/admin/roles/${role.key}`);
          setSnackbar({ open: true, message: "Role deleted successfully", severity: "success" });
          fetchRoles();
        } catch (err) {
          setSnackbar({ open: true, message: "Failed to delete role", severity: "error" });
        }
      }
    });
  };

  const filteredRoles = roles.filter((r) =>
    r.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isSuperAdmin) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">Super Admin access required.</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth={false} disableGutters sx={{ px: { xs: 2, md: 4 }, py: 3 }}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          justifyContent: "space-between",
          alignItems: { sm: "center" },
          gap: 2,
          mb: 3,
        }}
      >
        <TextField
          placeholder="Search roles..."
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ minWidth: 320 }}
          InputProps={{
            endAdornment: <InputAdornment position="end"><SearchIcon /></InputAdornment>,
          }}
        />

        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={openAdd}
          sx={{
            bgcolor: "#0b85c8",
            "&:hover": { bgcolor: "#096aa3" },
            textTransform: "none",
            px: 3,
          }}
        >
          Add New Role
        </Button>
      </Box>

      {/* Roles Table */}
      <TableContainer component={Paper} elevation={1} sx={{ mb: 4 }}>
        <Table size="medium">
          <TableHead sx={{ bgcolor: "#0b85c8" }}>
            <TableRow>
              <TableCell sx={{ color: "white", fontWeight: 600, pl: 3 }}>Role Name</TableCell>
              <TableCell align="center" sx={{ color: "white", fontWeight: 600, width: 180 }}>
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredRoles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={2} align="center" sx={{ py: 5 }}>
                  <Typography color="text.secondary">No roles found</Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredRoles.map((role) => (
                <TableRow key={role.key} hover>
                  <TableCell sx={{ pl: 3, fontWeight: 500 }}>
                    {role.label}
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="View Permissions">
                      <IconButton
                        size="small"
                        onClick={() => openView(role)}
                        sx={{ color: "#0b85c8", mr: 1 }}
                      >
                        <Visibility fontSize="small" />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="Edit Role">
                      <IconButton
                        size="small"
                        onClick={() => openEdit(role)}
                        sx={{ color: "#1976d2", mr: 1 }}
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="Delete Role">
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(role)}
                        color="error"
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <Box
          sx={{
            bgcolor: "#f8f9fa",
            px: 3,
            py: 2,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <DialogTitle sx={{ p: 0, color: "#0b85c8", fontWeight: 600 }}>
            {mode === "add" ? "Create New Role" : mode === "edit" ? "Edit Role" : "View Role Permissions"}
          </DialogTitle>
          <IconButton onClick={handleClose} size="small">
            <Close sx={{ color: "#0b85c8" }} />
          </IconButton>
        </Box>

        <DialogContent dividers sx={{ p: 3, bgcolor: "#ffffff" }}>
          <TextField
            fullWidth
            label="Role Name"
            value={form.role_name}
            onChange={handleNameChange}
            disabled={mode === "view"}
            variant="outlined"
            size="small"
            sx={{ mb: 4, maxWidth: 500 }}
            error={mode !== "view" && !form.role_name.trim()}
            helperText={mode !== "view" && !form.role_name.trim() ? "Role name is required" : " "}
          />

          <Typography variant="h6" sx={{ color: "#0b85c8", mb: 2, fontWeight: 600 }}>
            Permissions
          </Typography>

          <TableContainer component={Paper} elevation={1}>
            <Table size="small">
              <TableHead sx={{ bgcolor: "#f1f5f9" }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, pl: 3 }}>Module</TableCell>
                  {actions.map((act) => (
                    <TableCell key={act} align="center" sx={{ fontWeight: 600 }}>
                      {act}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {modules.map((mod) => (
                  <TableRow key={mod.key} hover>
                    <TableCell sx={{ pl: 3, fontWeight: 500 }}>{mod.label}</TableCell>
                    {actions.map((act) => (
                      <TableCell key={act} align="center">
                        <Checkbox
                          checked={!!form.permissions[mod.key]?.[act]}
                          onChange={() => togglePermission(mod.key, act)}
                          disabled={mode === "view"}
                          sx={{
                            color: "#0b85c8",
                            "&.Mui-checked": { color: "#0b85c8" },
                          }}
                        />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {mode !== "view" && (
            <Box sx={{ mt: 4, textAlign: "center" }}>
              <Button
                variant="contained"
                onClick={handleSave}
                sx={{
                  bgcolor: "#0b85c8",
                  px: 5,
                  py: 1.2,
                  textTransform: "none",
                  "&:hover": { bgcolor: "#096aa3" },
                }}
              >
                {mode === "add" ? "Create Role" : "Update Role"}
              </Button>
            </Box>
          )}
        </DialogContent>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}