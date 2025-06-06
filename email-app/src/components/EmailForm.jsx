import React, { useState } from 'react';
import { Button, TextField } from '@mui/material';
import { useSnackbar }  from './SnackbarContext'; 
import './EmailForm.css';

function EmailForm() {
  const [form, setForm] = useState({ email: '', message: '' });
  const [errors, setErrors] = useState({ email: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const { showSnackbar } = useSnackbar();

  const validateEmail = (value) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let valid = true;
    let newErrors = { email: '', message: '' };

    if (!form.email) {
      newErrors.email = 'Email is required';
      valid = false;
    } else if (!validateEmail(form.email)) {
      newErrors.email = 'Enter a valid email';
      valid = false;
    }

    if (!form.message) {
      newErrors.message = 'Message is required';
      valid = false;
    }

    setErrors(newErrors);
    if (!valid) return;

    setSubmitting(true);
    try {
      // Send POST request to backend
      const res = await fetch('http://localhost:4000/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showSnackbar('Email sent successfully!', 'success');
        setForm({ email: '', message: '' });
      } else {
        showSnackbar(data.error || 'Failed to send email. Please try again.', 'error');
      }
     } catch (error) {
      console.error('Error sending email:', error);
      showSnackbar('An unexpected error occurred', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="email-form-container">
        <TextField
          fullWidth
          type="email"
          name="email"
          label="Email"
          variant="outlined"
          margin="normal"
          value={form.email}
          onChange={handleChange}
          required
          error={!!errors.email}
          helperText={errors.email}
        />
        <TextField
          fullWidth
          multiline
          rows={4}
          name="message"
          label="Message"
          variant="outlined"
          margin="normal"
          value={form.message}
          onChange={handleChange}
          required
          error={!!errors.message}
          helperText={errors.message}
        />
        <Button 
          type="submit"
          variant="contained" 
          color="primary"
          style={{ marginTop: '20px' }}
          disabled={submitting}
        >
          {submitting ? 'Sending...' : 'Send'}
        </Button>
      </div>
    </form>
  );
}

export default EmailForm;